import config from './core/config';
import {logFailures} from './core/log';
import scribe from './scribe';

const configPath =
  typeof process.argv[2] === 'string'
    ? process.argv[2]
    : 'no config path supplied';

config(configPath).fold(logFailures, console.log);
