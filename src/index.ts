import chalk from 'chalk';
import {Failure, isFailure} from 'fp-ts/lib/Validation';
import {fromPath, toConfig} from './io/config';
import * as T from './types';
// import {scribe} from './scribe';

const result = fromPath('./.prettierrc.json');

// FIXME: make error logger module

const logErrors = (result: Failure<any, any>): void => {
  console.log(
    chalk.redBright.dim('Scribe :: Failed while parsing configuration.\n'),
  );
  result.value.forEach((s: string, i: number) =>
    console.log(chalk.yellowBright(`(${i}) ${s}\n`)),
  );
};

if (isFailure(result)) {
  logErrors(result);
} else {
  console.log(result.value);
}
