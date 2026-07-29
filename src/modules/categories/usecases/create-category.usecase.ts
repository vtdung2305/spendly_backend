import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { CategoriesRepository } from '../repositories/categories.repository';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(userId: string, dto: CreateCategoryDto) {
    const existing = await this.repo.findByNameAndType(userId, dto.name, dto.type);
    if (existing) {
      throw new AppException('CATEGORY_NAME_EXISTS', 'Tên danh mục này đã tồn tại', HttpStatus.CONFLICT);
    }
    return this.repo.create(userId, dto);
  }
}
