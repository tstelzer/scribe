import * as hljs from 'highlight.js';
import * as Markdown from 'markdown-it';
import * as withAnchors from 'markdown-it-anchor';
import * as withAttributes from 'markdown-it-attrs';
import * as withTableOfContents from 'markdown-it-table-of-contents';

import * as T from '../types';

/**
 * Highlight function for markdown-it.
 */
const highlight = (content: T.Html, language: string) =>
  '<code class="hljs">' + hljs.highlight(language, content).value + '</code>';

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
    .use(withTableOfContents)
    .use(withAnchors, {listType: 'ol'})
    .render(content.replace(/---[^-]+---/, ''));
