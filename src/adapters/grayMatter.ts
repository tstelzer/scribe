import * as matter from 'gray-matter';
import {basename} from 'path';
import * as R from 'ramda';

import * as T from '../types';

const titleToSlug = R.pipe(
  R.replace(/[^\s\w]/g, ''),
  R.trim,
  R.replace(/\s/g, '-'),
  R.toLower,
);

const filepathToSlug = (filepath: T.Path) =>
  basename(filepath).replace(/\..+/, '');

const contentToExcerpt = R.pipe(
  R.split('\n'),
  (xs: string[]) => R.head(xs),
);

const splitTags = R.pipe(
  R.trim,
  R.split(','),
);

export const fileToFrontmatter = ({content, filepath}: T.File): T.Frontmatter =>
  R.pipe(
    (s: string) => matter(s, {excerpt: true, excerpt_separator: '\n\n'}),
    (a: any) => ({...a, meta: a.data}),
    ({
      meta: {category, excerpt, published, slug, subtitle, tags, title},
      content: extractedContent,
      excerpt: extractedExcerpt,
    }) => ({
      category,
      excerpt:
        extractedExcerpt || excerpt || contentToExcerpt(extractedContent),
      published,
      slug: slug || filepathToSlug(filepath),
      subtitle,
      tags: tags ? splitTags(tags) : [],
      title,
    }),
  )(content);
