import {isSuccess} from 'fp-ts/lib/Validation';
import config from './core/config';
import {writeFile} from './core/file';
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
      if (e.isFailure()) {
        logFailures(e.value);
      } else {
        writeFile({
          next: ({content, filepath}: {content: any; filepath: any}) =>
            console.log('successfully wrote', filepath),
          error: console.error,
        })(e.value);
      }
    }),
  );
