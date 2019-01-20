import {failure, isSuccess, success} from 'fp-ts/lib/Validation';
import {existsSync, lstatSync} from 'fs';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

import * as T from '../types';
import {readAndParse} from './file';
import {parse, resolve} from './path';
import {validate, validation} from './validation';

/**
 * Validation messages.
 */
const t = {
  shouldBeString: (p: any) =>
    `The provided path to the configuration file should be a string, but was "${p}" of type ${typeof p}.`,
  configNeedsToBeFile: (p: any) =>
    `Configuration needs to be a file, but none of was found at the provided path "${p}".`,
  pathNeedsToBeFile: (property: string, value: any) =>
    `Path for property ${property} needs to be a file, but none of was found at the provided path "${value}".`,
  propertyRequired: (property: string) =>
    `Property "${property}" is required in configuration.`,
  shouldBeValidDirectory: (path: string) =>
    `Path "${path}" must be a valid directory.`,
};

const isFile = existsSync;
const isFilePath = R.allPass([RA.isString, isFile]);
const isDirectory = (path: string) =>
  existsSync(path) && lstatSync(path).isDirectory();
const isDirectoryPath = R.allPass([RA.isString, isDirectory]);

const checkString: T.Validator<T.Path> = p =>
  R.type(p) !== 'String' ? failure([t.shouldBeString(p)]) : success(p);

const checkConfigurationFile: T.Validator<T.Path> = p =>
  !isFile(p) ? failure([t.configNeedsToBeFile(p)]) : success(p);

const checkFile = (property: string): T.Validator<T.Config> => (record: any) =>
  !record[property]
    ? failure([t.propertyRequired(property)])
    : !isFile(record[property])
    ? failure([t.pathNeedsToBeFile(property, record[property])])
    : success(record[property]);

const validateConfigPath = validate([checkString, checkConfigurationFile]);

const checkDirectory = (property: string): T.Validator<T.Config> => (
  record: any,
) =>
  !record[property]
    ? failure([t.propertyRequired(property)])
    : !isDirectoryPath(record[property])
    ? failure([t.shouldBeValidDirectory(record[property])])
    : success(record);

/**
 * Validates all configuration properties.
 */
const validateConfig = validate(
  R.map(checkDirectory, [
    'styles',
    'posts',
    'pages',
    'layouts',
    'destination',
  ]).concat(R.map(checkFile, ['styleIndex', 'layoutPath'])),
);

/**
 * Takes a base path `from`, then a `configuration` and resolves all paths in
 * that configration based on the base path.
 */
const resolvePaths = (from: T.ParsedPath) => (c: T.Config) => {
  return {
    styles: resolve(from, parse(c.styles)),
    pages: resolve(from, parse(c.pages)),
    posts: resolve(from, parse(c.posts)),
    destination: resolve(from, parse(c.destination)),
    layouts: resolve(from, parse(c.layouts)),
    styleIndex: resolve(
      parse(resolve(from, parse(c.styles))),
      parse(c.styleIndex),
    ),
    layoutPath: resolve(
      parse(resolve(from, parse(c.layouts))),
      parse(c.layoutPath),
    ),
  };
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
        readAndParse,
        resolvePaths(configPath),
        validateConfig,
      )(result.value)
    : result;
};
