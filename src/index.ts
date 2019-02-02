import {isSuccess} from 'fp-ts/lib/Validation';
import config from './core/config';
import {logFailures} from './core/log';
import * as V from './lib/validation';
import scribe from './scribe';
import * as T from './types';

const configPath =
  typeof process.argv[2] === 'string'
    ? process.argv[2]
    : 'no config path supplied';

config(configPath)
  .map(scribe)
  .map(a =>
    a.subscribe(e => {
      // Need to explicitly check here because my Validation type is apparently
      // fucked up. Typescript fails to infer Validation here, instead it infers
      // choice of Success or Failure (which is apparently not the same thing).
      if (e.isFailure()) {
        logFailures(e.value);
      } else {
        console.log('wrote', e.value.filepath);
      }
    }),
  );
