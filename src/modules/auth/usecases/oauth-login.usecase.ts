import { Injectable } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService, TokenPair } from '../services/token.service';
import { OAuthVerifierService } from '../services/oauth-verifier.service';
import { OAuthLoginDto } from '../dto/oauth-login.dto';

@Injectable()
export class OAuthLoginUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly verifier: OAuthVerifierService,
  ) {}

  async execute(dto: OAuthLoginDto): Promise<TokenPair & { userId: string }> {
    const profile =
      dto.provider === AuthProvider.GOOGLE
        ? await this.verifier.verifyGoogle(dto.token)
        : await this.verifier.verifyFacebook(dto.token);

    let user = await this.authRepo.findUserByProvider(dto.provider, profile.providerId);
    if (!user) {
      // Fall back to matching an existing email-registered account so a user
      // isn't split into two identities when they sign in with a different method.
      user = await this.authRepo.findUserByEmail(profile.email);
    }
    if (!user) {
      user = await this.authRepo.createUser({
        email: profile.email,
        provider: dto.provider,
        providerId: profile.providerId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
      });
    }

    const accessToken = this.tokenService.signAccessToken(user);
    const { token: refreshToken, hash, expiresAt } = this.tokenService.generateRefreshToken();
    await this.authRepo.createRefreshToken(user.id, hash, expiresAt);

    return { userId: user.id, accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }
}
