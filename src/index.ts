import config from './core/config';
import {logFailures} from './core/log';
import scribe from './scribe';

const configPath =
  typeof process.argv[2] === 'string'
    ? process.argv[2]
    : 'no config path supplied';

config(configPath)
  .map(scribe)
  .fold(logFailures, sink$ =>
    sink$.subscribe(e => e.fold(logFailures, console.log)),
  );
