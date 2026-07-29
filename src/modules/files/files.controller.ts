import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadAvatarUseCase } from './usecases/upload-avatar.usecase';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('api/v1/files')
export class FilesController {
  constructor(private readonly uploadAvatarUseCase: UploadAvatarUseCase) {}

  @Post('upload')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload an avatar image to MinIO' })
  async upload(@CurrentUser('id') userId: string, @UploadedFile() file?: Express.Multer.File) {
    return this.uploadAvatarUseCase.execute(userId, file);
  }
}
