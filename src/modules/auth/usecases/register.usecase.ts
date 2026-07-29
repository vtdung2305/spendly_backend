import { Injectable, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailOtpService } from '../services/email-otp.service';
import { RegisterDto } from '../dto/register.dto';

export interface RegisterResult {
  userId: string;
  email: string;
  otpRequired: true;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly emailOtpService: EmailOtpService,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.authRepo.findUserByEmail(dto.email);

    if (existing) {
      if (existing.emailVerifiedAt) {
        throw new AppException('EMAIL_ALREADY_EXISTS', 'Email này đã được sử dụng', HttpStatus.CONFLICT);
      }
      // Unverified account from a previous, abandoned registration attempt:
      // just re-issue a fresh OTP instead of erroring, so retrying with the
      // same email "just works" from the client's point of view.
      await this.emailOtpService.issue(existing.id, existing.email, existing.firstName);
      return { userId: existing.id, email: existing.email, otpRequired: true };
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      provider: AuthProvider.EMAIL,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    await this.emailOtpService.issue(user.id, user.email, user.firstName);

    return { userId: user.id, email: user.email, otpRequired: true };
  }
}
