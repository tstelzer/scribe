import chalk from 'chalk';
import {Failure, isFailure} from 'fp-ts/lib/Validation';
import {homedir} from 'os';
import * as path from 'path';
import {pathToConfig} from './io/config';
import * as T from './types';
// import {scribe} from './scribe';

const result = pathToConfig('~/dev/project/timmstelzer/config.json');

// FIXME: make error logger module

const logFailures = (failure: Failure<T.Errors, any>): void => {
  console.log(
    chalk.redBright.dim('Scribe :: Failed while parsing configuration.\n'),
  );
  failure.value.forEach((s: string, i: number) =>
    console.log(chalk.yellowBright(`(${i + 1}) ${s}\n`)),
  );
};

if (isFailure(result)) {
  logFailures(result);
} else {
  console.log(result.value);
}
