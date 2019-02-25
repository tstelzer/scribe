import {format as formatDate, isValid, parse as parseDate} from 'date-fns';
import {Lens} from 'monocle-ts';
import * as R from 'ramda';

import {Config} from '../core/config';
import * as V from '../lib/validation';
import * as T from '../types';

// =============================================================================
// Post validation.
// =============================================================================

const context = 'While parsing and compiling a post:\n';

const t = {
  incorrectCategory: (xs: string[], s: string) =>
    `${context}The category must be one of "<%s${xs.join(
      ', ',
    )}%>", but was "<%e${s}%>".`,
  propertyIsRequired: (k: string) => (a: T.UserPost) =>
    `${context}The property "<%s${k}%>" is required in frontmatter of post <%s${
      a.sourcePath
    }%>.`,
  publishedMustBeValidDate: (a: T.UserPost) =>
    `${context}The property <%spublished%> must be a valid Date, but was <%e${
      a.frontmatter.published
    }%>.`,
};

const validCategory = (allCategories: string[]) => (
  post: T.UserPost,
): V.Validation<T.UserPost> =>
  R.includes(post.frontmatter.category, allCategories)
    ? V.pass(post)
    : V.fail(t.incorrectCategory(allCategories, post.frontmatter.category));

const propIsRequired = (property: string) => (
  p: T.UserPost,
): V.Validation<T.UserPost> =>
  R.path(['frontmatter', property], p)
    ? V.pass(p)
    : V.fail(t.propertyIsRequired(property)(p));

const publishIsDate = (p: T.UserPost): V.Validation<T.UserPost> =>
  isValid(new Date(p.frontmatter.published))
    ? V.pass(p)
    : V.fail(t.publishedMustBeValidDate(p));

export const validatePost = (config: Config) =>
  V.validateSequence(
    V.validateAll<T.UserPost>(
      ['published', 'title', 'category'].map(propIsRequired),
    ),
    V.validateAll<T.UserPost>([
      validCategory(config.categories),
      publishIsDate,
    ]),
  );

// =============================================================================

export const toPost = (a: T.UserPost): T.Post => {
  return R.evolve(
    {
      frontmatter: {
        published: parseDate,
      },
    },
    a,
  );
};

export const reducePostContext = (
  context: T.PostContext,
  post: T.Post,
): T.PostContext => {
  context.posts[post.frontmatter.title] = post;
  return context;
};
