import {Either, left, right} from 'fp-ts/lib/Either';
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

export const compilePostE = (templatePath: T.Path) => (
  post: T.Post,
): Either<string, T.File> => {
  try {
    return right({
      content: pug.compileFile(templatePath)({
        postContent: post.postContent,
        ...post.frontmatter,
      }),
      filepath: post.destinationPath,
    });
  } catch (e) {
    return left(e.message);
  }
};

export const compilePage = (page: T.Page) => (
  context: T.PostContext,
): T.File => ({
  filepath: page.destinationPath,
  content: pug.compileFile(page.templatePath)(context),
});

export const compilePageE = (page: T.Page) => (
  context: T.PostContext,
): Either<string, T.File> => {
  try {
    return right({
      content: pug.compileFile(page.templatePath)(context),
      filepath: page.destinationPath,
    });
  } catch (e) {
    return left(e.message);
  }
};
