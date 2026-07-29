import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '@prisma/client';

export class OAuthLoginDto {
  @ApiProperty({ enum: [AuthProvider.GOOGLE, AuthProvider.FACEBOOK] })
  @IsEnum(AuthProvider)
  provider: typeof AuthProvider.GOOGLE | typeof AuthProvider.FACEBOOK;

  @ApiProperty({ description: 'Google ID token, or Facebook access token' })
  @IsString()
  token: string;
}
