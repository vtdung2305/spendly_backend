import { NotFoundException } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { DeleteCategoryUseCase } from './delete-category.usecase';
import { CategoriesRepository } from '../repositories/categories.repository';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let repo: jest.Mocked<CategoriesRepository>;

  beforeEach(() => {
    repo = {
      findByIdForUser: jest.fn(),
      findDefaultForUser: jest.fn(),
      deleteAndReassign: jest.fn(),
    } as any;

    useCase = new DeleteCategoryUseCase(repo);
  });

  it('throws NotFoundException when the category does not belong to the user', async () => {
    repo.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute('cat-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses to delete the default "Khác" category', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'cat-1', isDefault: true, type: CategoryType.EXPENSE } as any);

    await expect(useCase.execute('cat-1', 'user-1')).rejects.toMatchObject({
      code: 'DEFAULT_CATEGORY_CANNOT_BE_DELETED',
    });
    expect(repo.deleteAndReassign).not.toHaveBeenCalled();
  });

  it('throws DEFAULT_CATEGORY_MISSING if the fallback category was somehow removed', async () => {
    repo.findByIdForUser.mockResolvedValue({ id: 'cat-1', isDefault: false, type: CategoryType.EXPENSE } as any);
    repo.findDefaultForUser.mockResolvedValue(null);

    await expect(useCase.execute('cat-1', 'user-1')).rejects.toMatchObject({ code: 'DEFAULT_CATEGORY_MISSING' });
  });

  it('reassigns transactions/budgets to the fallback category and deletes on success', async () => {
    const category = { id: 'cat-1', isDefault: false, type: CategoryType.EXPENSE };
    repo.findByIdForUser.mockResolvedValue(category as any);
    repo.findDefaultForUser.mockResolvedValue({ id: 'fallback-cat' } as any);

    await useCase.execute('cat-1', 'user-1');

    expect(repo.deleteAndReassign).toHaveBeenCalledWith(category, 'fallback-cat');
  });
});
