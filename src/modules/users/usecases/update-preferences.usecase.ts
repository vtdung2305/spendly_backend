import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(private readonly usersRepo: UsersRepository) {}

  async execute(userId: string, dto: UpdatePreferencesDto): Promise<UserResponseDto> {
    await this.usersRepo.findByIdOrThrow(userId);
    const updated = await this.usersRepo.update(userId, dto);
    return UserResponseDto.fromEntity(updated);
  }
}
