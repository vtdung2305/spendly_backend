import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, userId: string, dto: UpdateTransactionDto) {
    const transaction = await this.repo.findByIdForUser(id, userId);
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId, deletedAt: null } });
      if (!category) throw new NotFoundException('Category not found');
    }

    return this.repo.update(id, {
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      ...(dto.occurredAt ? { occurredAt: new Date(dto.occurredAt) } : {}),
    });
  }
}
