import { Injectable, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppException } from '../../../common/exceptions/app.exception';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService, TokenPair } from '../services/token.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto): Promise<TokenPair & { userId: string }> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new AppException('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng', HttpStatus.UNAUTHORIZED);
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppException('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng', HttpStatus.UNAUTHORIZED);
    }

    if (!user.emailVerifiedAt) {
      throw new AppException(
        'EMAIL_NOT_VERIFIED',
        'Email chưa được xác thực. Vui lòng nhập mã OTP đã gửi tới email của bạn',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessToken = this.tokenService.signAccessToken(user);
    const { token: refreshToken, hash, expiresAt } = this.tokenService.generateRefreshToken();
    await this.authRepo.createRefreshToken(user.id, hash, expiresAt);

    return { userId: user.id, accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }
}
