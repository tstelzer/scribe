import * as path from 'path';
import * as pug from 'pug';

import {File, Page, Post, PostContext} from '../types';

export const compilePost = (destination: string, templatePath: string) => (
  post: Post,
): File => ({
  content: pug.compileFile(templatePath)({
    postContent: post.content,
    ...post.frontmatter,
  }),
  filepath: path.join(destination, `${post.frontmatter.slug}.html`),
});

export const compilePage = (page: Page) => (context: PostContext): File => ({
  filepath: page.filepath,
  content: pug.compileFile(page.templatePath)(context),
});
