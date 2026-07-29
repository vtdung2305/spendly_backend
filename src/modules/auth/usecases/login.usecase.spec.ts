import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginUseCase } from './login.usecase';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';

jest.mock('bcrypt');

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let authRepo: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    authRepo = {
      findUserByEmail: jest.fn(),
      createRefreshToken: jest.fn(),
    } as any;

    tokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'refresh-token', hash: 'hash', expiresAt: new Date('2026-08-05') }),
    } as any;

    useCase = new LoginUseCase(authRepo, tokenService);
  });

  it('throws INVALID_CREDENTIALS when the email is not registered', async () => {
    authRepo.findUserByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'nobody@spendly.app', password: 'x' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: HttpStatus.UNAUTHORIZED,
    });
  });

  it('throws INVALID_CREDENTIALS for an OAuth-only account with no password set', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', passwordHash: null } as any);

    await expect(useCase.execute({ email: 'oauth@spendly.app', password: 'x' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('throws INVALID_CREDENTIALS when the password does not match', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', passwordHash: 'hashed' } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute({ email: 'u@spendly.app', password: 'wrong' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('returns a token pair on valid credentials', async () => {
    authRepo.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'u@spendly.app', passwordHash: 'hashed' } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await useCase.execute({ email: 'u@spendly.app', password: 'Passw0rd1' });

    expect(authRepo.createRefreshToken).toHaveBeenCalledWith('u1', 'hash', expect.any(Date));
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.userId).toBe('u1');
  });
});
