import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { DailySummaryQueryDto } from './dto/daily-summary-query.dto';
import { PeriodSummaryQueryDto } from './dto/period-summary-query.dto';
import { CreateTransactionUseCase } from './usecases/create-transaction.usecase';
import { GetTransactionUseCase } from './usecases/get-transaction.usecase';
import { ListTransactionsUseCase } from './usecases/list-transactions.usecase';
import { UpdateTransactionUseCase } from './usecases/update-transaction.usecase';
import { DeleteTransactionUseCase } from './usecases/delete-transaction.usecase';
import { GetDailySummaryUseCase } from './usecases/get-daily-summary.usecase';
import { GetPeriodSummaryUseCase } from './usecases/get-period-summary.usecase';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
    private readonly getDailySummaryUseCase: GetDailySummaryUseCase,
    private readonly getPeriodSummaryUseCase: GetPeriodSummaryUseCase,
  ) {}

  @Get('summary/daily')
  @ApiOperation({ summary: 'Daily expense totals for a month (Calendar grid, Dashboard bar chart)' })
  async dailySummary(@CurrentUser('id') userId: string, @Query() query: DailySummaryQueryDto) {
    return this.getDailySummaryUseCase.execute(userId, query);
  }

  @Get('summary/period')
  @ApiOperation({ summary: 'Income/expense/category breakdown for week, month or year (Reports)' })
  async periodSummary(@CurrentUser('id') userId: string, @Query() query: PeriodSummaryQueryDto) {
    return this.getPeriodSummaryUseCase.execute(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new expense or income transaction' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTransactionDto) {
    return this.createTransactionUseCase.execute(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with cursor pagination and filters' })
  async list(@CurrentUser('id') userId: string, @Query() query: QueryTransactionDto) {
    return this.listTransactionsUseCase.execute(userId, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get a transaction by id' })
  async get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.getTransactionUseCase.execute(id, userId);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Edit a transaction' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.updateTransactionUseCase.execute(id, userId, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Delete a transaction' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.deleteTransactionUseCase.execute(id, userId);
    return { deleted: true };
  }
}
