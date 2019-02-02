import {
  Failure as _Failure,
  Success as _Success,
  Validation as _Validation,
} from 'fp-ts/lib/Validation';
import * as path from 'path';

/** Exclude properties `K` from `T`. */
export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

/** Only keeps properties in Record `T` that are of type `U`. */
export type FilterRecord<T, U> = NonNullable<
  {[K in keyof T]: T[K] extends U ? K : never}[keyof T]
>;

/** Only keeps properties in Record `T` that are _not_ of type `U`. */
export type DiffRecord<T, U> = NonNullable<
  {[K in keyof T]: T[K] extends U ? never : K}[keyof T]
>;

/** Only keeps properties in Record `T` that are not optional. */
export type FilterRequiredProps<T> = NonNullable<
  {[K in keyof T]: T[K] extends NonNullable<T[K]> ? K : never}[keyof T]
>;

/** Only keeps properties in Record `T` that are optional. */
export type FilterOptionalProps<T> = NonNullable<
  {[K in keyof T]: T[K] extends NonNullable<T[K]> ? never : K}[keyof T]
>;

/** Only keeps properties in Record `T` that are arrays. */
export type FilterArrayProps<T> = FilterRecord<T, []>;

/** Only keeps properties in Record `T` that are strings. */
export type FilterStringProps<T> = FilterRecord<T, string>;

export type FileToFrontmatter = (file: File) => UserFrontmatter;
export type FileToHtml = (file: File) => Html;
export type PageToFile = (page: Page) => (postContext: PostContext) => File;
export type PostToFile = (p: Path) => (post: Post) => File;
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

/** Raw Post metadata. */
export type UserFrontmatter = {
  category: string;
  excerpt: string;
  published: string;
  slug: string;
  subtitle: string;
  tags: string[];
  title: string;
};

/** Raw Individual article. */
export type UserPost = {
  frontmatter: UserFrontmatter;
  postContent: Html;
  sourcePath: Path;
  destinationPath: Path;
};

/** Raw Post metadata. */
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
