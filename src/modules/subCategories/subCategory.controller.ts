import { BaseController } from "../../shared/controllers/BaseController";
import { SubCategoryService } from "./subCategory.service";

export class SubCategoryController extends BaseController {
  constructor(private readonly subCategoryService: SubCategoryService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const subCategories = await this.subCategoryService.listSubCategories();
    this.ok(res, subCategories);
  });

  getById = this.execute(async (req, res) => {
    const subCategory = await this.subCategoryService.getSubCategoryById(String(req.params.id));
    this.ok(res, subCategory);
  });

  create = this.execute(async (req, res) => {
    const subCategory = await this.subCategoryService.createSubCategory(req.body);
    this.ok(res, subCategory, 201);
  });

  update = this.execute(async (req, res) => {
    const subCategory = await this.subCategoryService.updateSubCategory(String(req.params.id), req.body);
    this.ok(res, subCategory);
  });

  delete = this.execute(async (req, res) => {
    await this.subCategoryService.deleteSubCategory(String(req.params.id));
    res.status(204).send();
  });
}
