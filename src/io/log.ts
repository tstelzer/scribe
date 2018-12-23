import colorize from 'chalk';

import {File, Logger} from '../types';

const logger = (f: Logger) => (...a: any) => {
  f('[' + colorize.blue('Scribey') + ']', ...a);
};

const toConsole = logger(console.log);

export const stdout = {
  wroteFile: ({filepath, content}: File) =>
    toConsole('Wrote file:', colorize.magenta(filepath)),
  error: (e: Error) => toConsole(colorize.red('Error:'), e),
};
