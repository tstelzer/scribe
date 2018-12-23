import * as path from 'path';
import * as pug from 'pug';

import * as T from '../types';

export const compilePost = (templatePath: T.Path) => (
  post: T.Post,
): T.File => ({
  // FIXME: This is IO and throws, would be nice if we could push it behind the
  // boundary and keep this pure
  content: pug.compileFile(templatePath)({
    postContent: post.content,
    ...post.frontmatter,
  }),
  filepath: post.destinationPath,
});

export const compilePage = (page: T.Page) => (
  context: T.PostContext,
): T.File => ({
  filepath: page.destinationPath,
  // FIXME: This is IO and throws, would be nice if we could push it behind the
  // boundary and keep this pure
  content: pug.compileFile(page.templatePath)(context),
});
