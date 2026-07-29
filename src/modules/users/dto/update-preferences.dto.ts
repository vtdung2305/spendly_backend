import { IsOptional, IsEnum, IsBoolean, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ThemeMode, Language } from '@prisma/client';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: ThemeMode }) @IsOptional() @IsEnum(ThemeMode) theme?: ThemeMode;
  @ApiPropertyOptional({ enum: Language }) @IsOptional() @IsEnum(Language) language?: Language;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10) currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notificationsEnabled?: boolean;
}
