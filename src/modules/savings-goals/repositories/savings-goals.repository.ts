import { Injectable } from '@nestjs/common';
import { SavingsGoal } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface SavingsGoalWriteData {
  name: string;
  targetAmount: number;
  deadline: Date;
  initialAmount?: number;
}

@Injectable()
export class SavingsGoalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string): Promise<SavingsGoal[]> {
    return this.prisma.savingsGoal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { deadline: 'asc' },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<SavingsGoal | null> {
    return this.prisma.savingsGoal.findFirst({ where: { id, userId, deletedAt: null } });
  }

  create(userId: string, data: SavingsGoalWriteData): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        deadline: data.deadline,
        initialAmount: data.initialAmount ?? 0,
      },
    });
  }

  update(id: string, data: Partial<SavingsGoalWriteData>): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<SavingsGoal> {
    return this.prisma.savingsGoal.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
