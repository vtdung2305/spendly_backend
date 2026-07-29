import { Injectable, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService, TokenPair } from '../services/token.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: RegisterDto): Promise<TokenPair & { userId: string }> {
    const existing = await this.authRepo.findUserByEmail(dto.email);
    if (existing) {
      throw new AppException('EMAIL_ALREADY_EXISTS', 'Email này đã được sử dụng', HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      provider: AuthProvider.EMAIL,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    const accessToken = this.tokenService.signAccessToken(user);
    const { token: refreshToken, hash, expiresAt } = this.tokenService.generateRefreshToken();
    await this.authRepo.createRefreshToken(user.id, hash, expiresAt);

    return { userId: user.id, accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }
}
