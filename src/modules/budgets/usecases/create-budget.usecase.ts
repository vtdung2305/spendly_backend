import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { PrismaService } from '../../../prisma/prisma.service';
import { BudgetsRepository } from '../repositories/budgets.repository';
import { CreateBudgetDto } from '../dto/create-budget.dto';

@Injectable()
export class CreateBudgetUseCase {
  constructor(
    private readonly repo: BudgetsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, type: 'EXPENSE', deletedAt: null },
    });
    if (!category) throw new NotFoundException('Category not found');

    const existing = await this.repo.findByCategoryAndMonth(userId, dto.categoryId, dto.month);
    if (existing) {
      throw new AppException('BUDGET_ALREADY_EXISTS', 'Danh mục này đã có ngân sách cho tháng này', HttpStatus.CONFLICT);
    }

    return this.repo.create(userId, dto.categoryId, dto.month, dto.limitAmount);
  }
}
