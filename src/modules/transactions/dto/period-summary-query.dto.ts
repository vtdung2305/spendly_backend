import { IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SummaryPeriod {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class PeriodSummaryQueryDto {
  @ApiProperty({ enum: SummaryPeriod })
  @IsEnum(SummaryPeriod)
  period: SummaryPeriod;

  @ApiProperty({ example: '2026-07-29', description: 'Any date within the target period' })
  @IsDateString()
  date: string;
}
