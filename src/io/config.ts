import * as path from 'path';
import * as R from 'ramda';

// FIXME: Stop being lazy and write the config checks ...
const root = path.join(process.env.HOME || '~', 'dev', 'timmstelzer');
const posts = path.join(process.env.HOME || '~', 'posts');

const defaultConfig = {
  source: {
    posts,
    pages: path.join(root, 'src', 'pages'),
    styles: path.join(root, 'src', 'styles'),
    layouts: path.join(root, 'src', 'layouts'),
  },
  destination: path.join(root, 'dist'),
  exclude: ['node_modules'],
  include: ['.htaccess'],
};

export const toConfig = (userConfig = {}) =>
  R.mergeDeepLeft(defaultConfig, userConfig);
