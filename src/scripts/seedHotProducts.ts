import { disconnect } from "mongoose";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { ProductModel } from "../modules/products/product.model";
import { initialHotProductSkus } from "./data/initialHotProductSkus";

const seed = async (): Promise<void> => {
  if (!env.mongoUri) throw new Error("MONGO_URI is required");
  await connectDatabase();

  const filter = { sku: { $in: [...initialHotProductSkus] } };
  const products = await ProductModel.find(filter, { _id: 0, sku: 1, isHot: 1 }).lean();
  const missing = initialHotProductSkus.filter((sku) => !products.some((product) => product.sku === sku));
  const uniqueSkus = new Set(products.map((product) => product.sku));
  if (missing.length || uniqueSkus.size !== products.length || products.length !== initialHotProductSkus.length) {
    throw new Error(`Expected exactly 29 distinct products; found ${products.length}. Missing: ${missing.join(", ")}`);
  }

  console.info(JSON.stringify({
    database: env.mongoDbName,
    selected: products.length,
    alreadyHot: products.filter((product) => product.isHot === true).length,
    mode: process.argv.includes("--apply") ? "apply" : "dry-run"
  }));

  if (!process.argv.includes("--apply")) return;

  const result = await ProductModel.updateMany(filter, { $set: { isHot: true } }, {
    upsert: false,
    runValidators: true
  });
  const verified = await ProductModel.countDocuments({ ...filter, isHot: true });
  console.info(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount, verified }));
  if (result.matchedCount !== initialHotProductSkus.length || verified !== initialHotProductSkus.length) {
    throw new Error("Hot product verification failed");
  }
};

seed()
  .catch((error: unknown) => {
    // Avoid logging connection strings or credentials from driver errors.
    console.error("[hot-products]", error instanceof Error ? error.name : "Unknown error");
    if (error instanceof Error && error.name === "Error") console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => { await disconnect(); });
