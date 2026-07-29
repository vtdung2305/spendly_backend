import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../repositories/categories.repository';
import { QueryCategoryDto } from '../dto/query-category.dto';

@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  execute(userId: string, query: QueryCategoryDto) {
    return this.repo.findMany(userId, query.type);
  }
}
