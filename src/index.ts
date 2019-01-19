import {isFailure} from 'fp-ts/lib/Validation';

import {pathToConfig} from './core/config';
import {logFailures} from './core/log';

const result = pathToConfig('~/dev/project/timmstelzer/config.json');

if (isFailure(result)) {
  logFailures(result);
} else {
  console.log(result.value);
}
