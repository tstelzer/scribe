import chalk from 'chalk';

import * as T from '../types';

export const logFailures = (failure: T.Fail<any>): void => {
  console.log(
    chalk.redBright.dim('Scribe :: Failed while parsing configuration.\n'),
  );
  failure.value.forEach((s: string, i: number) =>
    console.log(chalk.yellowBright(`(${i + 1}) ${s}\n`)),
  );
};
