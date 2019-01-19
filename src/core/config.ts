import {} from 'fp-ts/lib/Apply';
import {failure, isSuccess, success} from 'fp-ts/lib/Validation';
import {existsSync, lstatSync} from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

import * as T from '../types';
import {readAndParse} from './file';
import {parse, resolve} from './path';
import {validate, validation} from './validation';

const isFile = existsSync;
const isFilePath = R.allPass([RA.isString, isFile]);
const isDirectory = (path: string) =>
  existsSync(path) && lstatSync(path).isDirectory();
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

const checkFile2 = (property: string): T.Validator<T.Path> => (record: any) =>
  !isFile(record[property])
    ? failure([
        `Path for property ${property} needs to be a file, but none of was found at the provided path "${
          record[property]
        }".`,
      ])
    : success(record[property]);

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
const validateConfig = validate(
  R.map(checkDirectory, ['styles', 'posts', 'pages', 'layouts', 'destination']),
);

/**
 * Takes a base path `from`, then a `configuration` and resolves all paths in
 * that configration based on the base path.
 */
const resolvePaths = (from: T.ParsedPath) => (configuration: T.Config) => {
  const parseAndResolve = R.pipe(
    parse,
    resolve(from),
  );

  return R.evolve(
    {
      styles: parseAndResolve,
      posts: parseAndResolve,
      pages: parseAndResolve,
      layouts: parseAndResolve,
      destination: parseAndResolve,
    },
    configuration,
  );
};

/**
 * Validates a path `p`. When successful, parses configuration, normalizes and
 * resolves all paths and returns the domain configuration as a Pass. On
 * failures, returns a Fail.
 */
export const pathToConfig = (p: any): T.Validation<string | T.Config> => {
  const configPath = parse(p);
  const result = validateConfigPath(configPath.full);

  return isSuccess(result)
    ? R.pipe(
        // FIXME: Assumes that file is a JSON file.
        // FIXME: Rename.
        readAndParse,
        // FIXME: Assumes that properties are strings.
        resolvePaths(configPath),
        validateConfig,
        // FIXME: Don't reach into the Validation, lift the functions instead.
      )(result.value)
    : result;
};
