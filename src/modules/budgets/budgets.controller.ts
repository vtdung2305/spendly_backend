import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { ListBudgetsUseCase } from './usecases/list-budgets.usecase';
import { CreateBudgetUseCase } from './usecases/create-budget.usecase';
import { UpdateBudgetUseCase } from './usecases/update-budget.usecase';
import { DeleteBudgetUseCase } from './usecases/delete-budget.usecase';

@ApiTags('Budgets')
@ApiBearerAuth()
@Controller('api/v1/budgets')
export class BudgetsController {
  constructor(
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly updateBudgetUseCase: UpdateBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List budgets for a month with computed spentAmount/usedPercent' })
  async list(@CurrentUser('id') userId: string, @Query() query: QueryBudgetDto) {
    return this.listBudgetsUseCase.execute(userId, query.month);
  }

  @Post()
  @ApiOperation({ summary: 'Create a monthly budget limit for a category' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateBudgetDto) {
    return this.createBudgetUseCase.execute(userId, dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a budget limit' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.updateBudgetUseCase.execute(id, userId, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Delete a budget' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.deleteBudgetUseCase.execute(id, userId);
    return { deleted: true };
  }
}
