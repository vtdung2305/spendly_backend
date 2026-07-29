import { Injectable, HttpStatus } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AppException } from '../../../common/exceptions/app.exception';
import { AuthRepository } from '../repositories/auth.repository';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const stored = await this.authRepo.findValidPasswordResetToken(tokenHash);
    if (!stored) {
      throw new AppException('INVALID_RESET_TOKEN', 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', HttpStatus.BAD_REQUEST);
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.authRepo.updateUserPassword(stored.userId, passwordHash);
    await this.authRepo.markPasswordResetTokenUsed(stored.id);
    await this.authRepo.revokeAllRefreshTokensForUser(stored.userId);
  }
}
