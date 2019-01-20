import {pathToConfig} from './core/config';
import {logFailures} from './core/log';
import scribe from './scribe';
import * as T from './types';

const configPath =
  typeof process.argv[2] === 'string'
    ? process.argv[2]
    : 'no config path supplied';

pathToConfig(configPath).fold(logFailures, config => {
  // FIXME: Haven't been able to express to fp-ts that the result value at this
  // point can only be a `Success` of `Config`, so I have to do this explicit
  // type checking. Not ideal.
  if (typeof config !== 'string') {
    scribe(config);
  }
});
