import {
  Failure,
  Success,
  Validation as _Validation,
} from 'fp-ts/lib/Validation';
import * as path from 'path';

// --- type aliases ------------------------------------------------------------

export type Markdown = string;
export type Html = string;
export type Path = string;
export interface ParsedPath extends path.ParsedPath {
  full: string;
  isAbsolute: boolean;
  isDirectory: boolean;
}
export type File = {filepath: string; content: string};

// --- function interfaces -----------------------------------------------------

export type FileToFrontmatter = (file: File) => Frontmatter;
export type FileToHtml = (file: File) => Html;
export type PageToFile = (page: Page) => (postContext: PostContext) => File;
export type Logger = (...a: any) => void;

// --- error handling / validation ---------------------------------------------

export type Errors = string[];
export type Validation<M> = _Validation<Errors, M>;
export type Fail<M> = Failure<Errors, M>;
export type Pass<M> = Success<Errors, M>;
export type Validator<M> = (v: M) => Validation<M>;

// --- domain entities --------------------------------------------------------

/** Post metadata. */
export type Frontmatter = {
  category: string;
  excerpt: string;
  published: Date;
  slug: string;
  subtitle: string;
  tags: string[];
  title: string;
};

/** Individual article. */
export type Post = {
  frontmatter: Frontmatter;
  content: Html;
  sourcePath: Path;
  destinationPath: Path;
};

/** Accumulated posts. */
export type PostContext = {
  posts: {
    [title: string]: Post;
  };
};

/** Standalone content page. */
export type Page = {
  templatePath: Path;
  destinationPath: Path;
  title: string;
};

/** Accumulated pages. */
export type PageContext = {
  [title: string]: Page;
};

export type Config = {
  posts: string;
  pages: string;
  styles: string;
  layouts: string;
  destination: string;
  styleIndex: string;
  layoutPath: string;
};
