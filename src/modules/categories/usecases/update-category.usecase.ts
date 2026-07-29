import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { CategoriesRepository } from '../repositories/categories.repository';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: string, userId: string, dto: UpdateCategoryDto) {
    const category = await this.repo.findByIdForUser(id, userId);
    if (!category) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== category.name) {
      const existing = await this.repo.findByNameAndType(userId, dto.name, category.type);
      if (existing) {
        throw new AppException('CATEGORY_NAME_EXISTS', 'Tên danh mục này đã tồn tại', HttpStatus.CONFLICT);
      }
    }

    return this.repo.update(id, dto);
  }
}
