import {existsSync, lstatSync} from 'fs';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

/**
 * Assert that path belongs to a valid file.
 * @impure
 */
export const isFile = existsSync;

/**
 * Assert that path belongs to a valid directory.
 * @impure
 */
export const isDirectory = (path: string) =>
  existsSync(path) && lstatSync(path).isDirectory();

/**
 * Assert that path belongs to a valid directory.
 * @impure
 */
export const isDirectoryPath = R.allPass([RA.isString, isDirectory]);
