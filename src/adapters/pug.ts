import * as pug from 'pug';

import * as T from '../types';

export const compilePost = (templatePath: T.Path) => (
  post: T.Post,
): T.File => ({
  content: pug.compileFile(templatePath)({
    postContent: post.postContent,
    ...post.frontmatter,
  }),
  filepath: post.destinationPath,
});

export const compilePage = (page: T.Page) => (
  context: T.PostContext,
): T.File => ({
  filepath: page.destinationPath,
  content: pug.compileFile(page.templatePath)(context),
});
