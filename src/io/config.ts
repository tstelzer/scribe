import {traverse} from 'fp-ts/lib/Array';
import {getArrayMonoid} from 'fp-ts/lib/Monoid';
import {
  failure,
  getApplicative,
  isSuccess,
  Validation,
} from 'fp-ts/lib/Validation';
import {existsSync, lstatSync, PathLike, readFile, readFileSync} from 'fs';
import * as path from 'path';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';
import * as T from '../types';

// "type classes"

const validation = getApplicative(getArrayMonoid<string>());

// List of pre-defined failure messages
const e = {
  'incorrect-config-path': (s: string) =>
    `The provided path to the configuration file should be a string, but was "${s}" of type ${typeof s}.`,
  'config-is-not-a-file': (s: string) =>
    `Configuration needs to be a file, but none of was found at the provided path "${s}".`,
};

// predicates

const isFile = existsSync;
const isDirectory = (path: string) =>
  existsSync(path) && lstatSync(path).isDirectory();

// validation

const checkString = (p: T.Path) =>
  R.type(p) !== 'String'
    ? failure([e['incorrect-config-path'](p)])
    : validation.of(p);

const checkFile = (p: T.Path) =>
  !isFile(p) ? failure([e['config-is-not-a-file'](p)]) : validation.of(p);

const validateConfigPath = (p: any): Validation<T.Errors, T.Path> => {
  const checks = [checkString, checkFile];

  return traverse(validation)(checks, f => f(p)).map(() => p);
};

// FIXME: Stop being lazy and write the config checks ...
const root = path.join(process.env.HOME || '~', 'dev', 'timmstelzer');
const posts = path.join(process.env.HOME || '~', 'doc', 'articles');

// const hasPaths = R.map([['source'], ['source']]);

const defaultConfig = {
  source: {
    posts,
    pages: path.join(root, 'src', 'pages'),
    styles: path.join(root, 'src', 'styles'),
    layouts: path.join(root, 'src', 'layouts'),
  },
  destination: path.join(root, 'dist'),
  exclude: ['node_modules'],
  include: ['.htaccess'],
};

const readAndParse = R.pipe(
  (p: T.Path) => readFileSync(p, {encoding: 'utf8', flag: 'r'}),
  JSON.parse,
);

export const fromPath = (p: any) => {
  const result = validateConfigPath(p);
  return isSuccess(result) ? validation.of(readAndParse(result.value)) : result;
};

export const toConfig = R.mergeDeepLeft(defaultConfig);
