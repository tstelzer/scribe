import * as path from 'path';
import * as pug from 'pug';
import * as R from 'ramda';
import {combineLatest, of} from 'rxjs';
import * as O from 'rxjs/operators';

import {Page, PageContext} from '../types';

const toTitle = (templatePath: string) =>
  path.basename(templatePath).replace(/\..+/, '');

const toFilepath = (destination: string, title: string) =>
  path.join(destination, title + '.html');

export const toPage = (destination: string) => (
  templatePath: string,
): Page => ({
  title: toTitle(templatePath),
  filepath: toFilepath(destination, toTitle(templatePath)),
  templatePath,
});

export const reducePages = (pages: PageContext, page: Page) => {
  pages[page.title] = page;

  return pages;
};
