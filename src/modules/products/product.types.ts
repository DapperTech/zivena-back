export type ProductImage = {
  originalUrl: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  title?: string;
  alt?: string;
  magentoProductId?: string;
  source?: string;
};

export type ProductAvailability = {
  status: string;
  availableQuantity?: number;
  text: string;
};

export type ProductVariantOption = {
  attributeId: string;
  attributeCode: string;
  attribute: string;
  optionId: string;
  value: string;
};

export type ProductVariant = {
  magentoProductId: string;
  options: ProductVariantOption[];
  images: ProductImage[];
};

export type ProductAttribute = {
  name: string;
  value: string;
};

export type ProductSpecification = {
  section: string;
  attributes: ProductAttribute[];
};

export type ProductMeta = {
  title?: string;
  description?: string;
  ogTitle?: string;
};

export type ProductReferenceSource = {
  type: "category" | "subcategory";
  categoryId: string;
  subcategoryId?: string;
  url: string;
};

export type CatalogSource = {
  portal: string;
  url: string;
  extractedAt: string;
};

export type ProductEntity = {
  databaseId: string;
  id: string;
  sku: string;
  name: string;
  url: string;
  magentoProductId: string;
  productType: string;
  categoryIds: string[];
  subcategoryIds: string[];
  description: string;
  featured: boolean;
  availability: ProductAvailability;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  additionalAttributes: ProductAttribute[];
  meta: ProductMeta;
  sources: ProductReferenceSource[];
  source: CatalogSource;
};

export type CatalogProduct = Pick<
  ProductEntity,
  | "id"
  | "sku"
  | "name"
  | "categoryIds"
  | "featured"
  | "availability"
> & {
  slug: string;
  image: ProductImage;
  categoryTitles: string[];
  subcategoryTitles: string[];
};

export type ProductSuggestion = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  image?: ProductImage;
  categoryTitle?: string;
};

export type ProductDetail = Omit<ProductEntity, "databaseId"> & {
  slug: string;
  categoryTitles: string[];
  subcategoryTitles: string[];
};

export type CatalogPage = {
  items: CatalogProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export type AdminCatalogProduct = CatalogProduct & {
  subcategoryIds: string[];
  isVisible: boolean;
};

export type AdminCatalogPage = Omit<CatalogPage, "items"> & {
  items: AdminCatalogProduct[];
};
