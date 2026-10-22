import assert from "node:assert/strict";
import { once } from "node:events";
import { AddressInfo } from "node:net";
import { test, TestContext } from "node:test";
import express, { Express } from "express";
import { createApp } from "../../app/createApp";
import { env } from "../../config/env";
import { errorHandler } from "../../middlewares/errorHandler";
import { FirebaseAuthProvider } from "../../providers/auth/firebaseAuthProvider";
import { CategoryModel } from "../categories/category.model";
import { ProductModel } from "../products/product.model";
import { ProductRepository } from "../products/product.repository";
import { adminProductListQuerySchema, createProductSchema, updateProductSchema } from "../products/product.dto";
import { productSearchIndex } from "../products/productSearchIndex";
import { ProductVisibilityModel } from "../productVisibility/productVisibility.model";
import { SubCategoryModel } from "../subCategories/subCategory.model";
import { UserModel } from "../users/user.model";
import { catalogQuerySchema, CatalogQuery } from "./catalog.dto";
import { WebsiteCatalogRepository } from "./catalog.repository";
import { createWebsiteCatalogRoutes } from "./catalog.routes";

const product = {
  id: "prod_tmps_94", sku: "TMPS 94", name: "Termo Dijon", isHot: true,
  featured: false, categoryIds: ["cat_bebidas"], subcategoryIds: [],
  availability: { status: "available", text: "Disponible" }, images: []
};

const listen = async (app: Express, context: TestContext): Promise<string> => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise<void>((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  }));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
};

test("hot feed is public, preserves pagination and cannot be changed to a non-hot feed", async (context) => {
  const queries: CatalogQuery[] = [];
  const repository = {
    products: async (query: CatalogQuery) => {
      queries.push(query);
      return { items: [product], pagination: { page: query.page, limit: query.limit, total: 29, totalPages: 3, hasNextPage: true } };
    },
    product: async () => { throw new Error("Hot route was interpreted as a product ID"); }
  } as unknown as WebsiteCatalogRepository;
  const app = express();
  app.use("/api/v2", createWebsiteCatalogRoutes(repository));
  app.use(errorHandler);
  const base = await listen(app, context);
  const response = await fetch(`${base}/api/v2/products/hot?page=2&limit=12&sort=sku&isHot=false`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json() as { success: boolean; data: { items: typeof product[]; pagination: { page: number } } };
  assert.equal(body.success, true);
  assert.equal(body.data.pagination.page, 2);
  assert.equal(body.data.items[0].isHot, true);
  assert.equal(queries[0].isHot, true);
  assert.equal(queries[0].limit, 12);
  assert.equal(queries[0].sort, "sku");

  for (const query of ["limit=97", "page=0", "isHot=yes"]) {
    const invalid = await fetch(`${base}/api/v2/products/hot?${query}`);
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json() as { error: { code: string } }).error.code, "VALIDATION_ERROR");
  }
  assert.equal(queries.length, 1);
});

test("hot filters validate true/false without turning the string false into true", () => {
  assert.equal(catalogQuerySchema.parse({ isHot: "false" }).isHot, false);
  assert.equal(catalogQuerySchema.parse({ isHot: "true" }).isHot, true);
  assert.equal(catalogQuerySchema.parse({}).isHot, undefined);
  assert.equal(adminProductListQuerySchema.parse({ isHot: "false" }).isHot, false);
  assert.equal(catalogQuerySchema.safeParse({ isHot: "1" }).success, false);
});

test("editing only isHot does not inject defaults that clear categories or featured", () => {
  for (const isHot of [true, false]) {
    const parsed = updateProductSchema.parse({ body: { isHot }, params: { id: product.id }, query: {} });
    assert.deepEqual(parsed.body, { isHot });
  }
  assert.deepEqual(updateProductSchema.parse({ body: { name: "Nuevo nombre" }, params: { id: product.id }, query: {} }).body, { name: "Nuevo nombre" });
  assert.equal(updateProductSchema.safeParse({ body: { isHot: "true" }, params: { id: product.id }, query: {} }).success, false);

  const created = createProductSchema.parse({
    body: {
      id: "new-product", sku: "NEW 01", name: "Nuevo producto", url: "https://example.com/product",
      magentoProductId: "1", productType: "simple", description: "Descripción",
      availability: product.availability, images: [{ originalUrl: "https://example.com/image.jpg" }],
      variants: [], specifications: [], additionalAttributes: [], meta: {}, sources: [],
      source: { portal: "test", url: "https://example.com/product", extractedAt: "2026-10-22" }
    }, params: {}, query: {}
  });
  assert.equal(created.body.isHot, false);
  assert.equal(created.body.featured, false);
  assert.deepEqual(created.body.categoryIds, []);
});

