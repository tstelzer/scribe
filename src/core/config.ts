/**
 * What is _not yet_ validated:
 * * Initial argument (presumably path to configuration) is valid path.
 * * Path points to JSON file.
 *
 * What _is_ Validated:
 * * Required properties on configuration exist.
 * * Property types are correct.
 * * Properties point to file or directory paths.
 */
import * as R from 'ramda';
import {readAndParse} from './file';
import {parse, resolve} from './path';

import * as T from '../types';
import * as P from './predicates';
import {
  flatMap,
  map,
  validate,
  validateAll,
  validateSequence,
} from './validation';

// =============================================================================
// Types.
// =============================================================================

enum Props {
  styleIndex = 'styleIndex',
  layoutPath = 'layoutPath',
  posts = 'posts',
  pages = 'pages',
  styles = 'styles',
  destination = 'destination',
  layouts = 'layouts',
}

type UserConfig = {
  [Props.posts]: string;
  [Props.pages]: string;
  [Props.styles]: string;
  [Props.destination]: string;
  [Props.layouts]: string;
  [Props.styleIndex]?: string;
  [Props.layoutPath]?: string;
};

export type Config = {
  [Props.posts]: string;
  [Props.pages]: string;
  [Props.styles]: string;
  [Props.destination]: string;
  [Props.layouts]: string;
  [Props.styleIndex]: string;
  [Props.layoutPath]: string;
};

type K = keyof UserConfig;

// =============================================================================
// Failure Messages.
// =============================================================================

const context = 'While parsing and generating the configuration:\n';

const t = {
  propertyIsRequired: (k: K) => (a: UserConfig) =>
    context + `The property "<%s${k}%>" is required in configuration.`,
  propertyMustBeString: (k: K) => (a: UserConfig) =>
    context +
    `The property "<%s${k}%>" must be a string, but was ${typeof a[k]}.`,
  propertyMustBeDirectory: (k: K) => (a: UserConfig) =>
    context +
    `The path at "<%s${
      a[k]
    }%>, from property "<%s${k}%>" must point to a directory, but none was found.`,
  propertyMustBeFile: (k: K) => (a: UserConfig) =>
    context +
    `The path at "<%s${
      a[k]
    }%>, from property "<%s${k}%>" must point to a file, but none was found.`,
};

// =============================================================================
// Config validation.
// =============================================================================

const optionalProps = [Props.styleIndex, Props.layoutPath];
const requiredProps = [
  Props.posts,
  Props.pages,
  Props.styles,
  Props.destination,
  Props.layouts,
];

const propIsRequired = (k: K) =>
  validate<UserConfig>(R.has(k))(t.propertyIsRequired(k));

const propIsString = (k: K) =>
  validate<UserConfig>(a => R.type(a[k]) === 'String')(
    t.propertyMustBeString(k),
  );

const optionalPropIsString = (k: K) =>
  validate<UserConfig>(a => !a[k] || R.type(a[k]) === 'String')(
    t.propertyMustBeString(k),
  );

const validateConfigKeys = validateSequence(
  validateAll(requiredProps.map(propIsRequired)),
  validateAll(
    R.concat(
      requiredProps.map(propIsString),
      optionalProps.map(optionalPropIsString),
    ),
  ),
);

const propIsDirectory = (k: K) =>
  validate<UserConfig>(a => P.isDirectory(a[k] || ''))(
    t.propertyMustBeDirectory(k),
  );

const optionalPropIsFile = (k: K) =>
  validate<UserConfig>(a => !a[k] || P.isFile(a[k] || ''))(
    t.propertyMustBeFile(k),
  );

const validateConfigValues = validateAll(
  R.concat(
    requiredProps.map(propIsDirectory),
    optionalProps.map(optionalPropIsFile),
  ),
);

// =============================================================================
// Implementation.
// =============================================================================

/**
 * Takes a base path `from`, then a `configuration` and resolves all paths in
 * that configration based on the base path.
 */
const resolveConfigPaths = (s: T.Path) => (c: UserConfig): UserConfig => {
  const from = parse(s);
  return {
    styles: resolve(from, parse(c.styles)),
    pages: resolve(from, parse(c.pages)),
    posts: resolve(from, parse(c.posts)),
    destination: resolve(from, parse(c.destination)),
    layouts: resolve(from, parse(c.layouts)),
    styleIndex:
      c.styleIndex &&
      resolve(parse(resolve(from, parse(c.styles))), parse(c.styleIndex)),
    layoutPath:
      c.layoutPath &&
      resolve(parse(resolve(from, parse(c.layouts))), parse(c.layoutPath)),
  };
};

const mergeWithDefaults = (c: UserConfig): Config =>
  R.mergeDeepRight({styleIndex: '', layoutPath: ''}, c);

export default (s: T.Path) =>
  R.pipe(
    readAndParse,
    validateConfigKeys,
    map(resolveConfigPaths(s)),
    flatMap(validateConfigValues),
    map(mergeWithDefaults),
  )(s);
