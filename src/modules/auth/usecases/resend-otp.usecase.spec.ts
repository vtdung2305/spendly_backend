import { ResendOtpUseCase } from './resend-otp.usecase';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailOtpService } from '../services/email-otp.service';

describe('ResendOtpUseCase', () => {
  let useCase: ResendOtpUseCase;
  let authRepo: jest.Mocked<AuthRepository>;
  let emailOtpService: jest.Mocked<EmailOtpService>;

  beforeEach(() => {
    authRepo = { findUserByEmail: jest.fn() } as any;
    emailOtpService = { issue: jest.fn() } as any;
    useCase = new ResendOtpUseCase(authRepo, emailOtpService);
  });

  it('does nothing when the email has no account (avoids leaking existence)', async () => {
    authRepo.findUserByEmail.mockResolvedValue(null);

    await useCase.execute({ email: 'nobody@spendly.app' });

    expect(emailOtpService.issue).not.toHaveBeenCalled();
  });

  it('does nothing when the account is already verified', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', emailVerifiedAt: new Date() } as any);

    await useCase.execute({ email: 'verified@spendly.app' });

    expect(emailOtpService.issue).not.toHaveBeenCalled();
  });

  it('issues a new OTP for an unverified account', async () => {
    authRepo.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'pending@spendly.app',
      firstName: 'Minh',
      emailVerifiedAt: null,
    } as any);

    await useCase.execute({ email: 'pending@spendly.app' });

    expect(emailOtpService.issue).toHaveBeenCalledWith('u1', 'pending@spendly.app', 'Minh');
  });
});
