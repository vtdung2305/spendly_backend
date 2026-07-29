import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../common/exceptions/app.exception';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailOtpService } from '../services/email-otp.service';
import { TokenService, TokenPair } from '../services/token.service';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly emailOtpService: EmailOtpService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<TokenPair & { userId: string }> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) {
      throw new AppException('OTP_INVALID_OR_EXPIRED', 'Mã xác thực không đúng hoặc đã hết hạn', HttpStatus.BAD_REQUEST);
    }

    // Already verified (e.g. double-submit): verifying again is a harmless no-op,
    // just issue a fresh session so the client can proceed to the Dashboard.
    if (!user.emailVerifiedAt) {
      const otp = await this.authRepo.findLatestActiveEmailOtp(user.id);
      if (!otp) {
        throw new AppException('OTP_INVALID_OR_EXPIRED', 'Mã xác thực không đúng hoặc đã hết hạn', HttpStatus.BAD_REQUEST);
      }

      if (otp.codeHash !== this.emailOtpService.hash(dto.code)) {
        const maxAttempts = this.config.get<number>('otp.maxAttempts')!;
        const attempts = otp.attempts + 1;
        if (attempts >= maxAttempts) {
          await this.authRepo.markEmailOtpUsed(otp.id);
          throw new AppException(
            'OTP_TOO_MANY_ATTEMPTS',
            'Bạn đã nhập sai quá số lần cho phép. Vui lòng yêu cầu gửi lại mã',
            HttpStatus.BAD_REQUEST,
          );
        }
        await this.authRepo.incrementEmailOtpAttempts(otp.id, attempts);
        throw new AppException('OTP_INVALID_OR_EXPIRED', 'Mã xác thực không đúng hoặc đã hết hạn', HttpStatus.BAD_REQUEST);
      }

      await this.authRepo.markEmailOtpUsed(otp.id);
      await this.authRepo.markEmailVerified(user.id);
    }

    const accessToken = this.tokenService.signAccessToken(user);
    const { token: refreshToken, hash, expiresAt } = this.tokenService.generateRefreshToken();
    await this.authRepo.createRefreshToken(user.id, hash, expiresAt);

    return { userId: user.id, accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }
}
