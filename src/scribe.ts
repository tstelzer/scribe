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
import * as f from './core/file';
import {reducePages, toPage} from './core/page';
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

export default (config: Config) => {
  // ===========================================================================
  // Hot Reloading.
  // ===========================================================================

  // Initialize browsersync instance, which kinda does its own thing on the
  // side. For now I don't really mind that its impure because its tangiential
  // to the main business logic.
  browserSync.create().init({
    logLevel: 'silent',
    online: false,
    server: config.destination,
    open: false,
    reloadOnRestart: true,
    injectChanges: true,
    watch: true,
  });

  // ===========================================================================
  // File Sources.
  // ===========================================================================

  // Stream of post source files.
  const postSource$ = f.watchDirContents(config.posts);

  // Stream of page source files.
  const pageSource$ = f.watchDirPaths(config.pages);

  // Stream of scss source files.
  const stylesSource$ = f
    .watchDirPaths(config.styles)
    .pipe(RxO.debounceTime(100))
    .pipe(RxO.flatMap(_ => f.readFile(config.styleIndex)));

  // ===========================================================================
  // Posts.
  // ===========================================================================

  const postDestination = path.join(config.destination, 'posts');

  // Stream of posts.
  const posts$ = postSource$.pipe(
    RxO.map(
      compose(
        V.map(toPost),
        V.flatMap(validatePost(config)),
        fileToPostV({
          fileToFrontmatter: frontmatterAdapter.fileToFrontmatter,
          fileToHtml: markdownAdapter.fileToHtml,
          destinationDirectory: postDestination,
        }),
      ),
    ),
  );

  // Stream of compiled post files.
  const compiledPosts$ = posts$.pipe(
    RxO.map(
      V.flatMap(compilePostV(templateAdapter.compilePost)(config.postTemplate)),
    ),
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
    RxO.map(toPage(config.destination)),
    RxO.scan(reducePages, {}),
    RxO.debounceTime(200),
  );

  // Now that we're done accumulating context and because we have the
  // possibility of failure again, we're re-entering the realm of Validation.

  // Stream of compiled pages.
  const compiledPages$ = Rx.combineLatest(pageContext$, postContext$).pipe(
    RxO.flatMap(compilePagesV(templateAdapter.compilePage)),
  );

  // ===========================================================================
  // Compiling Styles.
  // ===========================================================================

  // const styleOutputPath = path.join(config.destination, 'css', 'styles.css');

  // Stream of compiled styles.
  // const compiledStyles$ = stylesSource$.pipe(
  //   RxO.map(({content}) => ({
  //     content,
  //     includePaths: [config.styles],
  //     filepath: styleOutputPath,
  //   })),
  //   RxO.flatMap(styleAdapter.compileCss),
  //   RxO.debounceTime(200),
  // );

  return Rx.merge(
    failedPosts$,
    compiledPosts$,
    compiledPages$,
    // compiledStyles$,
  );
};
