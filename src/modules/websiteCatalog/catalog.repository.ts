import { ProductModel } from "../products/product.model";
import { CategoryModel } from "../categories/category.model";
import { SubCategoryModel } from "../subCategories/subCategory.model";
import { ProductVisibilityModel } from "../productVisibility/productVisibility.model";
import { productSearchIndex } from "../products/productSearchIndex";
import { productSlug } from "../products/productSlug";
import { ProductEntity } from "../products/product.types";
import { CatalogQuery } from "./catalog.dto";

type PublicProduct = Omit<ProductEntity, "databaseId">;

const summaryProjection = {
  _id: 0, id: 1, sku: 1, name: 1, categoryIds: 1, subcategoryIds: 1,
  featured: 1, availability: 1, images: { $slice: 1 }
};

/** Only reads existing collections. No saves, upserts, seeds or index creation. */
export class WebsiteCatalogRepository {
  private async hiddenSkus(): Promise<string[]> {
    return ProductVisibilityModel.distinct("sku", { isVisible: false });
  }

  async categories() {
    const hidden = await this.hiddenSkus();
    const [categories, counts] = await Promise.all([
      CategoryModel.find({}, { _id: 0 }).sort({ sortOrder: 1, id: 1 }).lean(),
      ProductModel.aggregate<{ _id: string; count: number }>([
        { $match: { sku: { $nin: hidden } } },
        { $unwind: "$categoryIds" },
        { $group: { _id: "$categoryIds", count: { $sum: 1 } } }
      ])
    ]);
    const byId = new Map(counts.map(item => [item._id, item.count]));
    return categories.map(category => ({ ...category, productCount: byId.get(category.id) ?? 0 }));
  }

  async subcategories(category?: string) {
    const hidden = await this.hiddenSkus();
    const [subcategories, counts] = await Promise.all([
      SubCategoryModel.find(category ? { categoryId: category } : {}, { _id: 0 })
        .sort({ sortOrder: 1, id: 1 }).lean(),
      ProductModel.aggregate<{ _id: string; count: number }>([
        { $match: { sku: { $nin: hidden }, ...(category ? { categoryIds: category } : {}) } },
        { $unwind: "$subcategoryIds" },
        { $group: { _id: "$subcategoryIds", count: { $sum: 1 } } }
      ])
    ]);
    const byId = new Map(counts.map(item => [item._id, item.count]));
    return subcategories.map(subcategory => ({ ...subcategory, productCount: byId.get(subcategory.id) ?? 0 }));
  }

  async products(query: CatalogQuery) {
    const hidden = await this.hiddenSkus();
    const filter: Record<string, unknown> = {
      sku: { $nin: hidden },
      ...(query.category ? { categoryIds: query.category } : {}),
      ...(query.subcategory ? { subcategoryIds: query.subcategory } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {})
    };
    let rankedIds: string[] | undefined;
    if (query.search) {
      const matches = await productSearchIndex.search(query.search, query.category);
      rankedIds = matches
        .filter(({ product }) => !query.subcategory || product.subcategoryIds.includes(query.subcategory))
        .map(({ product }) => product.id);
      filter.id = { $in: rankedIds };
    }
    const projection = query.view === "detail" ? { _id: 0 } : summaryProjection;
    const total = await ProductModel.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;
    let documents;
    if (rankedIds && query.sort === "relevance") {
      // Apply visibility/featured filtering before pagination to keep totals and pages consistent.
      const eligible = await ProductModel.find(filter, { _id: 0, id: 1 }).lean();
      const eligibleIds = new Set(eligible.map(item => item.id));
      const pageIds = rankedIds.filter(id => eligibleIds.has(id)).slice(skip, skip + query.limit);
      const page = await ProductModel.find({ id: { $in: pageIds } }, projection).lean();
      const byId = new Map(page.map(item => [item.id, item]));
      documents = pageIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
    } else {
      const sort: Record<string, 1 | -1> = query.sort === "name-desc" ? { name: -1, id: 1 }
        : query.sort === "sku" ? { sku: 1, id: 1 }
        : query.sort === "name-asc" ? { name: 1, id: 1 }
        : { featured: -1, name: 1, id: 1 };
      // Sort only identifiers and small fields. Full variant/image documents exceed
      // MongoDB's in-memory sort budget when requesting the final catalog pages.
      const page = await ProductModel.aggregate<{ id: string }>([
        { $match: filter },
        { $project: { _id: 0, id: 1, name: 1, sku: 1, featured: 1 } },
        { $sort: sort }, { $skip: skip }, { $limit: query.limit }
      ]);
      const pageIds = page.map(item => item.id);
      const results = await ProductModel.find({ id: { $in: pageIds } }, projection).lean();
      const byId = new Map(results.map(item => [item.id, item]));
      documents = pageIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
    }
    const totalPages = Math.ceil(total / query.limit);
    return {
      items: documents.map(document => {
        const slug = productSlug(document.name, document.sku);
        if (query.view === "detail") return { ...document, slug };
        const { images, ...product } = document;
        return { ...product, slug, image: images?.[0] ?? null };
      }),
      pagination: { page: query.page, limit: query.limit, total, totalPages, hasNextPage: query.page < totalPages }
    };
  }

  async product(id: string): Promise<(PublicProduct & { slug: string }) | null> {
    const hidden = await this.hiddenSkus();
    const document = await ProductModel.findOne({ id, sku: { $nin: hidden } }, { _id: 0 }).lean();
    return document ? { ...document, slug: productSlug(document.name, document.sku) } : null;
  }

  async productBySlug(slug: string) {
    const match = await productSearchIndex.findBySlug(slug);
    return match ? this.product(match.id) : null;
  }
}
