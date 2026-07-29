import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly folder: string;

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('cloudinary.cloudName'),
      api_key: this.config.get<string>('cloudinary.apiKey'),
      api_secret: this.config.get<string>('cloudinary.apiSecret'),
      secure: true,
    });
    this.folder = this.config.get<string>('cloudinary.uploadFolder')!;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ url: string; size: number }> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.folder}/${userId}`,
          resource_type: 'image',
          overwrite: true,
        },
        (error, uploaded) => {
          if (error || !uploaded) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve(uploaded);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });

    return { url: result.secure_url, size: result.bytes };
  }
}
