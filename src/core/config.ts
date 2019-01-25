import {existsSync, lstatSync} from 'fs';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

import {readAndParse} from './file';
import {parse, resolve} from './path';
import {allPass, fail, message, pass, pipe, validate} from './validation';

import * as T from '../types';

const messages: Record<string, (...values: any[]) => string> = {
  shouldBeString: (path: any) =>
    `The provided path "<%s${path}%>" to the configuration file should be a string, but was of type "<%t${typeof path}%>".`,
  configNeedsToBeFile: (path: string) =>
    `Configuration under the provided path "<%s${path}" must to be a file, but none of was found.`,
  pathNeedsToBeFile: ({property, path}) =>
    `The Provided path "<%s${path}%>" for property "<%s${property}%>" must be a file, but none was found.`,
  propertyRequired: (property: string) =>
    `The property "<%s${property}%>" is required in configuration.`,
  shouldBeValidDirectory: ({property, path}) =>
    `The Provided path "<%s${path}%>" for property "<%s${property}%>" must be a valid directory, but none was found.`,
};

// =============================================================================
// Predicates.
// =============================================================================

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

// =============================================================================
// Config validations.
// =============================================================================

const withContext = message('Parsing and generating the configuration.');

/**
 * Utility to construct failure messages.
 * See `failureMessages` for list of possible creator functions.
 */
const t = R.mapObjIndexed(
  f => (...args: any[]) => withContext(f(...args)),
  messages,
);

const validateString = validate<string>({
  predicate: RA.isString,
  message: t.shouldBeString,
});

const validateFile = validate<T.Path>({
  predicate: R.complement(isFile),
  message: t.configNeedsToBeFile,
});

const validateDirectory = validate<T.Path>({
  predicate: R.complement(isDirectory),
  message: t.shouldBeValidDirectory,
});

const validateProperty = (property: string) =>
  validate({
    predicate: R.has(property),
    message: () => t.propertyRequired(property),
  });

const validateFilePath = pipe(
  validateString,
  validateFile,
);

const validateConfigFile = pipe(
  validateString,
  validateFile,
);

const validateConfig = pipe(validateConfigFile);

// const validateConfig = mapValidate(
//   R.map(validateDirectory, [
//     'styles',
//     'posts',
//     'pages',
//     'layouts',
//     'destination',
//   ]).concat(R.map(validateFile, ['styleIndex', 'layoutPath'])),
// );

// =============================================================================
// Implementation Details.
// =============================================================================

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

// export const pathToConfig = (p: any): T.Validation<T.Config | string> => {
//   // FIXME: assumes its a string
//   const configPath = parse(p);
//   const result = validateFilePath(configPath.full);
//   return isSuccess(result)
//     ? R.pipe(
//         readAndParse,
//         resolvePaths(configPath),
//         validateConfig,
//       )(result.value)
//     : result;
// };

const mergeWithDefaults = R.identity;

export default validateConfig;
