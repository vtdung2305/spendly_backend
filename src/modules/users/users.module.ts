import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersRepository } from './repositories/users.repository';
import { GetMeUseCase } from './usecases/get-me.usecase';
import { UpdateProfileUseCase } from './usecases/update-profile.usecase';
import { UpdatePreferencesUseCase } from './usecases/update-preferences.usecase';

@Module({
  controllers: [UsersController],
  providers: [UsersRepository, GetMeUseCase, UpdateProfileUseCase, UpdatePreferencesUseCase],
})
export class UsersModule {}
