import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { CategoriesRepository } from '../repositories/categories.repository';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const category = await this.repo.findByIdForUser(id, userId);
    if (!category) throw new NotFoundException('Category not found');

    if (category.isDefault) {
      throw new AppException('DEFAULT_CATEGORY_CANNOT_BE_DELETED', 'Không thể xóa danh mục "Khác"', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const fallback = await this.repo.findDefaultForUser(userId, category.type);
    if (!fallback) {
      throw new AppException('DEFAULT_CATEGORY_MISSING', 'Không tìm thấy danh mục dự phòng "Khác"', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    await this.repo.deleteAndReassign(category, fallback.id);
  }
}
