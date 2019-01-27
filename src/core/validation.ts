import {array} from 'fp-ts/lib/Array';
import {getArrayMonoid} from 'fp-ts/lib/Monoid';
import {
  failure as _failure,
  Failure as _Failure,
  getApplicative,
  getMonad,
  isSuccess as _isSuccess,
  success as _success,
  Success as _Success,
  Validation as _Validation,
} from 'fp-ts/lib/Validation';

/** A expected failure message. */
export type Message = string;

/** Represents a failed Validation. */
export type Failure<M> = _Failure<Message[], M>;

/** Represents a successful Validation. */
export type Success<M> = _Success<Message[], M>;

/** Either a Success or a Failure. */
export type Validation<A> = _Validation<Message[], A>;

/** A function validating some value. */
export type Validator<A> = (v: A) => Validation<A>;

/** Returns a Validation Failure. */
export const fail = <A>(message: Message): Validation<A> => _failure([message]);

/** Returns a Validation Success. */
export const pass = <A>(value: A): Validation<A> => _success(value);

/** Asserts that Validation succeeded. */
export const isSuccess = _isSuccess;

/** Instance of an Applicative Monoid. */
const validation = getMonad(getArrayMonoid<Message>());

export const flatMap = <A>(f: (v: A) => any) => (v: Validation<A>) =>
  isSuccess(v) ? f(v.value) : v;

export const map = <A>(f: (v: A) => any) => (v: Validation<A>) =>
  validation.map(v, f);

export const ap = validation.ap;
export const of = validation.of;

/** Traverse over validation. */
const traverse = array.traverse(validation);

/**
 * Takes a `predicate`, then a `message` and runs the `predicate`
 * against some `value`, returning a `Validation`. If you need more control
 * over generating failure messages (i.e. the signature of `message` is too
 * simplistic), or you want to handle predicates differently, simply write your
 * own `Validator` by using the `pass` and `fail` functions.
 */
export const validate = <A>(predicate: (value: A) => boolean) => (
  message: (value: A) => string,
): Validator<A> => (value: A) =>
  predicate(value) ? pass(value) : fail(message(value));

/**
 * Takes a list of `Validator`s and returns a new `Validator` which will apply
 * every one of the original `Validator`s to some `value`. Makes use of the
 * applicative nature of `Validation` and accumulates failure messages.
 *
 * @sig :: [(a -> Validation a)] -> a -> Validation a
 */
export const validateAll = <A>(checks: Array<Validator<A>>): Validator<A> => (
  value: A,
) => traverse(checks, f => f(value)).map(() => value);

export function validateSequence<A, B, C>(
  ab: (value: A) => Validation<B>,
  bc: (value: B) => Validation<C>,
): (a: A) => Validation<C>;

export function validateSequence<A, B, C, D>(
  ab: (value: A) => Validation<B>,
  bc: (value: B) => Validation<C>,
  cd: (value: C) => Validation<D>,
): (a: A) => Validation<D>;

export function validateSequence<A, B, C, D, E>(
  ab: (value: A) => Validation<B>,
  bc: (value: B) => Validation<C>,
  cd: (value: C) => Validation<D>,
  de: (value: D) => Validation<E>,
): (a: A) => Validation<E>;

/**
 * Performs fail-fast, left-right composition of `Validator`s. First `Failure`
 * is short-circuited.
 *
 * @sig :: (a -> Validation b) -> ... -> (a -> Validation n)
 */
export function validateSequence(
  ...fns: Array<Validator<any>>
): (value: any) => Validation<any> {
  const length = fns.length - 1;
  return function(this: any, value: any) {
    let result = pass(value);

    for (let i = 0; i <= length; i++) {
      if (!isSuccess(result)) {
        break;
      }
      result = fns[i].call(this, result.value);
    }

    return result;
  };
}
