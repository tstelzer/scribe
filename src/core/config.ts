/**
 * What is _not yet_ validated:
 * * Initial argument (presumably path to configuration) is valid path.
 * * Path points to JSON file.
 */
import {compose} from 'fp-ts/lib/function';
import * as R from 'ramda';

import * as V from '../lib/validation';
import * as T from '../types';
import {readAndParse} from './file';
import {join, parse, resolve} from './path';
import * as P from './predicates';

// =============================================================================
// Types.
// =============================================================================

enum K {
  categories = 'categories',
  destination = 'destination',
  postTemplate = 'postTemplate',
  layouts = 'layouts',
  pages = 'pages',
  posts = 'posts',
  styleIndex = 'styleIndex',
  styles = 'styles',
}

/**
 * Represents a partial `Config`.
 */
type UserConfig = {
  /**
   * Set of post categories.
   * Defaults to ['opinion', 'story', 'tutorial', 'concept', 'review'].
   */
  [K.categories]?: [string];
  /** Path to generated files. */
  [K.destination]: T.Path;
  /**
   * Name of the post template.
   * Defaults to 'post.pug'.
   */
  [K.postTemplate]?: string;
  /** Path to post layouts. */
  [K.layouts]: T.Path;
  /** Path to page layouts. */
  [K.pages]: T.Path;
  /** Path to posts. */
  [K.posts]: T.Path;
  /**
   * Name of the style entry file.
   * Defaults to 'index.scss'.
   */
  [K.styleIndex]?: string;
  /** Path to styles. */
  [K.styles]: T.Path;
};

enum K2 {
  highlight = 'highlight',
}

/** Internal Scribe Configuration. */
export type Config = {
  categories: string[];
  highlight: string[];
  destination: {
    root: T.Path;
    styles: T.Path;
    posts: T.Path;
  };
  postTemplate: T.Path;
  layouts: T.Path;
  pages: T.Path;
  posts: T.Path;
  styleIndex: string;
  styles: T.Path;
};

type KRequired = T.FilterRequiredProps<UserConfig>;
type KOptional = T.FilterOptionalProps<UserConfig>;
type KFiles = K.styleIndex | K.postTemplate;

const PropSets: {
  optional: KOptional[];
  required: KRequired[];
  files: KFiles[];
} = {
  files: [K.styleIndex, K.postTemplate],
  optional: [K.styleIndex, K.postTemplate],
  required: [K.posts, K.pages, K.styles, K.destination, K.layouts],
};

// =============================================================================
// Default values.
// =============================================================================

const defaults = {
  [K.categories]: ['opinion', 'story', 'tutorial', 'concept', 'review'],
  [K.styleIndex]: 'index.scss',
  [K.postTemplate]: 'post.pug',
  [K2.highlight]: ['javascript', 'css', 'scss', 'html', 'haskell', 'gitdiff'],
  destination: {
    posts: 'posts',
    styles: 'css/styles.css',
  },
};

// =============================================================================
// Failure Messages.
// =============================================================================

const context = 'While parsing and generating the configuration:\n';

const t = {
  propertyIsRequired: (k: K) => (a: UserConfig) =>
    `${context}The property "<%s${k}%>" is required in configuration.`,
  propertyMustBeType: (k: K, t: string) => (a: UserConfig) =>
    `${context}The property "<%s${k}%>" must be a <%t${t}%>, but was <%t${R.type(
      a[k],
    )}%>.`,
  propertyMustBeDirectory: (k: K) => (a: UserConfig) =>
    `${context}The path at "<%s${
      a[k]
    }%>, from property "<%s${k}%>" must point to a directory, but none was found.`,
  propertyMustBeFile: (k: K) => (a: UserConfig) =>
    `${context}The path at "<%s${
      a[k]
    }%>, from property "<%s${k}%>" must point to a file, but none was found.`,
};

// =============================================================================
// Config validation.
// =============================================================================

const propIsRequired = (k: K) =>
  V.validate<UserConfig>(R.has(k))(t.propertyIsRequired(k));

const propIsString = (k: K) =>
  V.validate<UserConfig>(a => R.type(a[k]) === 'String')(
    t.propertyMustBeType(k, 'String'),
  );

const optionalPropIs = (type: 'String' | 'Array') => (k: K) =>
  V.validate<UserConfig>(a => !a[k] || R.type(a[k]) === type)(
    t.propertyMustBeType(k, type),
  );

/**
 * Validate types of `UserConfig` properties.
 */
const validateConfigKeys = V.validateSequence(
  V.validateAll(PropSets.required.map(propIsRequired)),
  V.validateAll([
    ...PropSets.required.map(propIsString),
    ...PropSets.optional.map(optionalPropIs('String')),
    ...[K.categories].map(optionalPropIs('Array')),
  ]),
);

const propIsDirectory = (k: K) =>
  V.validate<UserConfig>(a => P.isDirectory(a[k]))(
    t.propertyMustBeDirectory(k),
  );

const optionalPropIsFile = (k: K) =>
  V.validate<UserConfig>(a => !a[k] || P.isFile(a[k]))(t.propertyMustBeFile(k));

/**
 * Validate values of `UserConfig` properties.
 */
const validateConfigValues = V.validateAll([
  ...PropSets.required.map(propIsDirectory),
  ...PropSets.files.map(optionalPropIsFile),
]);

// =============================================================================
// Implementation.
// =============================================================================

/**
 * Takes a base path `from`, then a `configuration` and resolves all paths in
 * that configration based on the base path.
 */
const resolveConfigPaths = (s: T.Path) => (c: UserConfig): UserConfig => {
  const from = parse(s);
  const result: UserConfig = {
    ...R.pick([K.categories], c),
    styles: resolve(from, parse(c.styles)),
    pages: resolve(from, parse(c.pages)),
    posts: resolve(from, parse(c.posts)),
    destination: resolve(from, parse(c.destination)),
    layouts: resolve(from, parse(c.layouts)),
  };

  if (c.styleIndex) {
    result.styleIndex = resolve(
      parse(resolve(from, parse(c.styles))),
      parse(c.styleIndex),
    );
  }

  if (c.postTemplate) {
    result.postTemplate = resolve(
      parse(resolve(from, parse(c.layouts))),
      parse(c.postTemplate),
    );
  }

  return result;
};

/**
 * Merges defaults values with the provided user configuration.
 */
const mergeWithDefaults = (userConfig: UserConfig): Config =>
  R.mergeDeepRight(
    {
      styleIndex: join(userConfig.styles, defaults.styleIndex),
      postTemplate: join(userConfig.layouts, defaults.postTemplate),
      categories: defaults.categories,
      highlight: defaults.highlight,
      destination: {
        root: userConfig.destination,
        styles: join(userConfig.destination, defaults.destination.styles),
        posts: join(userConfig.destination, defaults.destination.posts),
      },
    },
    R.pick([K.pages, K.layouts, K.styles, K.posts], userConfig),
  );

/**
 * Takes a path to some configuration and returns a validated scribe
 * configuration.
 */
export default (s: T.Path) =>
  compose(
    V.map(mergeWithDefaults),
    V.flatMap(validateConfigValues),
    V.map(resolveConfigPaths(s)),
    validateConfigKeys,
    readAndParse,
  )(s);
