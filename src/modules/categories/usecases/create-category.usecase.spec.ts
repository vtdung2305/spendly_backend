import { CategoryType } from '@prisma/client';
import { CreateCategoryUseCase } from './create-category.usecase';
import { CategoriesRepository } from '../repositories/categories.repository';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let repo: jest.Mocked<CategoriesRepository>;

  beforeEach(() => {
    repo = {
      findByNameAndType: jest.fn(),
      create: jest.fn(),
    } as any;

    useCase = new CreateCategoryUseCase(repo);
  });

  it('throws CATEGORY_NAME_EXISTS when the name is already used for the same type', async () => {
    repo.findByNameAndType.mockResolvedValue({ id: 'existing' } as any);

    await expect(
      useCase.execute('user-1', { name: 'Ăn uống', color: '#4F46E5', icon: 'restaurant', type: CategoryType.EXPENSE }),
    ).rejects.toMatchObject({ code: 'CATEGORY_NAME_EXISTS' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates the category when the name is free', async () => {
    repo.findByNameAndType.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 'new-cat' } as any);

    const dto = { name: 'Nhà cửa', color: '#0EA5E9', icon: 'home', type: CategoryType.EXPENSE };
    const result = await useCase.execute('user-1', dto);

    expect(repo.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual({ id: 'new-cat' });
  });
});
