import { Injectable } from '@nestjs/common';
import { Category, CategoryType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(userId: string, type?: CategoryType): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, userId } });
  }

  findDefaultForUser(userId: string, type: CategoryType): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { userId, type, isDefault: true } });
  }

  findByNameAndType(userId: string, name: string, type: CategoryType): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { userId, name, type } });
  }

  create(userId: string, data: { name: string; color: string; icon: string; type: CategoryType }): Promise<Category> {
    return this.prisma.category.create({ data: { ...data, userId } });
  }

  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  countTransactionsThisMonth(categoryId: string): Promise<number> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return this.prisma.transaction.count({
      where: { categoryId, occurredAt: { gte: start, lt: end } },
    });
  }

  /**
   * Soft-deletes the category, reassigns its transactions to the user's default
   * ("Khác") category of the same type, and removes any budget tied to it.
   */
  async deleteAndReassign(category: Category, fallbackCategoryId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.transaction.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: fallbackCategoryId },
      }),
      this.prisma.budget.updateMany({
        where: { categoryId: category.id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.category.update({ where: { id: category.id }, data: { deletedAt: new Date() } }),
    ]);
  }
}
