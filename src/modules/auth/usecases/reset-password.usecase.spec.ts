import * as bcrypt from 'bcrypt';
import { ResetPasswordUseCase } from './reset-password.usecase';
import { AuthRepository } from '../repositories/auth.repository';

jest.mock('bcrypt');

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let authRepo: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepo = {
      findValidPasswordResetToken: jest.fn(),
      updateUserPassword: jest.fn(),
      markPasswordResetTokenUsed: jest.fn(),
      revokeAllRefreshTokensForUser: jest.fn(),
    } as any;

    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

    useCase = new ResetPasswordUseCase(authRepo);
  });

  it('throws INVALID_RESET_TOKEN when no valid token is found', async () => {
    authRepo.findValidPasswordResetToken.mockResolvedValue(null);

    await expect(useCase.execute({ token: 'expired', newPassword: 'Passw0rd1' })).rejects.toMatchObject({
      code: 'INVALID_RESET_TOKEN',
    });
    expect(authRepo.updateUserPassword).not.toHaveBeenCalled();
  });

  it('updates the password, marks the token used, and revokes all sessions on success', async () => {
    authRepo.findValidPasswordResetToken.mockResolvedValue({ id: 'rt1', userId: 'u1' } as any);

    await useCase.execute({ token: 'valid', newPassword: 'Passw0rd1' });

    expect(bcrypt.hash).toHaveBeenCalledWith('Passw0rd1', 12);
    expect(authRepo.updateUserPassword).toHaveBeenCalledWith('u1', 'new-hashed-password');
    expect(authRepo.markPasswordResetTokenUsed).toHaveBeenCalledWith('rt1');
    expect(authRepo.revokeAllRefreshTokensForUser).toHaveBeenCalledWith('u1');
  });
});
