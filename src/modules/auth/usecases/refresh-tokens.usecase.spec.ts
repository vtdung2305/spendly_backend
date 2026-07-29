import { RefreshTokensUseCase } from './refresh-tokens.usecase';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from '../services/token.service';

describe('RefreshTokensUseCase', () => {
  let useCase: RefreshTokensUseCase;
  let authRepo: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    authRepo = {
      findRefreshTokenByHash: jest.fn(),
      revokeAllRefreshTokensForUser: jest.fn(),
      markRefreshTokenUsed: jest.fn(),
      findUserById: jest.fn(),
      createRefreshToken: jest.fn(),
    } as any;

    tokenService = {
      hashToken: jest.fn().mockReturnValue('hashed-token'),
      signAccessToken: jest.fn().mockReturnValue('new-access-token'),
      generateRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'new-refresh-token', hash: 'new-hash', expiresAt: new Date('2026-08-05') }),
    } as any;

    useCase = new RefreshTokensUseCase(authRepo, tokenService);
  });

  it('throws INVALID_REFRESH_TOKEN when no matching token exists', async () => {
    authRepo.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(useCase.execute('unknown')).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });

  it('throws INVALID_REFRESH_TOKEN when the token is revoked', async () => {
    authRepo.findRefreshTokenByHash.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      revokedAt: new Date(),
      usedAt: null,
      expiresAt: new Date(Date.now() + 10_000),
    } as any);

    await expect(useCase.execute('token')).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });

  it('throws INVALID_REFRESH_TOKEN when the token is expired', async () => {
    authRepo.findRefreshTokenByHash.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      revokedAt: null,
      usedAt: null,
      expiresAt: new Date(Date.now() - 10_000),
    } as any);

    await expect(useCase.execute('token')).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });

  it('detects replay of an already-used token and revokes the whole chain', async () => {
    authRepo.findRefreshTokenByHash.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      revokedAt: null,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 10_000),
    } as any);

    await expect(useCase.execute('stolen-token')).rejects.toMatchObject({ code: 'TOKEN_REUSE_DETECTED' });
    expect(authRepo.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('u1');
  });

  it('rotates the token and returns a new pair on success', async () => {
    authRepo.findRefreshTokenByHash.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      revokedAt: null,
      usedAt: null,
      expiresAt: new Date(Date.now() + 10_000),
    } as any);
    authRepo.findUserById.mockResolvedValue({ id: 'u1', email: 'u@spendly.app' } as any);

    const result = await useCase.execute('valid-token');

    expect(authRepo.markRefreshTokenUsed).toHaveBeenCalledWith('t1');
    expect(authRepo.createRefreshToken).toHaveBeenCalledWith('u1', 'new-hash', expect.any(Date));
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  it('throws UNAUTHORIZED when the token is valid but the user no longer exists', async () => {
    authRepo.findRefreshTokenByHash.mockResolvedValue({
      id: 't1',
      userId: 'ghost',
      revokedAt: null,
      usedAt: null,
      expiresAt: new Date(Date.now() + 10_000),
    } as any);
    authRepo.findUserById.mockResolvedValue(null);

    await expect(useCase.execute('valid-token')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
