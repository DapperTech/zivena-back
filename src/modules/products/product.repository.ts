import { PipelineStage } from "mongoose";
import { CategoryModel } from "../categories/category.model";
import { ProductVisibilityModel } from "../productVisibility/productVisibility.model";
import { ProductVisibilityRepository } from "../productVisibility/productVisibility.repository";
import { SubCategoryModel } from "../subCategories/subCategory.model";
import {
  AdminProductListQuery,
  CreateProductDto,
  ProductListQuery,
  ProductSuggestionsQuery,
  UpdateProductDto
} from "./product.dto";
import { ProductModel } from "./product.model";
import { productSearchIndex } from "./productSearchIndex";
import { productSlug } from "./productSlug";
import {
  AdminCatalogPage,
  AdminCatalogProduct,
  CatalogPage,
  CatalogProduct,
  ProductAvailability,
  ProductDetail,
  ProductEntity,
  ProductImage,
  ProductSuggestion
} from "./product.types";

type TaxonomyMaps = {
  categories: Map<string, string>;
  subcategories: Map<string, string>;
};

type CatalogAggregationResult = {
  items: Array<
    Omit<CatalogProduct, "slug" | "categoryTitles" | "subcategoryTitles"> & {
      subcategoryIds: string[];
    }
  >;
  total: Array<{ value: number }>;
};

type AdminCatalogAggregationResult = {
  items: Array<AdminCatalogProduct>;
  total: Array<{ value: number }>;
};

type CatalogDocument = {
  id: string;
  sku: string;
  name: string;
  categoryIds: string[];
  subcategoryIds: string[];
  featured: boolean;
  availability: ProductAvailability;
  images: ProductImage[];
};

const mapEntity = (document: Record<string, unknown>): ProductEntity => {
  const { _id, ...product } = document;
  return {
    databaseId: String(_id),
    ...(product as Omit<ProductEntity, "databaseId">)
  };
};

const titlesFor = (ids: string[], names: Map<string, string>): string[] =>
  ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name));

