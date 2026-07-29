import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly usersRepo: UsersRepository) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepo.findByIdOrThrow(userId);
    return UserResponseDto.fromEntity(user);
  }
}
