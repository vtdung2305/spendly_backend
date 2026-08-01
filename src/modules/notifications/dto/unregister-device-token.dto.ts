import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnregisterDeviceTokenDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  token: string;
}
