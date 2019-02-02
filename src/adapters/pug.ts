import * as pug from 'pug';

import * as T from '../types';

export const compilePost: T.PostToFile = templatePath => post => ({
  content: pug.compileFile(templatePath)({
    postContent: post.postContent,
    ...post.frontmatter,
  }),
  filepath: post.destinationPath,
});

export const compilePage: T.PageToFile = page => context => ({
  filepath: page.destinationPath,
  content: pug.compileFile(page.templatePath)(context),
});
