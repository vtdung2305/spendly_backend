import { IsEnum, IsUUID, IsString, MaxLength, IsNumber, IsPositive, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Tiền nhà', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ minimum: 1, maximum: 28, description: 'Day of month to auto-generate the transaction on' })
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
