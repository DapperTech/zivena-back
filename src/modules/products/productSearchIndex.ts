import Fuse from "fuse.js";
import { CategoryModel } from "../categories/category.model";
import { SubCategoryModel } from "../subCategories/subCategory.model";
import { ProductModel } from "./product.model";
import { productSlug } from "./productSlug";
import { ProductImage } from "./product.types";

type SearchSourceProduct = {
  id: string;
  sku: string;
  name: string;
  categoryIds: string[];
  subcategoryIds: string[];
  description: string;
  additionalAttributes: Array<{ value: string }>;
  images: ProductImage[];
};

export type SearchIndexProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  categoryIds: string[];
  subcategoryIds: string[];
  categoryTitles: string[];
  subcategoryTitles: string[];
  image?: ProductImage;
  normalizedSku: string;
  normalizedName: string;
  normalizedCategories: string[];
  normalizedSubcategories: string[];
  normalizedDescription: string;
  normalizedAttributes: string;
};

export type ProductSearchMatch = {
  product: SearchIndexProduct;
  score: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const compact = (value: string): string => normalizeText(value).replace(/\s/g, "");

const titlesFor = (ids: string[], names: Map<string, string>): string[] =>
  ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name));

const compareText = (left: string, right: string): number =>
  left.localeCompare(right, "es", { sensitivity: "base", numeric: true });

class ProductSearchIndex {
  private fuse: Fuse<SearchIndexProduct> | null = null;
  private records: SearchIndexProduct[] = [];
  private loading: Promise<void> | null = null;
  private loadedAt = 0;

  async search(query: string, categoryId?: string): Promise<ProductSearchMatch[]> {
    await this.ensureLoaded();
    if (!this.fuse) return [];

    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    const querySku = normalizedQuery.replace(/\s/g, "");
    const terms = [...new Set(normalizedQuery.split(" ").filter((term) => term.length > 1))];

    if (terms.length === 0) {
      return this.fuse
        .getIndex()
        .docs.filter(
          (product) =>
            (!categoryId || product.categoryIds.includes(categoryId)) &&
            (product.normalizedSku.startsWith(querySku) ||
              product.normalizedName.startsWith(normalizedQuery))
        )
        .map((product) => ({ product, score: 0.5 }))
        .sort((left, right) => compareText(left.product.name, right.product.name));
    }

    const candidates = new Map<
      string,
      { product: SearchIndexProduct; matches: number; score: number }
    >();

    for (const term of terms) {
      for (const result of this.fuse.search(term)) {
        const candidate = candidates.get(result.item.id) ?? {
          product: result.item,
          matches: 0,
          score: 0
        };
        candidate.matches += 1;
        candidate.score += result.score ?? 1;
        candidates.set(result.item.id, candidate);
      }
    }

    const phraseScores = new Map(
      this.fuse.search(normalizedQuery).map((result) => [result.item.id, result.score ?? 1])
    );

    return [...candidates.values()]
      .filter(
        ({ product, matches }) =>
          matches === terms.length && (!categoryId || product.categoryIds.includes(categoryId))
      )
      .map(({ product, score }): ProductSearchMatch => {
        const averageTermScore = score / terms.length;
        const phraseScore = phraseScores.get(product.id);
        let rankedScore = phraseScore === undefined ? averageTermScore : Math.min(averageTermScore, phraseScore);

        if (product.normalizedSku === querySku) rankedScore -= 1;
        else if (product.normalizedName === normalizedQuery) rankedScore -= 0.8;
        else if (product.normalizedSku.startsWith(querySku)) rankedScore -= 0.45;
        else if (product.normalizedName.startsWith(normalizedQuery)) rankedScore -= 0.3;

        return { product, score: rankedScore };
      })
      .sort(
        (left, right) =>
          left.score - right.score || compareText(left.product.name, right.product.name)
      );
  }

  async findBySlug(slug: string): Promise<SearchIndexProduct | undefined> {
    await this.ensureLoaded();
    return this.records.find((product) => product.slug === slug);
  }

  invalidate(): void {
    this.fuse = null;
    this.records = [];
    this.loading = null;
    this.loadedAt = 0;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.fuse && Date.now() - this.loadedAt < CACHE_TTL_MS) return;
    if (this.loading) return this.loading;

    this.loading = this.load();
    try {
      await this.loading;
    } finally {
      this.loading = null;
    }
  }

  private async load(): Promise<void> {
    const [products, categories, subcategories] = await Promise.all([
      ProductModel.find(
        {},
        {
          _id: 0,
          id: 1,
          sku: 1,
          name: 1,
          categoryIds: 1,
          subcategoryIds: 1,
          description: 1,
          additionalAttributes: 1,
          images: { $slice: 1 }
        }
      ).lean(),
      CategoryModel.find({}, { _id: 0, id: 1, name: 1 }).lean(),
      SubCategoryModel.find({}, { _id: 0, id: 1, name: 1 }).lean()
    ]);

    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const subcategoryNames = new Map(
      subcategories.map((subcategory) => [subcategory.id, subcategory.name])
    );

    const records = (products as unknown as SearchSourceProduct[]).map(
      (product): SearchIndexProduct => {
        const categoryTitles = titlesFor(product.categoryIds, categoryNames);
        const subcategoryTitles = titlesFor(product.subcategoryIds, subcategoryNames);

        return {
          id: product.id,
          slug: productSlug(product.name, product.sku),
          sku: product.sku,
          name: product.name,
          categoryIds: product.categoryIds,
          subcategoryIds: product.subcategoryIds,
          categoryTitles,
          subcategoryTitles,
          image: product.images[0],
          normalizedSku: compact(product.sku),
          normalizedName: normalizeText(product.name),
          normalizedCategories: categoryTitles.map(normalizeText),
          normalizedSubcategories: subcategoryTitles.map(normalizeText),
          normalizedDescription: normalizeText(product.description),
          normalizedAttributes: normalizeText(
            product.additionalAttributes.map((attribute) => attribute.value).join(" ")
          )
        };
      }
    );

    this.records = records;
    this.fuse = new Fuse(records, {
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      threshold: 0.34,
      keys: [
        { name: "normalizedSku", weight: 0.4 },
        { name: "normalizedName", weight: 0.34 },
        { name: "normalizedCategories", weight: 0.1 },
        { name: "normalizedSubcategories", weight: 0.07 },
        { name: "normalizedAttributes", weight: 0.05 },
        { name: "normalizedDescription", weight: 0.04 }
      ]
    });
    this.loadedAt = Date.now();
  }
}

export const productSearchIndex = new ProductSearchIndex();
