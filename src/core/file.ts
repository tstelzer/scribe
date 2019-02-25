import {watch} from 'chokidar';
import * as fs from 'fs';
import {EOL} from 'os';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';
import {bindNodeCallback, fromEvent, merge, Observable, Observer} from 'rxjs';
import * as O from 'rxjs/operators';

import * as T from '../types';

/**
 * DON'T USE. Problem: Files are written _once_, then never again.
 * Takes a stream of files, creates `WriteStream`s for each and returns the
 * original input, notifying subscribers of successful writes.
 */
export const writeFiles = (
  observable$: Observable<T.File>,
): Observable<T.File> =>
  Observable.create((observer: Observer<T.File>) => {
    const cache = new Map();

    observable$.forEach(({filepath, content}) => {
      if (!cache.has(filepath)) {
        cache.set(filepath, fs.createWriteStream(filepath));
      }
      try {
        cache.get(filepath).write(content + EOL);
        observer.next({content, filepath});
      } catch (e) {
        cache.get(filepath).end();
        observer.error(e);
      }
    });

    return observer;
  });

/**
 * Thin wrapper around `fs.writeFile`. This is a bandaid solution until I can
 * fix `writeFiles`.
 */
export const writeFile = ({next, error}: {next: any; error: any}) => ({
  content,
  filepath,
}: T.File) =>
  bindNodeCallback(fs.writeFile)(filepath, content + EOL).subscribe({
    next: next({content, filepath}),
    error: e => error('Something bad happened', e),
  });

/**
 * Wrapper around `fs.readFile`.
 * Takes a file path, reads the file and returns a stream of the contents.
 */
export const readFile = (filePath: T.Path) =>
  bindNodeCallback(fs.readFile)(filePath).pipe(
    O.map(R.toString),
    O.map(content => ({content, filepath: filePath})),
  );

/**
 * Watches for changes under path or paths and returns a stream of file paths
 * for those files that changed. Expects either a single path or a list of
 * paths.
 */
export const watchDirPaths = (p: T.Path | [T.Path]): Observable<T.Path> => {
  /**
   * Watch for changes in `directoryPath` and returns a stream of file paths
   * for those files that changed.
   */
  const watchDir = (directoryPath: T.Path) => {
    const watcher = watch(directoryPath, {ignoreInitial: false});
    const newFiles = fromEvent<T.Path>(watcher, 'add');
    const changedFiles = fromEvent<T.Path>(watcher, 'change');

    return merge(newFiles, changedFiles);
  };

  // The file watcher returns a tuple, we're only interested in the first
  // element, which is the file path.
  const f = (x: string) => watchDir(x).pipe(O.map(R.head));

  const g = R.pipe(
    R.map(f),
    R.apply(merge),
  );

  return R.ifElse(RA.isArray, g, f)(p);
};

/**
 * Watches for changes in `directoryPath` and returns a stream of file contents
 * for those files that changed.
 */
export const watchDirContents = (directoryPath: T.Path): Observable<T.File> =>
  watchDirPaths(directoryPath).pipe(O.flatMap(readFile));

/**
 * Read JSON file and parse it.
 */
export const readJSON: (p: T.Path) => any = R.pipe(
  (p: T.Path) => fs.readFileSync(p, {encoding: 'utf8', flag: 'r'}),
  JSON.parse,
);
