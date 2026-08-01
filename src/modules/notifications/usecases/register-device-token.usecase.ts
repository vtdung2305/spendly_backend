import { Injectable } from '@nestjs/common';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';

@Injectable()
export class RegisterDeviceTokenUseCase {
  constructor(private readonly repo: DeviceTokensRepository) {}

  execute(userId: string, dto: RegisterDeviceTokenDto) {
    return this.repo.upsert(userId, dto.token, dto.platform);
  }
}
