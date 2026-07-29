import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailOtpService } from '../services/email-otp.service';
import { ResendOtpDto } from '../dto/resend-otp.dto';

@Injectable()
export class ResendOtpUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly emailOtpService: EmailOtpService,
  ) {}

  async execute(dto: ResendOtpDto): Promise<void> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    // Resolve silently when the account doesn't exist or is already verified,
    // to avoid leaking account existence/verification status.
    if (!user || user.emailVerifiedAt) return;

    await this.emailOtpService.issue(user.id, user.email, user.firstName);
  }
}
