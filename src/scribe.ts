import browserSync = require('browser-sync');
import path = require('path');
import {combineLatest, merge} from 'rxjs';
import O = require('rxjs/operators');

import {fileToFrontmatter} from './adapters/grayMatter';
import {fileToHtml} from './adapters/markdown';
import {compilePage, compilePost} from './adapters/pug';
import {compileCss} from './adapters/scss';

import * as f from './core/file';
import {reducePages, toPage} from './core/page';
import {reducePostContext, validatePost} from './core/post';
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
}) => (file: T.File): V.Validation<T.Post> => {
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

export default (config: T.Config) => {
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
    .pipe(O.debounceTime(100))
    .pipe(O.flatMap(_ => f.readFile(config.styleIndex)));

  // === MAIN ==================================================================

  // --- posts -----------------------------------------------------------------

  const postDestination = path.join(config.destination, 'posts');

  // Stream of domain posts.
  const posts$ = postSource$.pipe(
    O.map(
      fileToPost({
        fileToFrontmatter,
        fileToHtml,
        destinationDirectory: postDestination,
      }),
    ),
    O.map(V.flatMap(validatePost)),
  );

  // Stream of compiled post files.
  const compiledPosts$ = posts$.pipe(O.map(compilePost(config.layoutPath)));

  // --- pages -----------------------------------------------------------------

  // Stream of post context, used in conjunction with pages.
  const postContext$ = posts$.pipe(
    O.scan(reducePostContext, {posts: {}}),
    O.debounceTime(200),
  );

  // Stream of page context.
  const pageContext$ = pageSource$.pipe(
    O.filter(s => !s.match(/.+\/_.+/)),
    O.map(toPage(config.destination)),
    O.scan(reducePages, {}),
    O.debounceTime(200),
  );

  // Stream of compiled pages.
  const compiledPages$ = combineLatest(pageContext$, postContext$).pipe(
    O.flatMap(compilePages(compilePage)),
  );

  // --- styles ----------------------------------------------------------------

  const styleOutputPath = path.join(config.destination, 'css', 'styles.css');

  // Stream of compiled styles.
  const compiledStyles$ = stylesSource$.pipe(
    O.map(({content}) => ({
      content,
      includePaths: [config.styles],
      filepath: styleOutputPath,
    })),
    O.flatMap(compileCss),
    O.debounceTime(200),
  );

  // === SINKS =================================================================

  return compiledPages$;
  // return merge(compiledPosts$, compiledPages$, compiledStyles$);
};
