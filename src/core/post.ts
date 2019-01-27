import {format as formatDate} from 'date-fns';
import * as R from 'ramda';

import * as V from '../lib/validation';
import * as T from '../types';

const excludes = R.complement(R.contains);

const context = 'While parsing and compiling a post :\n';

const t = {
  propertyIsRequired: (s: string) =>
    `${context}The property "<%s${s}%>" is required in configuration.`,
};

const isValidDate = (date: any) =>
  date &&
  Object.prototype.toString.call(date) === '[object Date]' &&
  !isNaN(date);

// =============================================================================
// Types.
// =============================================================================

enum K {
  categories = 'categories',
}

// =============================================================================
// Post validation.
// =============================================================================

export const validatePost2 = (post: T.Post): V.Validation<T.Post> => {
  return V.pass(post);
};

// =============================================================================
// Rest.
// =============================================================================
export const validatePost = (post: T.Post): T.Post => {
  const {frontmatter, postContent, sourcePath} = post;
  const {title, subtitle, published, category} = frontmatter;

  const E = (s: string) => new Error(s + `for post: ${sourcePath}.`);

  if (!title) {
    throw E('Field "title" is required');
  }

  // if (!subtitle) {
  //   throw E('Field "subtitle" is required');
  // }

  if (!isValidDate(new Date(published))) {
    throw E('Field "published" is missing or incorrect');
  }

  const categories = ['opinion', 'story', 'tutorial', 'concept', 'review'];
  const cs = R.join(', ', categories);

  if (!category || excludes(category, categories)) {
    throw E('Field "category" is required and must be one of ' + cs);
  }

  const parsePublished = (s: string) => formatDate(new Date(s), 'MMMM YYYY');

  return R.evolve(
    {
      frontmatter: {
        published: parsePublished,
      },
    },
    post,
  );
};

export const reducePostContext = (context: T.PostContext, post: T.Post) => {
  context.posts[post.frontmatter.title] = post;

  return context;
};
