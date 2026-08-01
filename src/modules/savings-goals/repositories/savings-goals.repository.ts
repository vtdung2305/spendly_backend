import { Injectable } from '@nestjs/common';
import { SavingsGoal } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SavingsGoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByYear(userId: string, year: number): Promise<SavingsGoal | null> {
    return this.prisma.savingsGoal.findFirst({ where: { userId, year, deletedAt: null } });
  }

  /**
   * Includes soft-deleted rows. The DB unique constraint is on (userId, year)
   * regardless of deletedAt, so `create` must check this — not just `findByYear`
   * — before inserting, or it hits a raw unique-violation for a year the user
   * previously deleted a goal for.
   */
  findAnyByYear(userId: string, year: number): Promise<SavingsGoal | null> {
    return this.prisma.savingsGoal.findFirst({ where: { userId, year } });
  }

  findByIdForUser(id: string, userId: string): Promise<SavingsGoal | null> {
    return this.prisma.savingsGoal.findFirst({ where: { id, userId, deletedAt: null } });
  }

  findAllForUser(userId: string): Promise<SavingsGoal[]> {
    return this.prisma.savingsGoal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { year: 'desc' },
    });
  }

  create(userId: string, year: number, targetAmount: number): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.create({ data: { userId, year, targetAmount } });
  }

  /** Revives a previously soft-deleted goal in place of inserting a new row for the same year. */
  revive(id: string, targetAmount: number): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.update({ where: { id }, data: { targetAmount, deletedAt: null } });
  }

  update(id: string, targetAmount: number): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.update({ where: { id }, data: { targetAmount } });
  }

  softDelete(id: string): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
