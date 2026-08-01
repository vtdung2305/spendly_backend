import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { ListRecurringTransactionsUseCase } from './usecases/list-recurring-transactions.usecase';
import { GetRecurringTransactionUseCase } from './usecases/get-recurring-transaction.usecase';
import { CreateRecurringTransactionUseCase } from './usecases/create-recurring-transaction.usecase';
import { UpdateRecurringTransactionUseCase } from './usecases/update-recurring-transaction.usecase';
import { DeleteRecurringTransactionUseCase } from './usecases/delete-recurring-transaction.usecase';

@ApiTags('RecurringTransactions')
@ApiBearerAuth()
@Controller('api/v1/recurring-transactions')
export class RecurringTransactionsController {
  constructor(
    private readonly listRecurringTransactionsUseCase: ListRecurringTransactionsUseCase,
    private readonly getRecurringTransactionUseCase: GetRecurringTransactionUseCase,
    private readonly createRecurringTransactionUseCase: CreateRecurringTransactionUseCase,
    private readonly updateRecurringTransactionUseCase: UpdateRecurringTransactionUseCase,
    private readonly deleteRecurringTransactionUseCase: DeleteRecurringTransactionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all recurring transactions (active and paused) for the user' })
  async list(@CurrentUser('id') userId: string) {
    return this.listRecurringTransactionsUseCase.execute(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new recurring transaction' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: 'Category not found for the given type' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateRecurringTransactionDto) {
    return this.createRecurringTransactionUseCase.execute(userId, dto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get a recurring transaction by id' })
  async get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.getRecurringTransactionUseCase.execute(id, userId);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a recurring transaction (including pausing via isActive)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return this.updateRecurringTransactionUseCase.execute(id, userId, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Delete a recurring transaction' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.deleteRecurringTransactionUseCase.execute(id, userId);
    return { deleted: true };
  }
}
