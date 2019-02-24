import * as autoprefixer from 'autoprefixer';
import * as cssnano from 'cssnano';
import * as sass from 'node-sass';
import * as postcss from 'postcss';
import * as R from 'ramda';

import * as T from '../types';

const postcssPlugins = [autoprefixer, cssnano];

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
      postcss(postcssPlugins)
        .process(content, {from: undefined})
        .then(({css}: {css: string}) => ({
          content: css,
          filepath,
        })),
  )({data: content, includePaths});
