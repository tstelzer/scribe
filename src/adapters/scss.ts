import autoprefixer = require('autoprefixer');
import cssnano = require('cssnano');
import sass = require('node-sass');
import * as postcss from 'postcss';
import R = require('ramda');

import * as T from '../types';

export const compileCss = ({
  content,
  includePaths,
  filepath,
}: {
  content: string;
  includePaths: T.Path[];
  filepath: T.Path;
}): Promise<T.File> =>
  R.pipe(
    // FIXME: This is IO and throws, would be nice if we could push it behind
    // the boundary and keep this pure
    sass.renderSync,
    ({stats: {includedFiles}, css}) => ({
      content: css.toString(),
      include: includedFiles,
    }),
    ({content, include}) =>
      // FIXME: This is IO and throws, would be nice if we could push it behind
      // the boundary and keep this pure
      postcss([autoprefixer, cssnano])
        .process(content, {from: undefined})
        .then(({css}) => ({
          content: css,
          filepath,
        })),
  )({data: content, includePaths});
