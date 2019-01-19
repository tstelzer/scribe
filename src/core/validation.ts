import {traverse} from 'fp-ts/lib/Array';
import {getArrayMonoid} from 'fp-ts/lib/Monoid';
import {getApplicative} from 'fp-ts/lib/Validation';
import * as R from 'ramda';

import * as T from '../types';

export const validation = getApplicative(getArrayMonoid<string>());
const traverseV = traverse(validation);

/**
 * Validates some `value` by applying a list of `checks`. Returns a
 * `Validation`, an applicative `Either`, wrapping a list of failure messages or
 * the `value` of type `M`, depending on the success of checks. Being an
 * instance of `applicative` means that it is not fail-fast but accumulating
 * messages.
 *
 * validate :: [(a -> Validation<[String], a>)] -> a -> Validation<[String], a>
 */
export const validate = <M>(checks: Array<T.Validator<M>>) => (value: M) =>
  traverseV(checks, f => f(value)).map(R.always(value));
