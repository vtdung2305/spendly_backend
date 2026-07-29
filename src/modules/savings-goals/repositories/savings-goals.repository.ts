import { Injectable } from '@nestjs/common';
import { SavingsGoal } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SavingsGoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByYear(userId: string, year: number): Promise<SavingsGoal | null> {
    return this.prisma.savingsGoal.findFirst({ where: { userId, year } });
  }

  upsert(userId: string, year: number, targetAmount: number): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.upsert({
      where: { userId_year: { userId, year } },
      create: { userId, year, targetAmount },
      update: { targetAmount },
    });
  }
}
