import { NotFoundAppError } from "../../shared/errors/AppError";
import { ConflictAppError } from "../../shared/errors/AppError";
import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";
import { CategoryRepository } from "./category.repository";
import { CatalogCategory, CategoryEntity } from "./category.types";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listCategories(): Promise<CatalogCategory[]> {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundAppError("Category not found");
    }

    return category;
  }

  async createCategory(payload: CreateCategoryDto): Promise<CategoryEntity> {
    return this.categoryRepository.create(payload);
  }

  async updateCategory(id: string, payload: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.categoryRepository.updateById(id, payload);
    if (!category) {
      throw new NotFoundAppError("Category not found");
    }

    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const productCount = await this.categoryRepository.countProducts(id);
    if (productCount > 0) {
      throw new ConflictAppError("Category has associated products", { productCount });
    }

    const deleted = await this.categoryRepository.deleteById(id);
    if (!deleted) throw new NotFoundAppError("Category not found");
  }
}
