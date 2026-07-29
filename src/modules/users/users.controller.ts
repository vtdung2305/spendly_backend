import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetMeUseCase } from './usecases/get-me.usecase';
import { UpdateProfileUseCase } from './usecases/update-profile.usecase';
import { UpdatePreferencesUseCase } from './usecases/update-preferences.usecase';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updatePreferencesUseCase: UpdatePreferencesUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  async me(@CurrentUser('id') userId: string) {
    return this.getMeUseCase.execute(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile fields (name, phone, address, avatar)' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.updateProfileUseCase.execute(userId, dto);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update theme, language, currency, notification preferences' })
  async updatePreferences(@CurrentUser('id') userId: string, @Body() dto: UpdatePreferencesDto) {
    return this.updatePreferencesUseCase.execute(userId, dto);
  }
}
