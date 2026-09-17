export type CategorySource = {
  portal: string;
  url: string;
  extractedAt: string;
};

export type CategoryEntity = {
  databaseId: string;
  id: string;
  name: string;
  slug: string;
  url: string;
  image: string;
  sortOrder: number;
  source: CategorySource;
};

export type CatalogCategory = Pick<CategoryEntity, "id" | "name" | "slug" | "url" | "image"> & {
  productCount: number;
};
