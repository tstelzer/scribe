import * as R from 'ramda';

import {format as _format} from 'date-fns';

/**
 * @sig format :: String -> Date -> String
 */
export const format = R.curry(R.flip(_format));
