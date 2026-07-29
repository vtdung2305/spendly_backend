import { VerifyOtpUseCase } from './verify-otp.usecase';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailOtpService } from '../services/email-otp.service';
import { TokenService } from '../services/token.service';
import { ConfigService } from '@nestjs/config';

describe('VerifyOtpUseCase', () => {
  let useCase: VerifyOtpUseCase;
  let authRepo: jest.Mocked<AuthRepository>;
  let emailOtpService: jest.Mocked<EmailOtpService>;
  let tokenService: jest.Mocked<TokenService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    authRepo = {
      findUserByEmail: jest.fn(),
      findLatestActiveEmailOtp: jest.fn(),
      incrementEmailOtpAttempts: jest.fn(),
      markEmailOtpUsed: jest.fn(),
      markEmailVerified: jest.fn(),
      createRefreshToken: jest.fn(),
    } as any;

    emailOtpService = { hash: jest.fn((code: string) => `hashed-${code}`) } as any;

    tokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'refresh-token', hash: 'hash', expiresAt: new Date('2026-08-05') }),
    } as any;

    config = { get: jest.fn().mockReturnValue(5) } as any;

    useCase = new VerifyOtpUseCase(authRepo, emailOtpService, tokenService, config);
  });

  it('throws OTP_INVALID_OR_EXPIRED when the email does not match any user', async () => {
    authRepo.findUserByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'nobody@spendly.app', code: '123456' })).rejects.toMatchObject({
      code: 'OTP_INVALID_OR_EXPIRED',
    });
  });

  it('throws OTP_INVALID_OR_EXPIRED when there is no active OTP (expired/never issued)', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', emailVerifiedAt: null } as any);
    authRepo.findLatestActiveEmailOtp.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'u@spendly.app', code: '123456' })).rejects.toMatchObject({
      code: 'OTP_INVALID_OR_EXPIRED',
    });
  });

  it('increments attempts and throws OTP_INVALID_OR_EXPIRED on a wrong code, below the attempt limit', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', emailVerifiedAt: null } as any);
    authRepo.findLatestActiveEmailOtp.mockResolvedValue({ id: 'otp1', codeHash: 'hashed-999999', attempts: 1 } as any);

    await expect(useCase.execute({ email: 'u@spendly.app', code: '123456' })).rejects.toMatchObject({
      code: 'OTP_INVALID_OR_EXPIRED',
    });
    expect(authRepo.incrementEmailOtpAttempts).toHaveBeenCalledWith('otp1', 2);
    expect(authRepo.markEmailOtpUsed).not.toHaveBeenCalled();
  });

  it('invalidates the OTP and throws OTP_TOO_MANY_ATTEMPTS once the attempt limit is reached', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', emailVerifiedAt: null } as any);
    authRepo.findLatestActiveEmailOtp.mockResolvedValue({ id: 'otp1', codeHash: 'hashed-999999', attempts: 4 } as any);

    await expect(useCase.execute({ email: 'u@spendly.app', code: '123456' })).rejects.toMatchObject({
      code: 'OTP_TOO_MANY_ATTEMPTS',
    });
    expect(authRepo.markEmailOtpUsed).toHaveBeenCalledWith('otp1');
  });

  it('verifies the user and issues a session on a correct code', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'u@spendly.app', emailVerifiedAt: null } as any);
    authRepo.findLatestActiveEmailOtp.mockResolvedValue({ id: 'otp1', codeHash: 'hashed-123456', attempts: 0 } as any);

    const result = await useCase.execute({ email: 'u@spendly.app', code: '123456' });

    expect(authRepo.markEmailOtpUsed).toHaveBeenCalledWith('otp1');
    expect(authRepo.markEmailVerified).toHaveBeenCalledWith('u1');
    expect(result).toEqual({
      userId: 'u1',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2026-08-05'),
    });
  });

  it('is idempotent: an already-verified user gets a fresh session without touching OTP state', async () => {
    authRepo.findUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'u@spendly.app',
      emailVerifiedAt: new Date('2026-01-01'),
    } as any);

    const result = await useCase.execute({ email: 'u@spendly.app', code: '000000' });

    expect(authRepo.findLatestActiveEmailOtp).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('access-token');
  });
});
