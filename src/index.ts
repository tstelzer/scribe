import {pathToConfig} from './core/config';
import {logFailures} from './core/log';

const configPath =
  typeof process.argv[2] === 'string'
    ? process.argv[2]
    : 'no config path supplied';

pathToConfig(configPath).fold(logFailures, console.log);
