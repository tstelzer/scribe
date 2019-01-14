import {failure, isSuccess, success, Validation} from 'fp-ts/lib/Validation';
import {existsSync, lstatSync, PathLike, readFile, readFileSync} from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

import {validate} from '../core/validation';
import * as T from '../types';
import {readAndParse} from './file';

const isFile = existsSync;
const isFilePath = R.allPass([RA.isString, isFile]);
const isDirectory = (path: string) => existsSync(path); // && lstatSync(path).isDirectory();
const isDirectoryPath = R.allPass([RA.isString, isDirectory]);

const checkString: T.Validator<T.Path> = p =>
  R.type(p) !== 'String'
    ? failure([
        `The provided path to the configuration file should be a string, but was "${p}" of type ${typeof p}.`,
      ])
    : success(p);

const checkFile: T.Validator<T.Path> = p =>
  !isFile(p)
    ? failure([
        `Configuration needs to be a file, but none of was found at the provided path "${p}".`,
      ])
    : success(p);

const validateConfigPath = validate([checkString, checkFile]);

const checkDirectory = (property: string): T.Validator<T.Config> => (
  record: any,
) => {
  if (!record[property]) {
    return failure([`Property "${property}" is required in configuration.`]);
  } else if (!isDirectoryPath(record[property])) {
    return failure([`Property "${property}" must be a valid directory path.`]);
  } else {
    return success(record);
  }
};

// Yeah, this is dumb, this could easily be a generalized schema checker.
// But for now this is fine because the config is simple. Need to force myself
// to keep things simple or I won't ever finish this ...
const validateConfig = validate([
  checkDirectory('posts'),
  checkDirectory('pages'),
  checkDirectory('styles'),
  checkDirectory('layouts'),
  checkDirectory('destination'),
]);

export const pathToConfig = (p: any): Validation<T.Errors, T.Config> => {
  const result = validateConfigPath(p);

  if (isSuccess(result)) {
    const parsed = readAndParse(result.value);
    return validateConfig(parsed);
  } else {
    return failure(result.value);
  }
};
