#!/usr/bin/env node

/**
 * scaffold_module.mjs
 *
 * Generates a complete NestJS feature module following the skill's architecture.
 *
 * Usage:
 *   node scripts/scaffold_module.mjs orders
 *   node scripts/scaffold_module.mjs orders --with-queue --with-guard
 *
 * Generates:
 *   src/modules/<name>/
 *     ├── <name>.module.ts
 *     ├── controllers/<name>.controller.ts
 *     ├── dtos/
 *     │   ├── create-<entity>.dto.ts
 *     │   ├── update-<entity>.dto.ts
 *     │   └── query-<entity>.dto.ts
 *     ├── usecases/
 *     │   ├── create-<entity>.usecase.ts
 *     │   ├── get-<entity>.usecase.ts
 *     │   ├── list-<entities>.usecase.ts
 *     │   ├── update-<entity>.usecase.ts
 *     │   └── delete-<entity>.usecase.ts
 *     ├── repositories/
 *     │   ├── <name>.repository.interface.ts
 *     │   └── <name>.prisma-repository.ts
 *     ├── entities/
 *     │   └── <entity>.entity.ts
 *     ├── guards/           (if --with-guard)
 *     │   └── <name>-owner.guard.ts
 *     └── jobs/             (if --with-queue)
 *         └── <name>.processor.ts
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// --- Args ---
const args = process.argv.slice(2);
const moduleName = args.find(a => !a.startsWith('--'));
const withQueue = args.includes('--with-queue');
const withGuard = args.includes('--with-guard');

if (!moduleName) {
  console.error('Usage: node scripts/scaffold_module.mjs <moduleName> [--with-queue] [--with-guard]');
  process.exit(1);
}

// --- Naming helpers ---
const kebab = moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const pascal = kebab.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
const camel = pascal[0].toLowerCase() + pascal.slice(1);
const singular = kebab.endsWith('s') ? kebab.slice(0, -1) : kebab;
const singularPascal = singular.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
const SCREAMING = kebab.toUpperCase().replace(/-/g, '_');

const BASE = join('src', 'modules', kebab);

// --- Templates ---

const moduleTs = `import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './controllers/${kebab}.controller';
import { Create${singularPascal}UseCase } from './usecases/create-${singular}.usecase';
import { Get${singularPascal}UseCase } from './usecases/get-${singular}.usecase';
import { List${pascal}UseCase } from './usecases/list-${kebab}.usecase';
import { Update${singularPascal}UseCase } from './usecases/update-${singular}.usecase';
import { Delete${singularPascal}UseCase } from './usecases/delete-${singular}.usecase';
import { ${SCREAMING}_REPOSITORY } from './repositories/${kebab}.repository.interface';
import { ${pascal}PrismaRepository } from './repositories/${kebab}.prisma-repository';
import { PrismaModule } from '../../prisma/prisma.module';
${withQueue ? `import { BullModule } from '@nestjs/bull';\nimport { ${pascal}Processor } from './jobs/${kebab}.processor';` : ''}

@Module({
  imports: [
    PrismaModule,
    ${withQueue ? `BullModule.registerQueue({ name: '${kebab}' }),` : ''}
  ],
  controllers: [${pascal}Controller],
  providers: [
    { provide: ${SCREAMING}_REPOSITORY, useClass: ${pascal}PrismaRepository },
    Create${singularPascal}UseCase,
    Get${singularPascal}UseCase,
    List${pascal}UseCase,
    Update${singularPascal}UseCase,
    Delete${singularPascal}UseCase,
    ${withQueue ? `${pascal}Processor,` : ''}
  ],
  exports: [
    // Export services here if other modules need to access ${kebab} data
  ],
})
export class ${pascal}Module {}
`;

const controllerTs = `import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Create${singularPascal}Dto } from '../dtos/create-${singular}.dto';
import { Update${singularPascal}Dto } from '../dtos/update-${singular}.dto';
import { Query${singularPascal}Dto } from '../dtos/query-${singular}.dto';
import { Create${singularPascal}UseCase } from '../usecases/create-${singular}.usecase';
import { Get${singularPascal}UseCase } from '../usecases/get-${singular}.usecase';
import { List${pascal}UseCase } from '../usecases/list-${kebab}.usecase';
import { Update${singularPascal}UseCase } from '../usecases/update-${singular}.usecase';
import { Delete${singularPascal}UseCase } from '../usecases/delete-${singular}.usecase';

@ApiTags('${pascal}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/${kebab}')
export class ${pascal}Controller {
  constructor(
    private readonly create${singularPascal}: Create${singularPascal}UseCase,
    private readonly get${singularPascal}: Get${singularPascal}UseCase,
    private readonly list${pascal}: List${pascal}UseCase,
    private readonly update${singularPascal}: Update${singularPascal}UseCase,
    private readonly delete${singularPascal}: Delete${singularPascal}UseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ${singular}' })
  @ApiResponse({ status: 201, description: '${singularPascal} created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: Create${singularPascal}Dto,
  ) {
    return this.create${singularPascal}.execute({ ...dto, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${singular} by ID' })
  @ApiResponse({ status: 200, description: '${singularPascal} found' })
  @ApiResponse({ status: 404, description: '${singularPascal} not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.get${singularPascal}.execute({ id, userId });
  }

  @Get()
  @ApiOperation({ summary: 'List ${kebab} with cursor pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  async findAll(
    @Query() query: Query${singularPascal}Dto,
    @CurrentUser('id') userId: string,
  ) {
    return this.list${pascal}.execute({ ...query, userId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${singular}' })
  @ApiResponse({ status: 200, description: '${singularPascal} updated' })
  @ApiResponse({ status: 404, description: '${singularPascal} not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Update${singularPascal}Dto,
  ) {
    return this.update${singularPascal}.execute({ id, userId, ...dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete ${singular}' })
  @ApiResponse({ status: 200, description: '${singularPascal} deleted' })
  @ApiResponse({ status: 404, description: '${singularPascal} not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.delete${singularPascal}.execute({ id, userId });
  }
}
`;

const createDto = `import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Create${singularPascal}Dto {
  @ApiProperty({ description: 'Name of the ${singular}' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // TODO: Add domain-specific fields
}
`;

const updateDto = `import { PartialType } from '@nestjs/swagger';
import { Create${singularPascal}Dto } from './create-${singular}.dto';

export class Update${singularPascal}Dto extends PartialType(Create${singularPascal}Dto) {}
`;

const queryDto = `import { IsOptional, IsString, IsInt, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class Query${singularPascal}Dto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt:desc' })
  @IsOptional()
  @Matches(/^[a-zA-Z]+:(asc|desc)$/)
  sort?: string = 'createdAt:desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
`;

const repoInterface = `import { ${singularPascal}Entity } from '../entities/${singular}.entity';

export const ${SCREAMING}_REPOSITORY = Symbol('${SCREAMING}_REPOSITORY');

export interface I${pascal}Repository {
  findById(id: string): Promise<${singularPascal}Entity | null>;
  findByIdForUser(id: string, userId: string): Promise<${singularPascal}Entity | null>;
  findMany(params: {
    userId?: string;
    cursor?: string;
    limit: number;
    sort: string;
    search?: string;
  }): Promise<{ data: ${singularPascal}Entity[]; cursor: string | null; hasMore: boolean }>;
  save(entity: Partial<${singularPascal}Entity>): Promise<${singularPascal}Entity>;
  update(id: string, data: Partial<${singularPascal}Entity>): Promise<${singularPascal}Entity>;
  softDelete(id: string): Promise<void>;
}
`;

const prismaRepo = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { I${pascal}Repository } from './${kebab}.repository.interface';
import { ${singularPascal}Entity } from '../entities/${singular}.entity';

@Injectable()
export class ${pascal}PrismaRepository implements I${pascal}Repository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<${singularPascal}Entity | null> {
    const record = await this.prisma.${camel}.findFirst({
      where: { id, deletedAt: null },
    });
    return record ? ${singularPascal}Entity.fromPrisma(record) : null;
  }

  async findByIdForUser(id: string, userId: string): Promise<${singularPascal}Entity | null> {
    const record = await this.prisma.${camel}.findFirst({
      where: { id, userId, deletedAt: null },
    });
    return record ? ${singularPascal}Entity.fromPrisma(record) : null;
  }

  async findMany(params: {
    userId?: string;
    cursor?: string;
    limit: number;
    sort: string;
    search?: string;
  }): Promise<{ data: ${singularPascal}Entity[]; cursor: string | null; hasMore: boolean }> {
    const { userId, cursor, limit, sort, search } = params;
    const [sortField, sortDir] = sort.split(':');

    const where: any = { deletedAt: null };
    if (userId) where.userId = userId;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    // TODO: Implement cursor decoding/encoding
    const records = await this.prisma.${camel}.findMany({
      where,
      take: limit + 1,
      orderBy: { [sortField]: sortDir },
    });

    const hasMore = records.length > limit;
    const data = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore && data.length > 0
      ? Buffer.from(JSON.stringify({ id: data[data.length - 1].id })).toString('base64url')
      : null;

    return {
      data: data.map(r => ${singularPascal}Entity.fromPrisma(r)),
      cursor: nextCursor,
      hasMore,
    };
  }

  async save(entity: Partial<${singularPascal}Entity>): Promise<${singularPascal}Entity> {
    const record = await this.prisma.${camel}.create({
      data: entity as any, // TODO: map entity fields to Prisma create input
    });
    return ${singularPascal}Entity.fromPrisma(record);
  }

  async update(id: string, data: Partial<${singularPascal}Entity>): Promise<${singularPascal}Entity> {
    const record = await this.prisma.${camel}.update({
      where: { id },
      data: data as any, // TODO: map entity fields to Prisma update input
    });
    return ${singularPascal}Entity.fromPrisma(record);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.${camel}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
`;

const entityTs = `export class ${singularPascal}Entity {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // TODO: Add domain-specific fields and business methods

  static fromPrisma(record: any): ${singularPascal}Entity {
    const entity = new ${singularPascal}Entity();
    Object.assign(entity, record);
    return entity;
  }
}
`;

const createUseCase = `import { Injectable, Inject } from '@nestjs/common';
import { ${SCREAMING}_REPOSITORY, I${pascal}Repository } from '../repositories/${kebab}.repository.interface';
import { ${singularPascal}Entity } from '../entities/${singular}.entity';

export interface Create${singularPascal}Input {
  userId: string;
  name: string;
  description?: string;
}

@Injectable()
export class Create${singularPascal}UseCase {
  constructor(
    @Inject(${SCREAMING}_REPOSITORY) private readonly repo: I${pascal}Repository,
  ) {}

  async execute(input: Create${singularPascal}Input): Promise<${singularPascal}Entity> {
    // TODO: Business validation
    return this.repo.save({
      name: input.name,
      description: input.description,
      userId: input.userId,
    } as Partial<${singularPascal}Entity>);
  }
}
`;

const getUseCase = `import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ${SCREAMING}_REPOSITORY, I${pascal}Repository } from '../repositories/${kebab}.repository.interface';
import { ${singularPascal}Entity } from '../entities/${singular}.entity';

@Injectable()
export class Get${singularPascal}UseCase {
  constructor(
    @Inject(${SCREAMING}_REPOSITORY) private readonly repo: I${pascal}Repository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<${singularPascal}Entity> {
    const entity = await this.repo.findByIdForUser(input.id, input.userId);
    if (!entity) {
      throw new NotFoundException('${singularPascal} not found');
    }
    return entity;
  }
}
`;

const listUseCase = `import { Injectable, Inject } from '@nestjs/common';
import { ${SCREAMING}_REPOSITORY, I${pascal}Repository } from '../repositories/${kebab}.repository.interface';

@Injectable()
export class List${pascal}UseCase {
  constructor(
    @Inject(${SCREAMING}_REPOSITORY) private readonly repo: I${pascal}Repository,
  ) {}

  async execute(input: {
    userId: string;
    cursor?: string;
    limit?: number;
    sort?: string;
    search?: string;
  }) {
    const { data, cursor, hasMore } = await this.repo.findMany({
      userId: input.userId,
      cursor: input.cursor,
      limit: input.limit || 20,
      sort: input.sort || 'createdAt:desc',
      search: input.search,
    });

    return {
      data,
      meta: { cursor, hasMore },
    };
  }
}
`;

const updateUseCase = `import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ${SCREAMING}_REPOSITORY, I${pascal}Repository } from '../repositories/${kebab}.repository.interface';
import { ${singularPascal}Entity } from '../entities/${singular}.entity';

@Injectable()
export class Update${singularPascal}UseCase {
  constructor(
    @Inject(${SCREAMING}_REPOSITORY) private readonly repo: I${pascal}Repository,
  ) {}

  async execute(input: { id: string; userId: string } & Partial<{ name: string; description: string }>): Promise<${singularPascal}Entity> {
    const existing = await this.repo.findByIdForUser(input.id, input.userId);
    if (!existing) {
      throw new NotFoundException('${singularPascal} not found');
    }
    // TODO: Business validation
    const { id, userId, ...updateData } = input;
    return this.repo.update(id, updateData as Partial<${singularPascal}Entity>);
  }
}
`;

const deleteUseCase = `import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ${SCREAMING}_REPOSITORY, I${pascal}Repository } from '../repositories/${kebab}.repository.interface';

@Injectable()
export class Delete${singularPascal}UseCase {
  constructor(
    @Inject(${SCREAMING}_REPOSITORY) private readonly repo: I${pascal}Repository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<void> {
    const existing = await this.repo.findByIdForUser(input.id, input.userId);
    if (!existing) {
      throw new NotFoundException('${singularPascal} not found');
    }
    // TODO: Business rules (can this be deleted?)
    await this.repo.softDelete(input.id);
  }
}
`;

const guardTs = `import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Verifies the current user owns the ${singular} being accessed.
 * Apply to routes where row-level ownership check is needed beyond RBAC.
 */
