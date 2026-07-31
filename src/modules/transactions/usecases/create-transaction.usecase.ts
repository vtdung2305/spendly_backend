import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: CreateTransactionDto) {
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, userId, deletedAt: null } });
    if (!category) throw new NotFoundException('Category not found');

    return this.repo.create(userId, {
      type: dto.type,
      categoryId: dto.categoryId,
      amount: dto.amount,
      note: dto.note,
      occurredAt: new Date(dto.occurredAt),
    });
  }
}
