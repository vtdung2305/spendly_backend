import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpsertSavingsGoalDto } from './dto/upsert-savings-goal.dto';
import { GetSavingsGoalUseCase } from './usecases/get-savings-goal.usecase';
import { UpsertSavingsGoalUseCase } from './usecases/upsert-savings-goal.usecase';

@ApiTags('SavingsGoals')
@ApiBearerAuth()
@Controller('api/v1/savings-goals')
export class SavingsGoalsController {
  constructor(
    private readonly getSavingsGoalUseCase: GetSavingsGoalUseCase,
    private readonly upsertSavingsGoalUseCase: UpsertSavingsGoalUseCase,
  ) {}

  @Get(':year')
  @ApiParam({ name: 'year', type: Number })
  @ApiOperation({ summary: 'Get the savings goal and current progress for a year' })
  async get(@Param('year', ParseIntPipe) year: number, @CurrentUser('id') userId: string) {
    return this.getSavingsGoalUseCase.execute(userId, year);
  }

  @Put(':year')
  @ApiParam({ name: 'year', type: Number })
  @ApiOperation({ summary: 'Set the savings target for a year' })
  async upsert(
    @Param('year', ParseIntPipe) year: number,
    @CurrentUser('id') userId: string,
    @Body() dto: UpsertSavingsGoalDto,
  ) {
    return this.upsertSavingsGoalUseCase.execute(userId, year, dto);
  }
}
