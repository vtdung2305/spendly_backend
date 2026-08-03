import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { ListSavingsGoalsUseCase } from './usecases/list-savings-goals.usecase';
import { CreateSavingsGoalUseCase } from './usecases/create-savings-goal.usecase';
import { GetSavingsGoalDetailUseCase } from './usecases/get-savings-goal-detail.usecase';
import { UpdateSavingsGoalUseCase } from './usecases/update-savings-goal.usecase';
import { DeleteSavingsGoalUseCase } from './usecases/delete-savings-goal.usecase';

@ApiTags('SavingsGoals')
@ApiBearerAuth()
@Controller('api/v1/savings-goals')
export class SavingsGoalsController {
  constructor(
    private readonly listSavingsGoalsUseCase: ListSavingsGoalsUseCase,
    private readonly createSavingsGoalUseCase: CreateSavingsGoalUseCase,
    private readonly getSavingsGoalDetailUseCase: GetSavingsGoalDetailUseCase,
    private readonly updateSavingsGoalUseCase: UpdateSavingsGoalUseCase,
    private readonly deleteSavingsGoalUseCase: DeleteSavingsGoalUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all of the current user\'s savings goals' })
  async list(@CurrentUser('id') userId: string) {
    return this.listSavingsGoalsUseCase.execute(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new savings goal' })
  @ApiResponse({ status: 201 })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateSavingsGoalDto) {
    return this.createSavingsGoalUseCase.execute(userId, dto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Get a savings goal detail: progress, deadline, and monthly contribution history' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'No savings goal exists with that id' })
  async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.getSavingsGoalDetailUseCase.execute(userId, id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Update an existing savings goal' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'No savings goal exists with that id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSavingsGoalDto,
  ) {
    return this.updateSavingsGoalUseCase.execute(userId, id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Delete a savings goal' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'No savings goal exists with that id' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.deleteSavingsGoalUseCase.execute(userId, id);
    return { deleted: true };
  }
}
