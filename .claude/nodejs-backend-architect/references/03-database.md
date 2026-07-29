# Database Standards Reference

## Schema Conventions

### Naming
- Tables: plural snake_case (`order_items`, `user_addresses`)
- Columns: snake_case (`created_at`, `total_amount`)
- Primary keys: `id` (UUID v4, `@default(uuid())` in Prisma)
- Foreign keys: `<singular_table>_id` (`user_id`, `order_id`)
- Indexes: `idx_<table>_<columns>` (`idx_orders_user_id_status`)
- Unique constraints: `uq_<table>_<columns>`

### Mandatory Columns (every table)

```prisma
model Example {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")      // soft delete
  createdBy String?  @map("created_by")        // user ID
  updatedBy String?  @map("updated_by")        // user ID

  @@map("examples")
}
```

### Soft Delete

Every query in every repository MUST include `where: { deletedAt: null }` unless explicitly
fetching archived records. Create a Prisma middleware or extension to enforce this:

```typescript
// prisma.extension.ts
export const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
```

### Enums

Use Prisma enums for closed sets that rarely change. Use a lookup table for values that
admins can modify at runtime.

```prisma
enum OrderStatus {
  DRAFT
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

## Index Strategy

### When to Add an Index

| Pattern | Index type |
|---------|------------|
| Foreign key column | B-tree (automatic in some DBs, explicit in Prisma) |
| `WHERE status = ?` | B-tree on status |
| `WHERE status = ? AND created_at > ?` | Composite (status, created_at) |
| `WHERE email = ?` (unique) | Unique index |
| Full-text search | GIN with `pg_trgm` or `tsvector` |
| JSON field queries | GIN on JSONB column |
| Cursor pagination (`WHERE id > ? ORDER BY id`) | Primary key covers it |
| Cursor pagination (`WHERE created_at > ? ORDER BY created_at, id`) | Composite (created_at, id) |

### When NOT to Index

- Columns with very low cardinality on small tables (boolean flags on <10K rows)
- Tables that are write-heavy with few reads
- Columns never used in WHERE, ORDER BY, or JOIN

### Prisma Index Syntax

```prisma
model Order {
  // ...
  @@index([userId, status], map: "idx_orders_user_id_status")
  @@index([createdAt, id], map: "idx_orders_cursor_pagination")
  @@index([deletedAt], map: "idx_orders_soft_delete")
}
```

## Transactions

Use Prisma interactive transactions for multi-step operations:

```typescript
async createOrderWithItems(data: CreateOrderInput): Promise<OrderEntity> {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.create({ data: orderData });
    const items = await Promise.all(
      data.items.map(item => tx.orderItem.create({ data: { ...item, orderId: order.id } }))
    );
    await tx.product.updateMany({
      where: { id: { in: data.items.map(i => i.productId) } },
      data: { /* decrement stock */ },
    });
    return OrderEntity.fromPrisma({ ...order, items });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    timeout: 10000,
  });
}
```

Rules:
- Always set `isolationLevel` explicitly
- Always set a `timeout`
- Keep transactions as short as possible — no external API calls inside transactions
- If you need to call an external service, do it after the transaction commits, with compensation on failure

## Optimistic Locking

For entities with concurrent edit risk (orders, inventory):

```prisma
model Order {
  version Int @default(1)
  // ...
}
```

```typescript
async update(id: string, data: UpdateOrderInput, expectedVersion: number): Promise<OrderEntity> {
  const result = await this.prisma.order.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  if (result.count === 0) {
    throw new ConflictException('Order was modified by another request');
  }
  return this.findById(id);
}
```

## Audit Log

For sensitive operations, write to a dedicated audit table:

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  tableName String   @map("table_name")
  recordId  String   @map("record_id")
  action    String   // CREATE | UPDATE | DELETE
  changes   Json?    // { field: { old, new } }
  userId    String   @map("user_id")
  ipAddress String?  @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([tableName, recordId], map: "idx_audit_log_table_record")
  @@index([userId], map: "idx_audit_log_user_id")
  @@map("audit_logs")
}
```

## Migration Strategy

- Never edit a deployed migration file
- Each migration is a forward-only step
- For breaking changes, use expand-contract pattern:
  1. Add new column (nullable or with default)
  2. Deploy code that writes to both old and new columns
  3. Backfill new column
  4. Deploy code that reads only from new column
  5. Drop old column in a later migration
- Name migrations descriptively: `20240115_add_order_status_index`
- Seed data lives in `prisma/seed.ts`, separate from migrations

## Connection Pool

```typescript
// database.config.ts
export const databaseConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Prisma connection pool
  // Rule of thumb: pool_size = (num_cores * 2) + disk_spindles
  // For serverless: keep pool small (2-5)
  // For dedicated server: 10-20
};
```

Set `connection_limit` in the DATABASE_URL query string:
```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10
```

## Read/Write Separation (when needed)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")         // primary (writes)
  // Read replicas configured at infrastructure level
}
```

At application level, use a `ReadOnlyPrismaService` pointing to the replica URL for
heavy read queries (reports, analytics, search). Keep transactional writes on primary.

## Multi-tenancy (when needed)

Prefer **row-level** tenancy with a `tenantId` column and a Prisma middleware that
auto-filters. Schema-level tenancy (one schema per tenant) is operationally expensive
and only justified at very high scale with strict data isolation requirements.

```typescript
// tenant.middleware.ts
prisma.$use(async (params, next) => {
  const tenantId = AsyncLocalStorage.getStore()?.tenantId;
  if (tenantId && params.model) {
    params.args.where = { ...params.args.where, tenantId };
  }
  return next(params);
});
```

## Partitioning (when needed)

Consider native PostgreSQL partitioning when:
- A table exceeds 100M rows
- Queries consistently filter on the partition key (e.g., `created_at` for time-series)
- You need to DROP old partitions for data retention

Prisma doesn't directly support partitioned tables — manage partitioning via raw SQL
migrations and ensure Prisma queries always include the partition key in WHERE clauses.
