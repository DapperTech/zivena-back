import { BaseController } from "../../shared/controllers/BaseController";
import { CategoryService } from "./category.service";

export class CategoryController extends BaseController {
  constructor(private readonly categoryService: CategoryService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const categories = await this.categoryService.listCategories();
    this.ok(res, categories);
  });

  getById = this.execute(async (req, res) => {
    const category = await this.categoryService.getCategoryById(String(req.params.id));
    this.ok(res, category);
  });

  create = this.execute(async (req, res) => {
    const category = await this.categoryService.createCategory(req.body);
    this.ok(res, category, 201);
  });

  update = this.execute(async (req, res) => {
    const category = await this.categoryService.updateCategory(String(req.params.id), req.body);
    this.ok(res, category);
  });

  delete = this.execute(async (req, res) => {
    await this.categoryService.deleteCategory(String(req.params.id));
    res.status(204).send();
  });
}
