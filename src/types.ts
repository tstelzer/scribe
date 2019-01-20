import {
  Failure as _Failure,
  Success as _Success,
  Validation as _Validation,
} from 'fp-ts/lib/Validation';
import * as path from 'path';

/** A expected failure message. */
export type Message = {
  /** What was scribe doing when the failure occured. */
  context: string;
  /** A description of the failure. */
  description: string;
};

/** List of expected failure messages. */
export type Messages = Message[];

/** Alias for Failure. */
export type Failure<M> = _Failure<Messages, M>;

/** Alias for Success. */
export type Success<M> = _Success<Messages, M>;

/** Alias for Validation. */
export type Validation<M> = _Validation<Messages, M>;

/** A function validating a value. */
export type Validator<M> = (v: M) => Validation<M>;

export type FileToFrontmatter = (file: File) => Frontmatter;
export type FileToHtml = (file: File) => Html;
export type PageToFile = (page: Page) => (postContext: PostContext) => File;
export type Logger = (...a: any) => void;

export type Markdown = string;
export type Html = string;
export type Path = string;
export interface ParsedPath extends path.ParsedPath {
  full: string;
  isAbsolute: boolean;
  isDirectory: boolean;
}
export type File = {filepath: string; content: string};

/** Post metadata. */
export type Frontmatter = {
  category: string;
  excerpt: string;
  published: string;
  slug: string;
  subtitle: string;
  tags: string[];
  title: string;
};

/** Individual article. */
export type Post = {
  frontmatter: Frontmatter;
  postContent: Html;
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
