/*
 * --- TODO --------------------------------------------------------------------
 * config check
 * Create dirs if not exist
 * Handle validation errors.
 * Handle scss errors.
 * Update styles, holy shit what a mess.
 * Fix post:published format, use YYYY/MM/DD.
 */

import browserSync = require('browser-sync');
import colorize from 'chalk';
import path = require('path');
import R = require('ramda');
import {combineLatest, merge} from 'rxjs';
import O = require('rxjs/operators');

import {fileToFrontmatter} from './adapters/grayMatter';
import {fileToHtml} from './adapters/markdown';
import {compilePage, compilePost} from './adapters/pug';
import {compileCss} from './adapters/scss';
import {reducePages, toPage} from './core/page';
import {reducePostContext, validatePost} from './core/post';
import * as f from './io/file';
import {stdout} from './io/log';

import * as T from './types';

/**
 * Transforms a file to a domain post.
 */
const fileToPost = ({
  fileToHtml,
  fileToFrontmatter,
  destinationDirectory,
}: {
  fileToHtml: T.FileToHtml;
  fileToFrontmatter: T.FileToFrontmatter;
  destinationDirectory: T.Path;
}) => (file: T.File): T.Post => {
  const content = fileToHtml(file);
  const frontmatter = fileToFrontmatter(file);
  const destinationPath = path.join(
    destinationDirectory,
    frontmatter.slug,
    '.html',
  );

  return {frontmatter, content, sourcePath: file.filepath, destinationPath};
};

/**
 * Compiles a list of pages from page and post contexts.
 */
const compilePages = (compilePage: T.PageToFile) => ([
  pageContext,
  postContext,
]: [T.PageContext, T.PostContext]) => {
  const result = [];
  for (const page of Object.values(pageContext)) {
    result.push(compilePage(page)(postContext));
  }

  return result;
};

export const scribey = (config: T.Config) => {
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
  const postSource$ = f.watchDirContents(config.source.posts);

  // Stream of page source files.
  const pageSource$ = f.watchDirPaths(config.source.pages);

  const styleIndex = path.join(config.source.styles, 'index.scss');

  // Stream of scss source files.
  const stylesSource$ = f
    .watchDirPaths(config.source.styles)
    .pipe(O.debounceTime(100))
    .pipe(O.flatMap(_ => f.readFile(styleIndex)));

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
    O.map(validatePost),
  );

  const layoutPath = path.join(config.source.layouts, 'post.pug');

  // Stream of compiled post files.
  const compiledPosts$ = posts$.pipe(O.map(compilePost(layoutPath)));

  // --- pages -----------------------------------------------------------------

  // Stream of post context, used in conjunction with pages.
  const postContext$ = posts$.pipe(
    O.scan(reducePostContext, {posts: {}}),
    O.debounceTime(200),
  );

  // Stream of page context.
  const pageContext$ = pageSource$.pipe(
    // FIXME: to config
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
      includePaths: [config.source.styles],
      filepath: styleOutputPath,
    })),
    O.flatMap(compileCss),
    O.debounceTime(200),
  );

  // === SINKS =================================================================

  merge(compiledPosts$, compiledPages$, compiledStyles$).subscribe(
    f.writeFile({next: stdout.wroteFile, error: stdout.error}),
  );
};
