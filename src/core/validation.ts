import {traverse} from 'fp-ts/lib/Array';
import {getArrayMonoid} from 'fp-ts/lib/Monoid';
import {
  failure as _failure,
  getApplicative,
  isSuccess as _isSuccess,
  success as _success,
} from 'fp-ts/lib/Validation';
import * as R from 'ramda';

import * as T from '../types';

/** Instance of an Applicative Validation. */
export const validation = getApplicative(getArrayMonoid<T.Message>());

/** Allows traversing over a validation. */
const traverseV = traverse(validation);

/**
 * Validates some `value` by applying a list of `checks`. Returns a
 * `Validation`, an applicative `Either`, wrapping a list of failure messages or
 * the `value` of type `M`, depending on the success of checks. Being an
 * instance of `applicative` means that it is not fail-fast but accumulating
 * messages.
 *
 * validate :: [(a -> Validation<b, a>)] -> a -> Validation<b, a>
 */
export const validate = <M>(checks: Array<T.Validator<M>>) => (value: M) =>
  traverseV(checks, f => f(value)).map(R.always(value));

/** Returns a Validation Failure. */
export const fail = <A>(message: T.Message): T.Validation<A> =>
  _failure([message]);

/** Returns a Validation Success. */
export const succeed = _success;

/** Asserts that Validation succeeded. */
export const isSuccess = _isSuccess;

/** Generate failure message. */
export const message = (context: string) => (
  description: string,
): T.Message => ({description, context});
