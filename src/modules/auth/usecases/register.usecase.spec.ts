import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '@prisma/client';
import { AppException } from '../../../common/exceptions/app.exception';
import { RegisterUseCase } from './register.usecase';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';

jest.mock('bcrypt');

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let authRepo: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    authRepo = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      createRefreshToken: jest.fn(),
    } as any;

    tokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'refresh-token', hash: 'hash', expiresAt: new Date('2026-08-05') }),
    } as any;

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    useCase = new RegisterUseCase(authRepo, tokenService);
  });

  it('throws EMAIL_ALREADY_EXISTS when the email is already registered', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'existing-user' } as any);

    await expect(
      useCase.execute({ email: 'taken@spendly.app', password: 'Passw0rd1', firstName: 'A', lastName: 'B' }),
    ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });

    expect(authRepo.createUser).not.toHaveBeenCalled();
  });

  it('creates the user, issues a token pair, and persists the refresh token on success', async () => {
    authRepo.findUserByEmail.mockResolvedValue(null);
    authRepo.createUser.mockResolvedValue({ id: 'user-1', email: 'new@spendly.app' } as any);

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
    expect(authRepo.createRefreshToken).toHaveBeenCalledWith('user-1', 'hash', expect.any(Date));
    expect(result).toEqual({
      userId: 'user-1',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2026-08-05'),
    });
  });

  it('rethrows AppException instances as-is (sanity check on error shape)', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'x' } as any);
    try {
      await useCase.execute({ email: 'a@b.com', password: 'Passw0rd1', firstName: 'A', lastName: 'B' });
      fail('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(AppException);
    }
  });
});
