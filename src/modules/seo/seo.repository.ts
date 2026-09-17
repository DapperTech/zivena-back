import { CategoryModel } from "../categories/category.model";
import { ProductModel } from "../products/product.model";
import { productSlug } from "../products/productSlug";
import { SitemapData } from "./seo.types";

type SitemapProduct = {
  name: string;
  sku: string;
  source?: { extractedAt?: string };
};

type SitemapCategory = {
  slug: string;
  source?: { extractedAt?: string };
};

export class SeoRepository {
  async sitemapData(): Promise<SitemapData> {
    const [products, categories] = await Promise.all([
      ProductModel.find({}, { _id: 0, name: 1, sku: 1, "source.extractedAt": 1 }).lean(),
      CategoryModel.find({}, { _id: 0, slug: 1, "source.extractedAt": 1 }).lean()
    ]);

    return {
      products: (products as unknown as SitemapProduct[]).map((product) => ({
        slug: productSlug(product.name, product.sku),
        lastModified: product.source?.extractedAt
      })),
      categories: (categories as unknown as SitemapCategory[]).map((category) => ({
        slug: category.slug,
        lastModified: category.source?.extractedAt
      }))
    };
  }
}