@Injectable()
export class ${pascal}OwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const resourceUserId = request.params?.userId || request.body?.userId;

    if (resourceUserId && resourceUserId !== userId) {
      throw new ForbiddenException('You do not have access to this ${singular}');
    }
    return true;
  }
}
`;

const processorTs = `import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('${kebab}')
export class ${pascal}Processor {
  private readonly logger = new Logger(${pascal}Processor.name);

  @Process('default')
  async handleDefault(job: Job<unknown>) {
    this.logger.log(\`Processing ${kebab} job \${job.id}\`);
    // TODO: Implement job processing
  }
}
`;

// --- Generate ---

async function generate() {
  const dirs = [
    BASE,
    join(BASE, 'controllers'),
    join(BASE, 'dtos'),
    join(BASE, 'usecases'),
    join(BASE, 'repositories'),
    join(BASE, 'entities'),
  ];
  if (withGuard) dirs.push(join(BASE, 'guards'));
  if (withQueue) dirs.push(join(BASE, 'jobs'));

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }

  const files = [
    [join(BASE, `${kebab}.module.ts`), moduleTs],
    [join(BASE, 'controllers', `${kebab}.controller.ts`), controllerTs],
    [join(BASE, 'dtos', `create-${singular}.dto.ts`), createDto],
    [join(BASE, 'dtos', `update-${singular}.dto.ts`), updateDto],
    [join(BASE, 'dtos', `query-${singular}.dto.ts`), queryDto],
    [join(BASE, 'repositories', `${kebab}.repository.interface.ts`), repoInterface],
    [join(BASE, 'repositories', `${kebab}.prisma-repository.ts`), prismaRepo],
    [join(BASE, 'entities', `${singular}.entity.ts`), entityTs],
    [join(BASE, 'usecases', `create-${singular}.usecase.ts`), createUseCase],
    [join(BASE, 'usecases', `get-${singular}.usecase.ts`), getUseCase],
    [join(BASE, 'usecases', `list-${kebab}.usecase.ts`), listUseCase],
    [join(BASE, 'usecases', `update-${singular}.usecase.ts`), updateUseCase],
    [join(BASE, 'usecases', `delete-${singular}.usecase.ts`), deleteUseCase],
  ];

  if (withGuard) files.push([join(BASE, 'guards', `${kebab}-owner.guard.ts`), guardTs]);
  if (withQueue) files.push([join(BASE, 'jobs', `${kebab}.processor.ts`), processorTs]);

  for (const [path, content] of files) {
    await writeFile(path, content, 'utf-8');
  }

  console.log(`\n✅ Module "${kebab}" scaffolded at ${BASE}/`);
  console.log(`\n   Files created:`);
  for (const [path] of files) {
    console.log(`     ${path}`);
  }
  console.log(`\n   Next steps:`);
  console.log(`   1. Add ${pascal}Module to app.module.ts imports`);
  console.log(`   2. Add the Prisma model to schema.prisma`);
  console.log(`   3. Run: npx prisma migrate dev --name add_${kebab}_table`);
  console.log(`   4. Update entity fromPrisma() mapping`);
  console.log(`   5. Register in docs/api-capability-registry.md`);
}

generate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
