import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { GetDashboardSummaryUseCase } from './usecases/get-dashboard-summary.usecase';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase) {}

  @Get('summary')
  @ApiOperation({ summary: 'Single aggregated payload for the Dashboard screen' })
  async summary(@CurrentUser('id') userId: string, @Query() query: DashboardQueryDto) {
    return this.getDashboardSummaryUseCase.execute(userId, query.month);
  }
}
