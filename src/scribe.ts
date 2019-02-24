import browserSync = require('browser-sync');
import {compose} from 'fp-ts/lib/function';
import path = require('path');
import * as R from 'ramda';
import * as Rx from 'rxjs';
import * as RxO from 'rxjs/operators';

import * as frontmatterAdapter from './adapters/grayMatter';
import * as markdownAdapter from './adapters/markdown';
import * as templateAdapter from './adapters/pug';
import * as styleAdapter from './adapters/scss';

import {Config} from './core/config';
import * as IO from './core/file';
import {reducePages, toPage} from './core/page';
import * as P from './core/path';
import {reducePostContext, toPost, validatePost} from './core/post';
import * as V from './lib/validation';
import * as T from './types';

/**
 * Implements transforming a file to a domain post.
 */
const fileToPostV = ({
  fileToHtml,
  fileToFrontmatter,
  destinationDirectory,
}: {
  fileToHtml: T.FileToHtml;
  fileToFrontmatter: T.FileToFrontmatter;
  destinationDirectory: T.Path;
}) => (file: T.File): V.Validation<T.UserPost> => {
  try {
    const frontmatter = fileToFrontmatter(file);
    const postContent = fileToHtml(file);
    const destinationPath = path.join(
      destinationDirectory,
      frontmatter.slug + '.html',
    );

    return V.pass({
      frontmatter,
      postContent,
      sourcePath: file.filepath,
      destinationPath,
    });
  } catch (e) {
    return V.fail(e.message);
  }
};

const compilePostV = (adapter: T.PostToFile) => (p: T.Path) => (
  post: T.Post,
): V.Validation<T.File> => {
  try {
    return V.pass(adapter(p)(post));
  } catch (e) {
    return V.fail(e.message);
  }
};

const compileStylesV = (adapter: any) => async (
  style: any,
): Promise<V.Validation<T.File>> => {
  try {
    const result = await adapter(style);
    return V.pass(result);
  } catch (e) {
    return V.fail(e.message);
  }
};

/**
 * Implements compiling pages. Compiles a list of pages from page and post
 * contexts.
 */
const compilePagesV = (compilePage: T.PageToFile) => ([
  pageContext,
  postContext,
]: [T.PageContext, T.PostContext]) => {
  const pages: Array<V.Validation<T.File>> = [];
  for (const page of Object.values(pageContext)) {
    try {
      const result = compilePage(page)(postContext);
      pages.push(V.pass(result));
    } catch (e) {
      pages.push(V.fail(e.message));
    }
  }

  return pages;
};

/**
 * Implements compiling posts by combining the latest layout context and a
 * post.
 */
const compilePostsV = ([post, layoutContext]: [
  V.Validation<T.Post>,
  T.LayoutContext
]) => {
  if (V.isFailure(post)) {
    return post;
  } else {
    // FIXME: Note that I'm assuming only _one_ layout for now.
    const template = R.values(layoutContext)[0];
    return compilePostV(templateAdapter.compilePost)(template.full)(post.value);
  }
};

export default (config: Config) => {
  // ===========================================================================
  // Hot Reloading.
  // ===========================================================================

  // Initialize browsersync instance, which kinda does its own thing on the
  // side. For now I don't really mind that its impure because its tangiential
  // to the core flow.
  browserSync.create().init({
    logLevel: 'silent',
    online: false,
    server: config.destination.root,
    open: false,
    reloadOnRestart: true,
    injectChanges: true,
    watch: true,
  });

  // ===========================================================================
  // File Sources.
  // ===========================================================================

  // Stream of post source files.
  const postSource$ = IO.watchDirContents(config.posts);

  // Stream of page source files.
  const pageSource$ = IO.watchDirPaths(config.pages);

  // Stream of scss source files.
  const stylesSource$ = IO.watchDirPaths(config.styles)
    .pipe(RxO.debounceTime(100))
    .pipe(RxO.flatMap(_ => IO.readFile(config.styleIndex)));

  // Stream of layouts.
  const layouts$ = IO.watchDirPaths(config.layouts);

  // ===========================================================================
  // Layouts.
  // ===========================================================================

  const reduceLayouts = (layouts: T.LayoutContext, p: T.Path) => {
    const _p = P.parse(p);

    layouts[_p.name] = _p;
    return layouts;
  };

  const layoutContext$ = layouts$.pipe(RxO.scan(reduceLayouts, {}));

  // ===========================================================================
  // Posts.
  // ===========================================================================

  // const postDestination = path.join(config.destination, 'posts');

  // Stream of posts.
  const posts$ = postSource$.pipe(
    RxO.map(
      compose(
        V.map(toPost),
        V.flatMap(validatePost(config)),
        fileToPostV({
          fileToFrontmatter: frontmatterAdapter.fileToFrontmatter,
          fileToHtml: markdownAdapter.fileToHtml,
          destinationDirectory: config.destination.posts,
        }),
      ),
    ),
  );

  // Stream of compiled post files.
  const compiledPosts$ = Rx.combineLatest(posts$, layoutContext$).pipe(
    RxO.map(compilePostsV),
  );

  // ===========================================================================
  // Compiling Pages.
  // ===========================================================================

  // Because I haven't figured out yet how to scan over an Observable of
  // Validations I'm leaving the context of Validation for accumulating the
  // contexts until there is actually a possibility of failure.

  // Partition off the failed posts.
  const failedPosts$ = posts$.pipe(RxO.filter(V.isFailure));

  // Stream of accumulated post context.
  const postContext$ = posts$.pipe(
    RxO.filter(V.isSuccess),
    RxO.map(v => v.value),
    RxO.scan(reducePostContext, {posts: {}}),
  );

  const isIncludedFile = (s: string) => !!s.match(/.+\/_.+/);

  // Stream of accumulated page context.
  const pageContext$ = pageSource$.pipe(
    RxO.filter(R.complement(isIncludedFile)),
    RxO.map(toPage(config.destination.root)),
    RxO.scan(reducePages, {}),
    RxO.debounceTime(200),
  );

  // Now that I'm done accumulating context and because I have the
  // possibility of failure again, I'm re-entering the realm of Validation.

  // Stream of compiled pages.
  const compiledPages$ = Rx.combineLatest(pageContext$, postContext$).pipe(
    RxO.flatMap(compilePagesV(templateAdapter.compilePage)),
  );

  // ===========================================================================
  // Compiling Styles.
  // ===========================================================================

  // Stream of compiled styles.
  const compiledStyles$ = stylesSource$.pipe(
    RxO.map(({content}) => ({
      content,
      includePaths: [config.styles],
      filepath: config.destination.styles,
    })),
    RxO.flatMap(compileStylesV(styleAdapter.compileCss)),
    RxO.debounceTime(200),
  );

  return Rx.merge(
    failedPosts$,
    compiledPosts$,
    compiledPages$,
    compiledStyles$,
  );
};
