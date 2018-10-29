import * as R from 'ramda';
import {Post, PostContext} from '../types';

const excludes = R.complement(R.contains);

const isValidDate = (date: any) =>
  date &&
  Object.prototype.toString.call(date) === '[object Date]' &&
  !isNaN(date);

export const validatePost = (post: Post): Post => {
  const {frontmatter, content, sourcePath} = post;
  const {title, subtitle, published, category} = frontmatter;

  const E = (s: string) => new Error(s + `for post: ${sourcePath}.`);

  if (!title) {
    throw E('Field "title" is required');
  }

  if (!subtitle) {
    throw E('Field "subtitle" is required');
  }

  if (!isValidDate(new Date(published))) {
    throw E('Field "published" is missing or incorrect');
  }

  // FIXME: magic / move to config.
  const categories = ['opinion', 'story', 'tutorial', 'concept', 'review'];
  const cs = R.join(', ', categories);

  if (!category || excludes(category, categories)) {
    throw E('Field "category" is required and must be one of ' + cs);
  }

  return post;
};

export const reducePostContext = (context: PostContext, post: Post) => {
  context.posts[post.frontmatter.title] = post;

  return context;
};
