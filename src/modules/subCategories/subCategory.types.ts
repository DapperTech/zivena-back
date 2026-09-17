import { CategorySource } from "../categories/category.types";

export type SubCategoryEntity = {
  databaseId: string;
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  url: string;
  sortOrder: number;
  source: CategorySource;
};
