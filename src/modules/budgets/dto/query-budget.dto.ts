import { Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryBudgetDto {
  @ApiProperty({ example: '2026-07' })
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month: string;
}
