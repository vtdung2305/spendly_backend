import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/exceptions/app.exception';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService, TokenPair } from '../services/token.service';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    const hash = this.tokenService.hashToken(refreshToken);
    const stored = await this.authRepo.findRefreshTokenByHash(hash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppException('INVALID_REFRESH_TOKEN', 'Phiên đăng nhập đã hết hạn', HttpStatus.UNAUTHORIZED);
    }

    if (stored.usedAt) {
      // Reuse of an already-rotated refresh token: possible theft, revoke the whole chain.
      await this.authRepo.revokeAllRefreshTokensForUser(stored.userId);
      throw new AppException('TOKEN_REUSE_DETECTED', 'Phát hiện truy cập bất thường, vui lòng đăng nhập lại', HttpStatus.UNAUTHORIZED);
    }

    await this.authRepo.markRefreshTokenUsed(stored.id);

    const user = await this.authRepo.findUserById(stored.userId);
    if (!user) {
      throw new AppException('UNAUTHORIZED', 'Người dùng không tồn tại', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = this.tokenService.signAccessToken(user);
    const next = this.tokenService.generateRefreshToken();
    await this.authRepo.createRefreshToken(user.id, next.hash, next.expiresAt);

    return { accessToken, refreshToken: next.token, refreshTokenExpiresAt: next.expiresAt };
  }
}
