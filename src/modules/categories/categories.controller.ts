import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { ListCategoriesUseCase } from './usecases/list-categories.usecase';
import { GetCategoryUseCase } from './usecases/get-category.usecase';
import { CreateCategoryUseCase } from './usecases/create-category.usecase';
import { UpdateCategoryUseCase } from './usecases/update-category.usecase';
import { DeleteCategoryUseCase } from './usecases/delete-category.usecase';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List categories, optionally filtered by type' })
  async list(@CurrentUser('id') userId: string, @Query() query: QueryCategoryDto) {
    return this.listCategoriesUseCase.execute(userId, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get category detail with transaction count this month' })
  async get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.getCategoryUseCase.execute(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCategoryDto) {
    return this.createCategoryUseCase.execute(userId, dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Rename or restyle a category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.updateCategoryUseCase.execute(id, userId, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Delete a category; its transactions move to "Khác"' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.deleteCategoryUseCase.execute(id, userId);
    return { deleted: true };
  }
}
