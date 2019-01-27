import {existsSync, lstatSync} from 'fs';
import {homedir} from 'os';
import * as path from 'path';
import * as R from 'ramda';

import * as T from '../types';

/**
 * Normalize a path.
 */
export const normalize: (p: T.Path) => T.Path = R.pipe(
  R.replace(/~/, homedir()),
  path.normalize,
);

const isDirectory = (path: string) =>
  existsSync(path) && lstatSync(path).isDirectory();

/**
 * Normalize and parse a path.
 */
export const parse: (p1: T.Path) => T.ParsedPath = (p1: T.Path) =>
  R.pipe(
    normalize,
    (p2: T.Path) => ({
      ...path.parse(p2),
      full: p2,
      isAbsolute: path.isAbsolute(p2),
      isDirectory: isDirectory(p2),
    }),
  )(p1);

/**
 * Resolve a path based on `from` to `to`. If `to` is already an absolute path,
 * it returns it as-is.
 */
export const resolve = (from: T.ParsedPath, to: T.ParsedPath) =>
  to.isAbsolute
    ? to.full
    : path.join(from.isDirectory ? from.full : from.dir, to.full);

export const join = path.join;