test("hot selection and visibility are applied before search pagination", async (context) => {
  context.mock.method(ProductVisibilityModel, "distinct", async () => ["HIDDEN"]);
  context.mock.method(productSearchIndex, "search", async () => [
    { product: { id: "hidden", subcategoryIds: [] } },
    { product: { id: "ordinary", subcategoryIds: [] } },
    { product: { id: "first-hot", subcategoryIds: [] } },
    { product: { id: product.id, subcategoryIds: [] } }
  ]);
  context.mock.method(ProductModel, "countDocuments", async (filter: Record<string, unknown>) => {
    assert.equal(filter.isHot, true);
    assert.deepEqual(filter.sku, { $nin: ["HIDDEN"] });
    return 2;
  });
  let reads = 0;
  context.mock.method(ProductModel, "find", (filter: Record<string, unknown>, projection: Record<string, unknown>) => ({
    lean: async () => {
      reads += 1;
      if (projection.id === 1 && Object.keys(projection).length === 2) {
        assert.equal(filter.isHot, true);
        assert.deepEqual(filter.sku, { $nin: ["HIDDEN"] });
        return [{ id: "first-hot" }, { id: product.id }];
      }
      assert.deepEqual(filter.id, { $in: [product.id] });
      return [product];
    }
  }));
  const result = await new WebsiteCatalogRepository().products(catalogQuerySchema.parse({ search: "termo", isHot: true, page: 2, limit: 1 }));
  assert.equal(reads, 2);
  assert.equal(result.pagination.total, 2);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, product.id);
});

test("legacy products without the flag are returned as non-hot in every v2 view", async (context) => {
  const { isHot: _isHot, ...legacyProduct } = product;
  context.mock.method(ProductVisibilityModel, "distinct", async () => []);
  context.mock.method(ProductModel, "countDocuments", async (filter: Record<string, unknown>) => {
    assert.deepEqual(filter.isHot, { $ne: true });
    return 1;
  });
  context.mock.method(ProductModel, "aggregate", async () => [{ id: product.id }]);
  context.mock.method(ProductModel, "find", () => ({ lean: async () => [legacyProduct] }));
  context.mock.method(ProductModel, "findOne", () => ({ lean: async () => legacyProduct }));
  const repository = new WebsiteCatalogRepository();
  for (const view of ["summary", "detail"]) {
    const result = await repository.products(catalogQuerySchema.parse({ isHot: false, view }));
    assert.equal(result.items[0].isHot, false);
  }
  assert.equal((await repository.product(product.id))?.isHot, false);
});

test("the admin list can filter non-hot products including missing flags", async (context) => {
  context.mock.method(CategoryModel, "find", () => ({ lean: async () => [] }));
  context.mock.method(SubCategoryModel, "find", () => ({ lean: async () => [] }));
  context.mock.method(ProductModel, "aggregate", (pipeline: Array<Record<string, unknown>>) => {
    assert.deepEqual(pipeline[0].$match, { isHot: { $ne: true } });
    const projection = pipeline.find((stage) => stage.$project)?.$project as Record<string, unknown>;
    assert.ok(projection.isHot);
    return { allowDiskUse: async () => [{ items: [{ ...product, isHot: false, isVisible: true }], total: [{ value: 1 }] }] };
  });
  const result = await new ProductRepository().findAdminCatalog(adminProductListQuerySchema.parse({ isHot: false }));
  assert.equal(result.items[0].isHot, false);
});

test("only admins can toggle hot over HTTP and unrelated fields stay omitted", async (context) => {
  const previousBypass = env.authBypass;
  env.authBypass = false;
  context.after(() => { env.authBypass = previousBypass; });
  context.mock.method(FirebaseAuthProvider.prototype, "verifyIdToken", async (token: string) => ({ uid: token }));
  context.mock.method(UserModel, "findOne", ({ uid }: { uid: string }) => ({ lean: async () => ({
    _id: "000000000000000000000001", uid, role: uid === "admin-token" ? "admin" : "sales", isActive: true
  }) }));
  const writes: unknown[] = [];
  context.mock.method(ProductRepository.prototype, "updateById", async (_id: string, payload: Record<string, unknown>) => {
    writes.push(payload);
    return { ...product, ...payload };
  });
  const base = await listen(createApp(), context);
  const patch = (payload: unknown, token?: string) => fetch(`${base}/api/v1/products/${product.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload)
  });
  for (const [token, expectedStatus] of [[undefined, 401], ["sales-token", 403]] as const) {
    const rejected = await patch({ isHot: true }, token);
    assert.equal(rejected.status, expectedStatus);
    await rejected.json();
  }
  assert.equal(writes.length, 0);
  for (const isHot of [true, false]) {
    const response = await patch({ isHot }, "admin-token");
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { data: { isHot: boolean } }).data.isHot, isHot);
  }
  assert.deepEqual(writes, [{ isHot: true }, { isHot: false }]);
  const invalid = await patch({ isHot: "true" }, "admin-token");
  assert.equal(invalid.status, 400);
  await invalid.json();
  assert.equal(writes.length, 2);
});
