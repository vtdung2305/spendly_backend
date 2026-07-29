import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './repositories/categories.repository';
import { ListCategoriesUseCase } from './usecases/list-categories.usecase';
import { GetCategoryUseCase } from './usecases/get-category.usecase';
import { CreateCategoryUseCase } from './usecases/create-category.usecase';
import { UpdateCategoryUseCase } from './usecases/update-category.usecase';
import { DeleteCategoryUseCase } from './usecases/delete-category.usecase';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesRepository,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
})
export class CategoriesModule {}
