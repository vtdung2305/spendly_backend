# Testing Reference

## Testing Pyramid

```
        ╱  E2E  ╲           Few, slow, high confidence
       ╱─────────╲
      ╱Integration ╲        Medium count, medium speed
     ╱───────────────╲
    ╱    Unit Tests    ╲     Many, fast, focused
   ╱─────────────────────╲
```

## File Naming

```
src/modules/orders/usecases/create-order.usecase.ts
src/modules/orders/usecases/create-order.usecase.spec.ts       ← unit test
test/integration/orders/create-order.integration.spec.ts       ← integration
test/e2e/orders.e2e-spec.ts                                    ← e2e
```

## Unit Tests

Test UseCases in isolation. Mock all dependencies.

```typescript
describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepo: jest.Mocked<IOrderRepository>;
  let productRepo: jest.Mocked<IProductRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    orderRepo = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    productRepo = {
      findByIds: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    useCase = new CreateOrderUseCase(orderRepo, productRepo, eventEmitter);
  });

  it('should create an order with valid items', async () => {
    // Arrange
    const input: CreateOrderInput = {
      userId: 'user-1',
      items: [{ productId: 'prod-1', quantity: 2 }],
    };
    const product = ProductEntity.create({ id: 'prod-1', price: 1000, stock: 10 });
    productRepo.findByIds.mockResolvedValue([product]);
    orderRepo.save.mockImplementation(async (order) => order);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalAmount).toBe(2000);
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(orderRepo.save).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'order.created',
      expect.objectContaining({ orderId: result.id }),
    );
  });

  it('should throw when product has insufficient stock', async () => {
    const input = { userId: 'user-1', items: [{ productId: 'prod-1', quantity: 100 }] };
    const product = ProductEntity.create({ id: 'prod-1', price: 1000, stock: 5 });
    productRepo.findByIds.mockResolvedValue([product]);

    await expect(useCase.execute(input)).rejects.toThrow('Insufficient stock');
  });

  it('should throw when product not found', async () => {
    const input = { userId: 'user-1', items: [{ productId: 'nonexistent', quantity: 1 }] };
    productRepo.findByIds.mockResolvedValue([]);

    await expect(useCase.execute(input)).rejects.toThrow('Product not found');
  });
});
```

### What to Unit Test

- Every UseCase: happy path + every error branch
- Domain entities: business methods, state transitions, validation
- Utility functions: parsers, formatters, calculators

### What NOT to Unit Test

- Controllers (test via integration/e2e instead)
- Prisma queries (test via integration with real DB)
- Simple getters/setters with no logic

## Integration Tests

Test a module's stack against a real database (Docker PostgreSQL).

```typescript
describe('OrderRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: OrderPrismaRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [OrderPrismaRepository],
    }).compile();

    prisma = module.get(PrismaService);
    repo = module.get(OrderPrismaRepository);
  });

  beforeEach(async () => {
    // Clean tables in dependency order
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should soft-delete and exclude from findMany', async () => {
    const user = await createTestUser(prisma);
    const order = await createTestOrder(prisma, user.id);

    await repo.softDelete(order.id);

    const found = await repo.findById(order.id);
    expect(found).toBeNull();

    const all = await repo.findMany({ userId: user.id });
    expect(all).toHaveLength(0);
  });

  it('should handle cursor pagination correctly', async () => {
    const user = await createTestUser(prisma);
    await createTestOrders(prisma, user.id, 25);

    const page1 = await repo.findMany({ userId: user.id, limit: 10 });
    expect(page1.data).toHaveLength(10);
    expect(page1.meta.hasMore).toBe(true);

    const page2 = await repo.findMany({
      userId: user.id,
      limit: 10,
      cursor: page1.meta.cursor,
    });
    expect(page2.data).toHaveLength(10);

    // No overlap
    const ids1 = page1.data.map(o => o.id);
    const ids2 = page2.data.map(o => o.id);
    expect(ids1).not.toEqual(expect.arrayContaining(ids2));
  });
});
```

### Test Database Setup

Use `docker-compose.test.yml` with a dedicated test database:

```yaml
services:
  test-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # RAM disk for speed
```

Run migrations before tests:
```bash
DATABASE_URL="postgresql://test:test@localhost:5433/test_db" npx prisma migrate deploy
```

## E2E Tests

Test the full HTTP flow against a running app:

```typescript
describe('Orders API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    configureApp(app); // apply the same pipes, interceptors, etc.
    await app.init();

    // Create test user and get auth token
    authToken = await getTestAuthToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/orders', () => {
    it('should create an order and return 201', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [{ productId: 'prod-1', quantity: 2 }] })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('PENDING');
          expect(res.body.data.totalAmount).toBeDefined();
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ items: [{ productId: 'prod-1', quantity: 2 }] })
        .expect(401);
    });

    it('should return 400 for invalid input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [] })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
  });
});
```

## Coverage Rules

```json
// jest.config.ts
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.module.ts",
    "!src/**/*.dto.ts",
    "!src/**/*.entity.ts",
    "!src/main.ts",
    "!src/**/*.interface.ts"
  ]
}
```

## Test Utilities

Create `test/helpers/` with:
- `test-factory.ts` — functions to create test entities with sensible defaults
- `test-auth.ts` — helper to generate test JWT tokens
- `test-db.ts` — database cleanup and seeding utilities

```typescript
// test/helpers/test-factory.ts
export function createTestOrderInput(overrides?: Partial<CreateOrderInput>): CreateOrderInput {
  return {
    userId: 'test-user-id',
    items: [{ productId: 'test-product-id', quantity: 1 }],
    ...overrides,
  };
}
```
