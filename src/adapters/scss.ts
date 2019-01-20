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
    sass.renderSync,
    ({stats: {includedFiles}, css}) => ({
      content: css.toString(),
      include: includedFiles,
    }),
    ({content, include}) =>
      postcss([autoprefixer, cssnano])
        .process(content, {from: undefined})
        .then(({css}) => ({
          content: css,
          filepath,
        })),
  )({data: content, includePaths});
