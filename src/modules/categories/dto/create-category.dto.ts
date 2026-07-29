import { IsEnum, IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

const PALETTE = ['#4F46E5', '#F59E0B', '#22C55E', '#F43F5E', '#8B5CF6', '#0EA5E9'];

export class CreateCategoryDto {
  @ApiProperty() @IsString() @MaxLength(50) name: string;

  @ApiProperty({ enum: PALETTE })
  @IsString()
  @Matches(new RegExp(`^(${PALETTE.join('|')})$`), { message: 'Color must be one of the palette values' })
  color: string;

  @ApiProperty({ description: 'Material Symbols Rounded icon name' })
  @IsString()
  @MaxLength(50)
  icon: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;
}
