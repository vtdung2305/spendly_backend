import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly usersRepo: UsersRepository) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    await this.usersRepo.findByIdOrThrow(userId);
    const updated = await this.usersRepo.update(userId, dto);
    return UserResponseDto.fromEntity(updated);
  }
}
