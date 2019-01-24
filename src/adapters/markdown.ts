// import * as hljs from 'highlight.js';
import * as Markdown from 'markdown-it';
import * as withAbbr from 'markdown-it-abbr';
import * as withAnchors from 'markdown-it-anchor';
import * as withAttributes from 'markdown-it-attrs';
import * as withTableOfContents from 'markdown-it-toc-done-right';
import * as prism from 'prismjs';

import * as T from '../types';

// Yeah, this is dumb. Unfortunately this is how prismjs wants me to load
// languages.
const languages = ['haskell', 'diff'];
languages.forEach(language => {
  require(`prismjs/components/prism-${language}`);
});

const highlight = (content: T.Html, language: string) =>
  prism.highlight(content, prism.languages[language]);

/**
 * Takes a string of markdown and transforms it to html.
 */
export const fileToHtml = ({content, filepath}: T.File): T.Html =>
  new Markdown('default', {
    html: false,
    xhtmlOut: false,
    breaks: false,
    langPrefix: 'language-',
    linkify: true,
    typographer: false,
    quotes: `"",''`,
    highlight,
  })
    .use(withAttributes)
    .use(withTableOfContents, {
      level: 2,
    })
    .use(withAnchors, {
      listType: 'ol',
      level: 2,
      permalink: true,
      permalinkBefore: true,
      permalinkSymbol: '🔗',
    })
    .use(withAbbr)
    // FIXME: This removes front matter from content.
    .render(content.replace(/---[^]+(?=---)---\n/gm, ''));
