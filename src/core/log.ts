import chalk from 'chalk';

export const logFailures = (messages: string[]): void => {
  console.log(
    chalk.redBright.dim('Scribe :: Failed while parsing configuration.\n'),
  );
  messages.forEach((message: string, i: number) =>
    console.log(chalk.yellowBright(`(${i + 1}) ${message}\n`)),
  );
};
