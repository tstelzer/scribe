import {existsSync, lstatSync} from 'fs';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

import * as T from '../types';
import {readAndParse} from './file';
import {parse, resolve} from './path';
import {fail, isSuccess, message, succeed, validate} from './validation';

const withContext = message('Parsing and generating the configuration.');

/**
 * Record of possible failure messages in the shape of message creator functions.
 */
const failureMessages: Record<string, (...values: any[]) => string> = {
  shouldBeString: (path: any) =>
    `The provided path "<%s${path}%>" to the configuration file should be a string, but was of type "<%t${typeof path}%>".`,
  configNeedsToBeFile: (path: string) =>
    `Configuration under the provided path "<%s${path}" must to be a file, but none of was found.`,
  pathNeedsToBeFile: (property: string, path: string) =>
    `The Provided path "<%s${path}%>" for property "<%s${property}%>" must be a file, but none was found.`,
  propertyRequired: (property: string) =>
    `The property "<%s${property}%>" is required in configuration.`,
  shouldBeValidDirectory: (property: string, path: string) =>
    `The Provided path "<%s${path}%>" for property "<%s${property}%>" must be a valid directory, but none was found.`,
};

/**
 * Utility to construct failure messages.
 * See `failureMessages` for list of possible creator functions.
 */
const t = R.mapObjIndexed(
  f => (...args: any[]) => withContext(f(...args)),
  failureMessages,
);

/**
 * Assert that path belongs to a valid file.
 * @impure
 */
const isFile = existsSync;

/**
 * Assert that path belongs to a valid directory.
 * @impure
 */
const isDirectory = (path: string) =>
  existsSync(path) && lstatSync(path).isDirectory();

/**
 * Assert that path belongs to a valid directory.
 * @impure
 */
const isDirectoryPath = R.allPass([RA.isString, isDirectory]);

/**
 * Validate string.
 */
const checkString: T.Validator<T.Path> = p =>
  R.type(p) !== 'String' ? fail(t.shouldBeString(p)) : succeed(p);

/**
 * Validate configuration file.
 */
const checkConfigurationFile: T.Validator<T.Path> = p =>
  !isFile(p) ? fail(t.configNeedsToBeFile(p)) : succeed(p);

/**
 * Validate file.
 */
const checkFile = (property: string): T.Validator<T.Config> => (record: any) =>
  !record[property]
    ? fail(t.propertyRequired(property))
    : !isFile(record[property])
    ? fail(t.pathNeedsToBeFile(property, record[property]))
    : succeed(record[property]);

/**
 * Validate configuration path.
 */
const validateConfigPath = validate([checkString, checkConfigurationFile]);

/**
 * Validate directory.
 */
const checkDirectory = (property: string): T.Validator<T.Config> => (
  record: any,
) =>
  !record[property]
    ? fail(t.propertyRequired(property))
    : !isDirectoryPath(record[property])
    ? fail(t.shouldBeValidDirectory(property, record[property]))
    : succeed(record);

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
export const pathToConfig = (p: any): T.Validation<T.Config | string> => {
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
