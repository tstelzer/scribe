import * as path from 'path';

import * as T from '../types';

const toTitle = (templatePath: T.Path) =>
  path.basename(templatePath).replace(/\..+/, '');

export const toPage = (destinationDirectory: T.Path) => (
  templatePath: T.Path,
): T.Page => {
  const title = toTitle(templatePath);
  const destinationPath = path.join(destinationDirectory, title + '.html');

  return {title, destinationPath, templatePath};
};

export const reducePages = (pages: T.PageContext, page: T.Page) => {
  pages[page.title] = page;

  return pages;
};
