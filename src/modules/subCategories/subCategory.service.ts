import { NotFoundAppError } from "../../shared/errors/AppError";
import { ConflictAppError } from "../../shared/errors/AppError";
import { CreateSubCategoryDto, UpdateSubCategoryDto } from "./subCategory.dto";
import { SubCategoryRepository } from "./subCategory.repository";
import { SubCategoryEntity } from "./subCategory.types";

export class SubCategoryService {
  constructor(private readonly subCategoryRepository: SubCategoryRepository) {}

  async listSubCategories(): Promise<SubCategoryEntity[]> {
    return this.subCategoryRepository.findAll();
  }

  async getSubCategoryById(id: string): Promise<SubCategoryEntity> {
    const subCategory = await this.subCategoryRepository.findById(id);
    if (!subCategory) {
      throw new NotFoundAppError("SubCategory not found");
    }

    return subCategory;
  }

  async createSubCategory(payload: CreateSubCategoryDto): Promise<SubCategoryEntity> {
    return this.subCategoryRepository.create(payload);
  }

  async updateSubCategory(id: string, payload: UpdateSubCategoryDto): Promise<SubCategoryEntity> {
    const subCategory = await this.subCategoryRepository.updateById(id, payload);
    if (!subCategory) {
      throw new NotFoundAppError("SubCategory not found");
    }

    return subCategory;
  }

  async deleteSubCategory(id: string): Promise<void> {
    const productCount = await this.subCategoryRepository.countProducts(id);
    if (productCount > 0) {
      throw new ConflictAppError("Subcategory has associated products", { productCount });
    }

    const deleted = await this.subCategoryRepository.deleteById(id);
    if (!deleted) throw new NotFoundAppError("SubCategory not found");
  }
}
