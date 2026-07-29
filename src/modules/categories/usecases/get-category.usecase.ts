import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from '../repositories/categories.repository';

@Injectable()
export class GetCategoryUseCase {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: string, userId: string) {
    const category = await this.repo.findByIdForUser(id, userId);
    if (!category) throw new NotFoundException('Category not found');
    const transactionCountThisMonth = await this.repo.countTransactionsThisMonth(id);
    return { ...category, transactionCountThisMonth };
  }
}
