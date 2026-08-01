import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../../common/pagination/cursor-pagination.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { UnregisterDeviceTokenDto } from './dto/unregister-device-token.dto';
import { UpdateReminderSettingsDto } from './dto/update-reminder-settings.dto';
import { ListNotificationsUseCase } from './usecases/list-notifications.usecase';
import { MarkAllNotificationsReadUseCase } from './usecases/mark-all-notifications-read.usecase';
import { RegisterDeviceTokenUseCase } from './usecases/register-device-token.usecase';
import { UnregisterDeviceTokenUseCase } from './usecases/unregister-device-token.usecase';
import { GetReminderSettingsUseCase } from './usecases/get-reminder-settings.usecase';
import { UpdateReminderSettingsUseCase } from './usecases/update-reminder-settings.usecase';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly registerDeviceTokenUseCase: RegisterDeviceTokenUseCase,
    private readonly unregisterDeviceTokenUseCase: UnregisterDeviceTokenUseCase,
    private readonly getReminderSettingsUseCase: GetReminderSettingsUseCase,
    private readonly updateReminderSettingsUseCase: UpdateReminderSettingsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications (cursor pagination), newest first' })
  async list(@CurrentUser('id') userId: string, @Query() query: CursorPaginationDto) {
    return this.listNotificationsUseCase.execute(userId, query);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark every notification as read' })
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.markAllNotificationsReadUseCase.execute(userId);
  }

  @Get('reminder-settings')
  @ApiOperation({ summary: 'Get reminder toggle/time settings' })
  async getReminderSettings(@CurrentUser('id') userId: string) {
    return this.getReminderSettingsUseCase.execute(userId);
  }

  @Patch('reminder-settings')
  @ApiOperation({ summary: 'Update reminder toggles / daily reminder time' })
  async updateReminderSettings(@CurrentUser('id') userId: string, @Body() dto: UpdateReminderSettingsDto) {
    return this.updateReminderSettingsUseCase.execute(userId, dto);
  }

  @Post('device-tokens')
  @ApiOperation({ summary: 'Register (or refresh) this device\'s FCM push token' })
  async registerDeviceToken(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceTokenDto) {
    return this.registerDeviceTokenUseCase.execute(userId, dto);
  }

  @Delete('device-tokens')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister a device token (e.g. on logout)' })
  async unregisterDeviceToken(@Body() dto: UnregisterDeviceTokenDto) {
    await this.unregisterDeviceTokenUseCase.execute(dto);
  }
}
