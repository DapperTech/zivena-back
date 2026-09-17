import { BaseController } from "../../shared/controllers/BaseController";
import {
  adminProductListQuerySchema,
  productListQuerySchema,
  productSuggestionsQuerySchema
} from "./product.dto";
import { ProductService } from "./product.service";

export class ProductController extends BaseController {
  constructor(private readonly productService: ProductService) {
    super();
  }

  list = this.execute(async (req, res) => {
    const query = productListQuerySchema.parse(req.query);
    const products = await this.productService.listProducts(query);
    this.ok(res, products);
  });

  adminList = this.execute(async (req, res) => {
    const query = adminProductListQuerySchema.parse(req.query);
    const products = await this.productService.listAdminProducts(query);
    this.ok(res, products);
  });

  suggestions = this.execute(async (req, res) => {
    const query = productSuggestionsQuerySchema.parse(req.query);
    const products = await this.productService.suggestProducts(query);
    this.ok(res, products);
  });

  getById = this.execute(async (req, res) => {
    const product = await this.productService.getProductById(String(req.params.id));
    this.ok(res, product);
  });

  getBySlug = this.execute(async (req, res) => {
    const product = await this.productService.getProductBySlug(String(req.params.slug));
    this.ok(res, product);
  });

  getAdminById = this.execute(async (req, res) => {
    const product = await this.productService.getAdminProductById(String(req.params.id));
    this.ok(res, product);
  });

  create = this.execute(async (req, res) => {
    const product = await this.productService.createProduct(req.body);
    this.ok(res, product, 201);
  });

  update = this.execute(async (req, res) => {
    const product = await this.productService.updateProduct(String(req.params.id), req.body);
    this.ok(res, product);
  });

  delete = this.execute(async (req, res) => {
    await this.productService.deleteProduct(String(req.params.id));
    res.status(204).send();
  });
}
