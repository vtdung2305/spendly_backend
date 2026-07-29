import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const hash = this.tokenService.hashToken(refreshToken);
    const stored = await this.authRepo.findRefreshTokenByHash(hash);
    if (stored && !stored.revokedAt) {
      await this.authRepo.revokeAllRefreshTokensForUser(stored.userId);
    }
  }
}