const compareText = (left: string, right: string): number =>
  left.localeCompare(right, "es", { sensitivity: "base", numeric: true });

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class ProductRepository {
  private readonly visibilityRepository = new ProductVisibilityRepository();

  private async taxonomy(): Promise<TaxonomyMaps> {
    const [categories, subcategories] = await Promise.all([
      CategoryModel.find({}, { _id: 0, id: 1, name: 1 }).lean(),
      SubCategoryModel.find({}, { _id: 0, id: 1, name: 1 }).lean()
    ]);

    return {
      categories: new Map(categories.map((category) => [category.id, category.name])),
      subcategories: new Map(subcategories.map((subcategory) => [subcategory.id, subcategory.name]))
    };
  }

  async findCatalog(query: ProductListQuery): Promise<CatalogPage> {
    if (query.search) return this.findSearchCatalog(query);

    const filter: Record<string, unknown> = {};
    if (query.category) filter.categoryIds = query.category;
    if (query.exclude) filter.id = { $ne: query.exclude };

    const skip = (query.page - 1) * query.limit;
    const sort: Record<string, 1 | -1> =
      query.sort === "name-desc"
        ? { name: -1 }
        : query.sort === "sku"
          ? { sku: 1 }
          : query.sort === "relevance"
            ? { featured: -1, name: 1 }
            : { name: 1 };

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: "productVisibility",
          localField: "sku",
          foreignField: "sku",
          as: "visibility"
        }
      },
      {
        $set: {
          isVisible: {
            $ifNull: [{ $arrayElemAt: ["$visibility.isVisible", 0] }, true]
          }
        }
      },
      { $match: { isVisible: true } },
      {
        $project: {
          _id: 0,
          id: 1,
          sku: 1,
          name: 1,
          categoryIds: 1,
          subcategoryIds: 1,
          featured: 1,
          availability: 1,
          image: { $arrayElemAt: ["$images", 0] }
        }
      },
      {
        $facet: {
          items: [{ $sort: sort }, { $skip: skip }, { $limit: query.limit }],
          total: [{ $count: "value" }]
        }
      }
    ];

    const [results, taxonomy] = await Promise.all([
      ProductModel.aggregate<CatalogAggregationResult>(pipeline).allowDiskUse(true),
      this.taxonomy()
    ]);
    const result = results[0] ?? { items: [], total: [] };
    const total = result.total[0]?.value ?? 0;
    const totalPages = Math.ceil(total / query.limit);

    return {
      items: result.items.map(({ subcategoryIds, ...product }) => ({
        ...product,
        slug: productSlug(product.name, product.sku),
        categoryTitles: titlesFor(product.categoryIds, taxonomy.categories),
        subcategoryTitles: titlesFor(subcategoryIds, taxonomy.subcategories)
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages
      }
    };
  }

  async findSuggestions(query: ProductSuggestionsQuery): Promise<ProductSuggestion[]> {
    if (query.query.length < 2) return [];

    const [matches, hiddenSkus] = await Promise.all([
      productSearchIndex.search(query.query, query.category),
      this.visibilityRepository.findHiddenSkus()
    ]);
    return matches
      .filter(({ product }) => !hiddenSkus.has(product.sku.toUpperCase()))
      .slice(0, query.limit)
      .map(({ product }) => ({
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      image: product.image,
      categoryTitle: product.categoryTitles[0]
      }));
  }

  async findDetailById(id: string): Promise<ProductDetail | null> {
    const [document, taxonomy] = await Promise.all([
      ProductModel.findOne({ id }).lean(),
      this.taxonomy()
    ]);
    if (!document) return null;

    const isHidden = await ProductVisibilityModel.exists({
      sku: document.sku.trim().toUpperCase(),
      isVisible: false
    });
    if (isHidden) return null;

    const product = mapEntity(document as unknown as Record<string, unknown>);
    const { databaseId: _databaseId, ...publicProduct } = product;
    return {
      ...publicProduct,
      slug: productSlug(product.name, product.sku),
      categoryTitles: titlesFor(product.categoryIds, taxonomy.categories),
      subcategoryTitles: titlesFor(product.subcategoryIds, taxonomy.subcategories)
    };
  }

  async findDetailBySlug(slug: string): Promise<ProductDetail | null> {
    const match = await productSearchIndex.findBySlug(slug);
    return match ? this.findDetailById(match.id) : null;
  }

  async findEntityById(id: string): Promise<ProductEntity | null> {
    const document = await ProductModel.findOne({ id }).lean();
    return document ? mapEntity(document as unknown as Record<string, unknown>) : null;
  }

  async findAdminCatalog(query: AdminProductListQuery): Promise<AdminCatalogPage> {
    const filter: Record<string, unknown> = {};
    if (query.category) filter.categoryIds = query.category;
    if (query.search) {
      const search = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ name: search }, { sku: search }];
    }

    const skip = (query.page - 1) * query.limit;
    const sort: Record<string, 1 | -1> =
      query.sort === "name-desc" ? { name: -1 } : query.sort === "sku" ? { sku: 1 } : { name: 1 };
    const visibilityMatch =
      query.visibility === "visible"
        ? [{ $match: { isVisible: true } }]
        : query.visibility === "hidden"
          ? [{ $match: { isVisible: false } }]
          : [];

    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: "productVisibility",
          localField: "sku",
          foreignField: "sku",
          as: "visibility"
        }
      },
      {
        $set: {
          isVisible: {
            $ifNull: [{ $arrayElemAt: ["$visibility.isVisible", 0] }, true]
          }
        }
      },
      ...(visibilityMatch as PipelineStage[]),
      {
        $project: {
          _id: 0,
          id: 1,
          sku: 1,
          name: 1,
          categoryIds: 1,
          subcategoryIds: 1,
          featured: 1,
          availability: 1,
          image: { $arrayElemAt: ["$images", 0] },
          isVisible: 1
        }
      },
      {
        $facet: {
          items: [{ $sort: sort }, { $skip: skip }, { $limit: query.limit }],
          total: [{ $count: "value" }]
        }
      }
    ];

    const [results, taxonomy] = await Promise.all([
      ProductModel.aggregate<AdminCatalogAggregationResult>(pipeline).allowDiskUse(true),
      this.taxonomy()
    ]);
    const result = results[0] ?? { items: [], total: [] };
    const total = result.total[0]?.value ?? 0;
    const totalPages = Math.ceil(total / query.limit);

    return {
      items: result.items.map((product) => ({
        ...product,
        slug: productSlug(product.name, product.sku),
        categoryTitles: titlesFor(product.categoryIds, taxonomy.categories),
        subcategoryTitles: titlesFor(product.subcategoryIds, taxonomy.subcategories)
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages
      }
    };
  }

  async create(payload: CreateProductDto): Promise<ProductEntity> {
    const document = await ProductModel.create(payload);
    productSearchIndex.invalidate();
    return mapEntity(document.toObject() as unknown as Record<string, unknown>);
  }

  async updateById(id: string, payload: UpdateProductDto): Promise<ProductEntity | null> {
    const previous = payload.sku
      ? await ProductModel.findOne({ id }, { _id: 0, sku: 1 }).lean()
      : null;
    const document = await ProductModel.findOneAndUpdate({ id }, payload, {
      new: true,
      runValidators: true
    }).lean();
    if (document) {
      const previousSku = previous?.sku.trim().toUpperCase();
      const nextSku = document.sku.trim().toUpperCase();
      if (previousSku && previousSku !== nextSku) {
        const visibility = await ProductVisibilityModel.findOne({ sku: previousSku }).lean();
        if (visibility) {
          await ProductVisibilityModel.findOneAndUpdate(
            { sku: nextSku },
            {
              $set: {
                isVisible: visibility.isVisible,
                updatedByUid: visibility.updatedByUid
              }
            },
            { upsert: true, runValidators: true }
          );
          await ProductVisibilityModel.deleteOne({ sku: previousSku });
        }
      }
      productSearchIndex.invalidate();
    }
    return document ? mapEntity(document as unknown as Record<string, unknown>) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const document = await ProductModel.findOneAndDelete({ id }).lean();
    if (!document) return false;

    await this.visibilityRepository.deleteBySku(document.sku);
    productSearchIndex.invalidate();
    return true;
  }

  private async findSearchCatalog(query: ProductListQuery): Promise<CatalogPage> {
    const [matches, hiddenSkus] = await Promise.all([
      productSearchIndex.search(query.search, query.category),
      this.visibilityRepository.findHiddenSkus()
    ]);
    const sortedMatches = matches.filter(
      ({ product }) =>
        product.id !== query.exclude && !hiddenSkus.has(product.sku.toUpperCase())
    );

    if (query.sort === "name-asc") {
      sortedMatches.sort((left, right) => compareText(left.product.name, right.product.name));
    } else if (query.sort === "name-desc") {
      sortedMatches.sort((left, right) => compareText(right.product.name, left.product.name));
    } else if (query.sort === "sku") {
      sortedMatches.sort((left, right) => compareText(left.product.sku, right.product.sku));
    }

    const total = sortedMatches.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const pageMatches = sortedMatches.slice(start, start + query.limit);
    const ids = pageMatches.map(({ product }) => product.id);

    const documents = ids.length
      ? ((await ProductModel.find(
          { id: { $in: ids } },
          {
            _id: 0,
            id: 1,
            sku: 1,
            name: 1,
            categoryIds: 1,
            subcategoryIds: 1,
            featured: 1,
            availability: 1,
            images: { $slice: 1 }
          }
        ).lean()) as unknown as CatalogDocument[])
      : [];
    const documentsById = new Map(documents.map((document) => [document.id, document]));

    const items = pageMatches.flatMap(({ product }): CatalogProduct[] => {
      const document = documentsById.get(product.id);
      const image = document?.images[0] ?? product.image;
      if (!document || !image) return [];

      return [
        {
          id: document.id,
          slug: product.slug,
          sku: document.sku,
          name: document.name,
          categoryIds: document.categoryIds,
          featured: document.featured,
          availability: document.availability,
          image,
          categoryTitles: product.categoryTitles,
          subcategoryTitles: product.subcategoryTitles
        }
      ];
    });

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages
      }
    };
  }
}
