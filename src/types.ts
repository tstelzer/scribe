export type Markdown = string;
export type Html = string;
export type File = {filepath: string; content: string};

export type FrontmatterAdapter = (file: File) => Frontmatter;
export type HtmlAdapter = (file: File) => Html;
export type PageAdapter = (page: Page) => (postContext: PostContext) => File;

/**
 * Post metadata.
 */
export type Frontmatter = {
  category: string;
  excerpt: string;
  published: Date;
  slug: string;
  subtitle: string;
  tags: string[];
  title: string;
};

/**
 * Post.
 */
export type Post = {
  frontmatter: Frontmatter;
  content: string;
  sourcePath: string;
};

export type PostContext = {
  posts: {
    [title: string]: Post;
  };
};

export type Page = {
  templatePath: string;
  filepath: string;
  title: string;
};

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
