import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { CloudinaryService } from './services/cloudinary.service';
import { UploadAvatarUseCase } from './usecases/upload-avatar.usecase';

@Module({
  controllers: [FilesController],
  providers: [CloudinaryService, UploadAvatarUseCase],
})
export class FilesModule {}
