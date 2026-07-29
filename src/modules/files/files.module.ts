import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MinioService } from './services/minio.service';
import { UploadAvatarUseCase } from './usecases/upload-avatar.usecase';

@Module({
  controllers: [FilesController],
  providers: [MinioService, UploadAvatarUseCase],
})
export class FilesModule {}
