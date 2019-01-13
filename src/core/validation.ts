import * as T from '../types';

const Success = {
  of: (value: any): T.Success => ({kind: 'success', value}),
};

const isSuccess = (result: T.Result) => result.kind === 'success';

const Failure = {
  of: (value: Error): T.Failure => ({kind: 'failure', value}),
};

const isFailure = (result: T.Result) => result.kind === 'failure';

const Result = {
  fold: (result: T.Result) => result.value,
};
