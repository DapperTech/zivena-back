export type SitemapEntry = {
  slug: string;
  lastModified?: string;
};

export type SitemapData = {
  products: SitemapEntry[];
  categories: SitemapEntry[];
};
