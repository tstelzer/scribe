import chalk from 'chalk';
import * as R from 'ramda';

import * as V from '../lib/validation';
import * as T from '../types';

const logTitle = R.pipe(
  (s: string) => chalk.yellowBright(s),
  console.log,
);

const separator = (n: number) =>
  R.pipe(
    (s: string) => chalk.yellowBright(s),
    s => console.log(s),
  )(R.join('', R.repeat('-', n)));

const logContext = R.pipe(
  (s: string) => chalk.yellowBright(s),
  s => console.log(chalk.yellow('Context:'), s),
);

type Type = 's' | 't' | 'f' | 'e';
const types: Record<Type, (s: string) => string> = {
  s: chalk.greenBright,
  t: chalk.cyanBright,
  f: chalk.whiteBright,
  e: chalk.redBright,
};

/**
 * Colorizes a failure description by replacing sections wrapped in `<%[type]`
 * and `%>`. See `types` for the colors used.
 */
const logDescription = (description: string) => {
  const section = description;
  const colorize = (_: string, type: Type, match: string) => types[type](match);
  const result = section.replace(/<%(\w)([^%>]+)%>/g, colorize);

  console.log(chalk.yellowBright(result));
};

export const logFailures = (messages: V.Message[]): void => {
  logTitle('Scribe encountered the following problems:');
  console.log('\n');
  messages.forEach(message => {
    logDescription(message);
    console.log('\n');
  });
};
