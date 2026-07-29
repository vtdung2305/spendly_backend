import { ApiProperty } from '@nestjs/swagger';
import { ThemeMode, Language } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty({ required: false }) phone?: string | null;
  @ApiProperty({ required: false }) address?: string | null;
  @ApiProperty({ required: false }) avatarUrl?: string | null;
  @ApiProperty({ enum: ThemeMode }) theme: ThemeMode;
  @ApiProperty({ enum: Language }) language: Language;
  @ApiProperty() currency: string;
  @ApiProperty() notificationsEnabled: boolean;

  static fromEntity(user: any): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.address = user.address;
    dto.avatarUrl = user.avatarUrl;
    dto.theme = user.theme;
    dto.language = user.language;
    dto.currency = user.currency;
    dto.notificationsEnabled = user.notificationsEnabled;
    return dto;
  }
}
