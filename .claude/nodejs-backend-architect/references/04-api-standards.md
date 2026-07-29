# API Standards Reference

## Response Envelope

Every response uses a standard envelope. No exceptions.

```typescript
// Success
{
  "success": true,
  "data": { ... },           // single object or array
  "meta": {                  // present for list endpoints
    "cursor": "eyJpZCI6...",
    "hasMore": true,
    "total": 1234            // only if explicitly requested via ?includeTotal=true
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",        // machine-readable, SCREAMING_SNAKE
    "message": "Order not found",      // human-readable
    "details": [ ... ]                 // validation errors, optional
  }
}
```

Implement via `TransformInterceptor`:

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data?.data ?? data,
        meta: data?.meta ?? undefined,
      })),
    );
  }
}
```

## Versioning

URL-based: `/api/v1/orders`, `/api/v2/orders`.

Rules:
- v1 is the default and initial version
- Increment major version only for breaking changes (removed fields, changed semantics)
- Adding new optional fields is NOT a breaking change — no version bump needed
- Deprecated versions run for minimum 6 months with a `Sunset` response header
- Version is in the URL prefix, not in headers (simpler for frontend teams)

## Cursor Pagination (default)

```typescript
// Request
GET /api/v1/orders?limit=20&cursor=eyJpZCI6ImFiYzEyMyJ9&sort=createdAt:desc

// Query DTO
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;             // Base64-encoded { id, sortValue }

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Matches(/^[a-zA-Z]+:(asc|desc)$/)
  sort?: string = 'createdAt:desc';
}
```

Cursor encoding:
```typescript
encodeCursor(record: { id: string; createdAt: Date }): string {
  return Buffer.from(JSON.stringify({
    id: record.id,
    v: record.createdAt.toISOString(),
  })).toString('base64url');
}

decodeCursor(cursor: string): { id: string; v: string } {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString());
}
```

Why cursor over offset:
- Stable across inserts/deletes (offset shifts when rows are added)
- Performs better on large tables (no OFFSET scan)
- Required for infinite scroll UIs

Use offset pagination ONLY for admin backoffice with known-small datasets where page
numbers are a UX requirement.

## Filtering

Use query parameters with explicit operators:

```
GET /api/v1/products?status=ACTIVE&priceMin=10&priceMax=100&categoryId=abc
```

For complex filters, accept a `filter` JSON parameter (URL-encoded):

```
GET /api/v1/products?filter={"status":["ACTIVE","DRAFT"],"price":{"gte":10,"lte":100}}
```

Always validate and whitelist filterable fields. Never pass raw filter input to Prisma.

## Sorting

```
GET /api/v1/products?sort=price:asc,createdAt:desc
```

- Whitelist sortable fields per endpoint
- Default sort is always `createdAt:desc` unless the domain has a more natural default
- Multi-field sorting: comma-separated, applied in order

## Search

For simple text search:
```
GET /api/v1/products?search=wireless+headphones
```

Implementation options (in order of complexity):
1. `ILIKE` with `%term%` — fine for <100K rows
2. PostgreSQL `tsvector` + `tsquery` — good for most cases
3. Elasticsearch/Meilisearch — when you need facets, typo tolerance, relevance tuning

## Batch Operations

For operations on multiple resources:

```
POST /api/v1/orders/batch
{
  "action": "cancel",
  "ids": ["id1", "id2", "id3"]
}

// Response: partial success
{
  "success": true,
  "data": {
    "succeeded": ["id1", "id2"],
    "failed": [
      { "id": "id3", "error": { "code": "ORDER_ALREADY_SHIPPED", "message": "..." } }
    ]
  }
}
```

Rules:
- Maximum batch size: 100 items (configurable)
- Return partial results — don't fail the entire batch for one bad item
- Log and alert on batch failure rate > 50%

## File Upload

Use multipart/form-data with a dedicated upload endpoint:

```
POST /api/v1/files/upload
Content-Type: multipart/form-data

// Response
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "url": "https://cdn.example.com/files/file-uuid.jpg",
    "mimeType": "image/jpeg",
    "size": 245000
  }
}
```

Rules:
- Validate MIME type server-side (don't trust `Content-Type` header)
- Enforce file size limits per type (images: 5MB, documents: 20MB, video: 100MB)
- Store metadata in DB, binary in object storage (S3/MinIO)
- Return a file reference ID; associate it with entities via a separate API call

## Idempotency

For POST/PUT/PATCH endpoints that create or modify resources:

```
POST /api/v1/orders
Idempotency-Key: client-generated-uuid

// Server behavior:
// 1. Check Redis for Idempotency-Key
// 2. If found → return cached response
// 3. If not → process request, cache response for 24h, return
```

## Rate Limiting

Use `@nestjs/throttler`:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,       // seconds
      limit: 100,    // requests per ttl window
    }),
  ],
})
```

Per-endpoint overrides for sensitive operations:
- Login: 5 per minute per IP
- Password reset: 3 per hour per email
- File upload: 10 per minute per user

Return `429 Too Many Requests` with `Retry-After` header.

## Error Codes

Define a centralized error code enum:

```typescript
export enum ErrorCode {
  // General
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Domain-specific
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_CANCELLED = 'ORDER_ALREADY_CANCELLED',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
}
```

HTTP status mapping:
- 400: validation errors, bad input
- 401: missing or invalid auth token
- 403: authenticated but not authorized
- 404: resource not found
- 409: conflict (optimistic lock, duplicate)
- 422: business rule violation (insufficient stock, invalid state transition)
- 429: rate limited
- 500: unexpected server error (never expose internals)

## Swagger / OpenAPI

Every controller is decorated for auto-generated docs:

```typescript
@ApiTags('Orders')
@ApiExtraModels(OrderResponseDto, PaginatedResponseDto)
@Controller('api/v1/orders')
export class OrderController {

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateOrderDto) { ... }
}
```

Swagger setup in `main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

## Naming Conventions

| Resource | Convention | Example |
|----------|-----------|---------|
| URL path | kebab-case, plural nouns | `/api/v1/order-items` |
| Query params | camelCase | `?sortBy=createdAt&includeTotal=true` |
| Request/response body | camelCase | `{ "firstName": "John" }` |
| Error codes | SCREAMING_SNAKE | `ORDER_NOT_FOUND` |
| Headers | Kebab-Case | `Idempotency-Key`, `X-Request-Id` |
