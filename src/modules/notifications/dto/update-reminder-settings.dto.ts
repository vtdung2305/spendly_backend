import { IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { REMINDER_TIME_OPTIONS } from '../constants/reminder-time-options.constant';

export class UpdateReminderSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dailyExpenseReminder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  budgetAlertReminder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  recurringAlertReminder?: boolean;

  @ApiPropertyOptional({ enum: REMINDER_TIME_OPTIONS })
  @IsOptional()
  @IsIn(REMINDER_TIME_OPTIONS)
  dailyReminderTime?: string;
}
