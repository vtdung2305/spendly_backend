import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { SavingsGoalsModule } from './modules/savings-goals/savings-goals.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RecurringTransactionsModule } from './modules/recurring-transactions/recurring-transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FilesModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    SavingsGoalsModule,
    DashboardModule,
    RecurringTransactionsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
