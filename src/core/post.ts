import * as R from 'ramda';
import * as T from '../types';

const excludes = R.complement(R.contains);

const isValidDate = (date: any) =>
  date &&
  Object.prototype.toString.call(date) === '[object Date]' &&
  !isNaN(date);

export const validatePost = (post: T.Post): T.Post => {
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

  const categories = ['opinion', 'story', 'tutorial', 'concept', 'review'];
  const cs = R.join(', ', categories);

  if (!category || excludes(category, categories)) {
    throw E('Field "category" is required and must be one of ' + cs);
  }

  return post;
};

export const reducePostContext = (context: T.PostContext, post: T.Post) => {
  context.posts[post.frontmatter.title] = post;

  return context;
};
