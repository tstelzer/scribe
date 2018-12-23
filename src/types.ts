// --- type aliases ------------------------------------------------------------

export type Markdown = string;
export type Html = string;
export type Path = string;
export type File = {filepath: string; content: string};

// --- function interfaces -----------------------------------------------------

export type FileToFrontmatter = (file: File) => Frontmatter;
export type FileToHtml = (file: File) => Html;
export type PageToFile = (page: Page) => (postContext: PostContext) => File;
export type Logger = (...a: any) => void;

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
  source: {
    posts: string;
    pages: string;
    styles: string;
    layouts: string;
  };
  destination: string;
  exclude: string[];
  include: string[];
};
