import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../common/exceptions/app.exception';
import { CloudinaryService } from '../services/cloudinary.service';
import { PrismaService } from '../../../prisma/prisma.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class UploadAvatarUseCase {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async execute(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new AppException('FILE_REQUIRED', 'Không có tệp nào được tải lên', HttpStatus.BAD_REQUEST);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppException('INVALID_FILE_TYPE', 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WEBP', HttpStatus.BAD_REQUEST);
    }
    const maxSize = this.config.get<number>('upload.maxAvatarSize')!;
    if (file.size > maxSize) {
      throw new AppException('FILE_TOO_LARGE', `Kích thước tệp vượt quá ${Math.round(maxSize / 1024 / 1024)}MB`, HttpStatus.BAD_REQUEST);
    }

    const { url, size } = await this.cloudinary.uploadAvatar(userId, file);
    const record = await this.prisma.uploadedFile.create({
      data: { userId, url, mimeType: file.mimetype, size },
    });

    return { id: record.id, url: record.url, mimeType: record.mimeType, size: record.size };
  }
}
