import {format as formatDate} from 'date-fns';
import * as R from 'ramda';
import * as RA from 'ramda-adjunct';

import {Config} from '../core/config';
import * as V from '../lib/validation';
import * as T from '../types';

const excludes = R.complement(R.contains);

const context = 'While parsing and compiling a post:\n';

const t = {
  incorrectCategory: (xs: string[], s: string) =>
    `${context}The category must be one of "<%s${xs.join(
      ', ',
    )}%>", but was "<%e${s}%>".`,
  propertyIsRequired: (k: string) => (a: T.Post) =>
    `${context}The property "<%s${k}%>" is required in frontmatter of post <%s${
      a.sourcePath
    }%>.`,
};

const isValidDate = (date: any) =>
  date &&
  Object.prototype.toString.call(date) === '[object Date]' &&
  !isNaN(date);

// =============================================================================
// Types.
// =============================================================================

// =============================================================================
// Post validation.
// =============================================================================

const validCategory = (allCategories: string[]) => (
  post: T.Post,
): V.Validation<T.Post> =>
  R.includes(post.frontmatter.category, allCategories)
    ? V.pass(post)
    : V.fail(t.incorrectCategory(allCategories, post.frontmatter.category));

const isPresent = (property: string) => (value: any) =>
  RA.isNotNil(value) && R.has(property, value);

const propIsRequired = (property: string) => (
  p: T.Post,
): V.Validation<T.Post> =>
  R.path(['frontmatter', property], p)
    ? V.pass(p)
    : V.fail(t.propertyIsRequired(property)(p));

export const validatePost2 = (config: Config) =>
  V.validateAll<T.Post>([
    validCategory(config.categories),
    ...['published', 'title'].map(propIsRequired),
  ]);

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

  // const categories = ['opinion', 'story', 'tutorial', 'concept', 'review'];
  // const cs = R.join(', ', categories);

  // if (!category || excludes(category, categories)) {
  //   throw E('Field "category" is required and must be one of ' + cs);
  // }

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
