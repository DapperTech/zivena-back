import { NotFoundAppError } from "../../shared/errors/AppError";
import {
  CreateProductDto,
  AdminProductListQuery,
  ProductListQuery,
  ProductSuggestionsQuery,
  UpdateProductDto
} from "./product.dto";
import { ProductRepository } from "./product.repository";
import {
  AdminCatalogPage,
  CatalogPage,
  ProductDetail,
  ProductEntity,
  ProductSuggestion
} from "./product.types";

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async listProducts(query: ProductListQuery): Promise<CatalogPage> {
    return this.productRepository.findCatalog(query);
  }

  async listAdminProducts(query: AdminProductListQuery): Promise<AdminCatalogPage> {
    return this.productRepository.findAdminCatalog(query);
  }

  async suggestProducts(query: ProductSuggestionsQuery): Promise<ProductSuggestion[]> {
    return this.productRepository.findSuggestions(query);
  }

  async getProductById(id: string): Promise<ProductDetail> {
    const product = await this.productRepository.findDetailById(id);
    if (!product) {
      throw new NotFoundAppError("Product not found");
    }
    return product;
  }

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const product = await this.productRepository.findDetailBySlug(slug);
    if (!product) {
      throw new NotFoundAppError("Product not found");
    }
    return product;
  }

  async getAdminProductById(id: string): Promise<ProductEntity> {
    const product = await this.productRepository.findEntityById(id);
    if (!product) throw new NotFoundAppError("Product not found");
    return product;
  }

  async createProduct(payload: CreateProductDto): Promise<ProductEntity> {
    return this.productRepository.create(payload);
  }

  async updateProduct(id: string, payload: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.productRepository.updateById(id, payload);
    if (!product) {
      throw new NotFoundAppError("Product not found");
    }
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const deleted = await this.productRepository.deleteById(id);
    if (!deleted) throw new NotFoundAppError("Product not found");
  }
}
