import * as bcrypt from 'bcrypt';
import { AuthProvider } from '@prisma/client';
import { RegisterUseCase } from './register.usecase';
import { AuthRepository } from '../repositories/auth.repository';
import { EmailOtpService } from '../services/email-otp.service';

jest.mock('bcrypt');

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let authRepo: jest.Mocked<AuthRepository>;
  let emailOtpService: jest.Mocked<EmailOtpService>;

  beforeEach(() => {
    authRepo = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
    } as any;

    emailOtpService = {
      issue: jest.fn(),
    } as any;

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    useCase = new RegisterUseCase(authRepo, emailOtpService);
  });

  it('throws EMAIL_ALREADY_EXISTS when the email is already registered and verified', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'existing-user', emailVerifiedAt: new Date() } as any);

    await expect(
      useCase.execute({ email: 'taken@spendly.app', password: 'Passw0rd1', firstName: 'A', lastName: 'B' }),
    ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS' });

    expect(authRepo.createUser).not.toHaveBeenCalled();
    expect(emailOtpService.issue).not.toHaveBeenCalled();
  });

  it('re-issues an OTP instead of erroring when retrying with an unverified email', async () => {
    authRepo.findUserByEmail.mockResolvedValue({
      id: 'existing-user',
      email: 'pending@spendly.app',
      firstName: 'Minh',
      emailVerifiedAt: null,
    } as any);

    const result = await useCase.execute({
      email: 'pending@spendly.app',
      password: 'Passw0rd1',
      firstName: 'A',
      lastName: 'B',
    });

    expect(authRepo.createUser).not.toHaveBeenCalled();
    expect(emailOtpService.issue).toHaveBeenCalledWith('existing-user', 'pending@spendly.app', 'Minh');
    expect(result).toEqual({ userId: 'existing-user', email: 'pending@spendly.app', otpRequired: true });
  });

  it('creates the user and issues an OTP on a fresh registration', async () => {
    authRepo.findUserByEmail.mockResolvedValue(null);
    authRepo.createUser.mockResolvedValue({ id: 'user-1', email: 'new@spendly.app', firstName: 'Minh' } as any);

    const result = await useCase.execute({
      email: 'new@spendly.app',
      password: 'Passw0rd1',
      firstName: 'Minh',
      lastName: 'Nguyễn',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Passw0rd1', 12);
    expect(authRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@spendly.app', provider: AuthProvider.EMAIL, passwordHash: 'hashed-password' }),
    );
    expect(emailOtpService.issue).toHaveBeenCalledWith('user-1', 'new@spendly.app', 'Minh');
    expect(result).toEqual({ userId: 'user-1', email: 'new@spendly.app', otpRequired: true });
  });
});
