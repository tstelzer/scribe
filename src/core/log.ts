import chalk from 'chalk';
import * as R from 'ramda';

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

type Type = 's' | 't' | 'f';
const types: Record<Type, (s: string) => string> = {
  s: chalk.greenBright,
  t: chalk.cyanBright,
  f: chalk.whiteBright,
};

/**
 * Colorizes a failure description by replacing sections wrapped in `<%[type]`
 * and `%>`. See `types` for the colors used.
 */
const logDescription = (description: string) => {
  const section = description;
  const colorize = (_: string, type: Type, match: string) => types[type](match);
  const result = section.replace(/<%(\w)([^%>]+)%>/g, colorize);

  console.log(chalk.yellow('Description:'), chalk.yellowBright(result));
};

export const logFailures = (messages: T.Messages): void => {
  logTitle('Scribe failed with the following messages:');

  messages.forEach(({description, context}) => {
    console.log('\n');

    logContext(context);
    logDescription(description);
  });
};
