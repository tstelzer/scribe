import browserSync = require('browser-sync');
import {compose} from 'fp-ts/lib/function';
import path = require('path');
import * as R from 'ramda';
import * as Rx from 'rxjs';
import * as RxO from 'rxjs/operators';

import {fileToFrontmatter} from './adapters/grayMatter';
import {fileToHtml} from './adapters/markdown';
import {compilePage, compilePost} from './adapters/pug';
import {compileCss} from './adapters/scss';

import {Config} from './core/config';
import * as f from './core/file';
import {reducePages, toPage} from './core/page';
import {reducePostContext, toPost, validatePost} from './core/post';
import * as V from './lib/validation';
import * as T from './types';

/**
 * Implements transforming a file to a domain post.
 */
const fileToPost = ({
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

/**
 * Implements compiling pages. Compiles a list of pages from page and post
 * contexts.
 */
const compilePages = (compilePage: T.PageToFile) => ([
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
  // === HOT RELOADING =========================================================

  const bs = browserSync.create();

  bs.init({
    online: false,
    server: config.destination,
    open: false,
    reloadOnRestart: true,
    injectChanges: true,
    watch: true,
  });

  // === SOURCES ===============================================================

  // Stream of post source files.
  const postSource$ = f.watchDirContents(config.posts);

  // Stream of page source files.
  const pageSource$ = f.watchDirPaths(config.pages);

  // Stream of scss source files.
  const stylesSource$ = f
    .watchDirPaths(config.styles)
    .pipe(RxO.debounceTime(100))
    .pipe(RxO.flatMap(_ => f.readFile(config.styleIndex)));

  // === MAIN ==================================================================

  // --- posts -----------------------------------------------------------------

  const postDestination = path.join(config.destination, 'posts');

  // Stream of posts.
  const posts$ = postSource$.pipe(
    RxO.map(
      compose(
        V.map(toPost),
        V.flatMap(validatePost(config)),
        fileToPost({
          fileToFrontmatter,
          fileToHtml,
          destinationDirectory: postDestination,
        }),
      ),
    ),
  );

  // Stream of compiled post files.
  const compiledPosts$ = posts$.pipe(
    RxO.map(V.map(compilePost(config.postTemplate))),
  );

  // --- pages -----------------------------------------------------------------

  const partition = <A>(
    predicate: (v: A) => boolean,
    source$: Rx.Observable<A>,
  ) => RxO.partition(predicate)(source$);

  // Stream of post context, used in conjunction with pages.
  const postContext$ = () => {
    const failures$ = posts$.pipe(RxO.filter(V.isFailure));
    const successes$ = posts$.pipe(RxO.filter(V.isSuccess));
    return Rx.merge(
      failures$,
      successes$,
      // successes$.pipe(RxO.scan(reducePostContext, {posts: {}})),
    );
    // const [successes$, failures$] = posts$.pipe(RxO.scan(reducePostContext, {posts: {}}), RxO.debounceTime(200));
  };

  // Stream of page context.
  // const pageContext$ = pageSource$.pipe(
  //   O.filter(s => !s.match(/.+\/_.+/)),
  //   O.map(toPage(config.destination)),
  //   O.scan(reducePages, {}),
  //   O.debounceTime(200),
  // );

  // Stream of compiled pages.
  // const compiledPages$ = combineLatest(pageContext$, postContext$).pipe(
  //   O.flatMap(compilePages(compilePage)),
  // );

  // --- styles ----------------------------------------------------------------

  // const styleOutputPath = path.join(config.destination, 'css', 'styles.css');

  // Stream of compiled styles.
  // const compiledStyles$ = stylesSource$.pipe(
  //   O.map(({content}) => ({
  //     content,
  //     includePaths: [config.styles],
  //     filepath: styleOutputPath,
  //   })),
  //   O.flatMap(compileCss),
  //   O.debounceTime(200),
  // );

  // === SINKS =================================================================

  return postContext$();
  // return merge(compiledPosts$, compiledPages$, compiledStyles$);
};
