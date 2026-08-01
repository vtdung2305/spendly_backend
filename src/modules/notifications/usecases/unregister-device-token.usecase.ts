import { Injectable } from '@nestjs/common';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { UnregisterDeviceTokenDto } from '../dto/unregister-device-token.dto';

@Injectable()
export class UnregisterDeviceTokenUseCase {
  constructor(private readonly repo: DeviceTokensRepository) {}

  async execute(dto: UnregisterDeviceTokenDto): Promise<void> {
    await this.repo.deleteByToken(dto.token);
  }
}
