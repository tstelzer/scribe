import {watch} from 'chokidar';
import * as fs from 'fs';
import {EOL} from 'os';
import * as R from 'ramda';
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

const __watchDirPaths = (directoryPath: T.Path): Observable<any> => {
  const watcher = watch(directoryPath, {ignoreInitial: false});
  const newFiles = fromEvent(watcher, 'add');
  const changedFiles = fromEvent(watcher, 'change');

  return merge(newFiles, changedFiles);
};

/**
 * Watches for changes in `directoryPath` and returns a stream of file paths
 * for those files that changed.
 */
export const watchDirPaths = (directoryPath: T.Path) =>
  __watchDirPaths(directoryPath).pipe(O.map(R.head));

/**
 * Watches for changes in `directoryPath` and returns a stream of file contents
 * for those files that changed.
 */
export const watchDirContents = (directoryPath: T.Path): Observable<T.File> =>
  watchDirPaths(directoryPath).pipe(O.flatMap(readFile));

export const readAndParse = R.pipe(
  (p: T.Path) => fs.readFileSync(p, {encoding: 'utf8', flag: 'r'}),
  JSON.parse,
);
