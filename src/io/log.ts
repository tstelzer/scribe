import colorize from 'chalk';

import * as T from '../types';

const logger = (f: T.Logger) => (...a: any) => {
  f('[' + colorize.blue('Scribey') + ']', ...a);
};

const toConsole = logger(console.log);

export const stdout = {
  wroteFile: ({filepath, content}: T.File) =>
    toConsole('Wrote file:', colorize.magenta(filepath)),
  error: (e: Error) => toConsole(colorize.red('Error:'), e),
};
