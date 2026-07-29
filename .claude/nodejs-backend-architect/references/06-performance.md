# Performance Reference

## Event Loop Protection

Node.js is single-threaded. Any synchronous CPU-bound work over 50ms blocks all requests.

Rules:
- Never use `fs.readFileSync`, `crypto.pbkdf2Sync`, or any sync variant in request handlers
- Offload CPU-heavy work (PDF generation, image processing, CSV export) to BullMQ jobs
- Use `worker_threads` for computation that MUST be synchronous and > 100ms
- Monitor event loop lag with `monitorEventLoopDelay()` from `perf_hooks`

## N+1 Prevention

The single most common performance bug in ORM-based backends.

Bad (N+1):
```typescript
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}
```

Good (eager load):
```typescript
const orders = await prisma.order.findMany({
  include: { items: true },
});
```

Good (batched manual):
```typescript
const orders = await prisma.order.findMany();
const items = await prisma.orderItem.findMany({
  where: { orderId: { in: orders.map(o => o.id) } },
});
// group items by orderId in memory
```

Rule: Every repository method that returns a list MUST document what relations it includes.
Use Prisma's `include` for 1-2 levels. Beyond that, use a custom query or a DB view.

## Redis Caching Strategy

### Cache Layers

| Layer | TTL | Use case |
|-------|-----|----------|
| Request-scoped | 0 (request lifetime) | Deduplicate repeated reads within one request |
| Short-lived | 30s - 5min | API response cache, session data |
| Medium | 5min - 1hr | Product catalog, user profiles |
| Long | 1hr - 24hr | Configuration, feature flags, static content |

### Cache Patterns

**Cache-aside (default)**:
```typescript
async getProduct(id: string): Promise<ProductEntity> {
  const cached = await this.redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  const product = await this.productRepo.findById(id);
  if (product) {
    await this.redis.set(`product:${id}`, JSON.stringify(product), 'EX', 300);
  }
  return product;
}
```

**Write-through** (for data that must always be fresh):
```typescript
async updateProduct(id: string, data: UpdateInput): Promise<ProductEntity> {
  const updated = await this.productRepo.update(id, data);
  await this.redis.set(`product:${id}`, JSON.stringify(updated), 'EX', 300);
  return updated;
}
```

### Cache Invalidation

- **Single entity**: delete on update/delete
- **List caches**: invalidate on any mutation to the entity type (use a generation counter)
- **Cross-module**: emit a domain event; the caching module listens and invalidates

```typescript
// Generation-based list invalidation
const generation = await this.redis.incr('products:generation');
const cacheKey = `products:list:${generation}:${JSON.stringify(filters)}`;
```

## BullMQ Background Jobs

Use BullMQ for anything that doesn't need a synchronous response:

| Job type | Example | Retry strategy |
|----------|---------|----------------|
| Email sending | Order confirmation | 3 retries, exponential backoff |
| PDF generation | Invoice generation | 2 retries, 30s delay |
| Data export | CSV export | 1 retry, dead letter queue |
| Webhook delivery | Payment notification | 5 retries, exponential with jitter |
| Cleanup | Expired session purge | No retry, scheduled (cron) |

```typescript
// Queue producer (in UseCase)
await this.emailQueue.add('order-confirmation', {
  orderId: order.id,
  userId: order.userId,
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
});

// Queue consumer (processor)
@Processor('email')
export class EmailProcessor {
  @Process('order-confirmation')
  async handleOrderConfirmation(job: Job<OrderConfirmationData>) {
    const { orderId, userId } = job.data;
    // ... send email
  }
}
```

## Connection Pooling

### Prisma

Set in DATABASE_URL: `?connection_limit=10&pool_timeout=10`

Rule of thumb:
- Development: 2-5 connections
- Production (single instance): 10-20
- Production (multiple replicas): total_connections / num_replicas

### Redis

```typescript
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});
```

## Streaming for Large Datasets

Never load a full large dataset into memory:

```typescript
// Export 1M records as CSV
@Get('export')
async exportOrders(@Res() res: Response) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');

  const cursor = this.prisma.order.findMany({
    cursor: undefined,
    take: 1000,
  });

  // Stream in batches of 1000
  let batch = await this.getNextBatch(undefined);
  while (batch.length > 0) {
    for (const record of batch) {
      res.write(this.toCsvRow(record));
    }
    batch = await this.getNextBatch(batch[batch.length - 1].id);
  }
  res.end();
}
```

## Compression

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024, // don't compress responses < 1KB
}));
```

## Horizontal Scaling Checklist

For a stateless, horizontally scalable service:

- [ ] No in-memory state (sessions, caches) — use Redis
- [ ] No local file system writes — use object storage
- [ ] No sticky sessions
- [ ] Database connection pool sized for max replicas
- [ ] BullMQ consumers handle concurrent jobs correctly
- [ ] Health check endpoint responds independently
- [ ] Graceful shutdown: drain connections, finish current requests
- [ ] Idempotent endpoints for safe retries behind load balancer

## Graceful Shutdown

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  process.on('SIGTERM', async () => {
    // Stop accepting new requests
    // Wait for in-flight requests to complete (up to 30s)
    // Close database connections
    // Close Redis connections
    await app.close();
    process.exit(0);
  });
}
```
