# Security Reference

## Authentication: JWT + Refresh Token Rotation

### Token Pair

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 min | Memory (frontend) | API authorization |
| Refresh Token | 7 days | HttpOnly cookie | Obtain new access token |

### Refresh Token Rotation

Every time a refresh token is used, issue a NEW refresh token and invalidate the old one.
This limits the window of a stolen refresh token.

```typescript
@Injectable()
export class AuthService {
  async refreshTokens(oldRefreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefreshToken(oldRefreshToken);

    // Check if token has been used (replay detection)
    const stored = await this.tokenRepo.findByToken(oldRefreshToken);
    if (!stored || stored.usedAt) {
      // Token reuse detected — revoke ALL tokens for this user
      await this.tokenRepo.revokeAllForUser(payload.sub);
      throw new UnauthorizedException('Token reuse detected');
    }

    // Mark old token as used
    await this.tokenRepo.markUsed(oldRefreshToken);

    // Issue new pair
    const user = await this.userRepo.findById(payload.sub);
    return this.generateTokenPair(user);
  }
}
```

### JWT Payload (minimal)

```typescript
{
  sub: "user-uuid",          // user ID
  roles: ["ADMIN"],          // role names
  iat: 1700000000,
  exp: 1700000900            // 15 min
}
```

Never put sensitive data (email, PII) in the JWT — it's base64, not encrypted.

## RBAC (Role-Based Access Control)

### Roles Table

```prisma
model Role {
  id          String       @id @default(uuid())
  name        String       @unique           // ADMIN, OPERATOR, CUSTOMER
  permissions Permission[]
  users       UserRole[]
  @@map("roles")
}

model Permission {
  id       String @id @default(uuid())
  action   String // create, read, update, delete
  resource String // orders, products, users
  roleId   String @map("role_id")
  role     Role   @relation(fields: [roleId], references: [id])

  @@unique([action, resource, roleId])
  @@map("permissions")
}
```

### Guard Implementation

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles.includes(role));
  }
}

// Usage
@Roles('ADMIN', 'OPERATOR')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin/orders')
async listAllOrders() { ... }
```

### Permission-Based Access (finer grain)

When roles alone aren't enough, check permissions:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<{ action: string; resource: string }>('permission', context.getHandler());
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    return this.permissionService.hasPermission(user.id, required.action, required.resource);
  }
}

// Usage
@RequirePermission({ action: 'delete', resource: 'orders' })
@Delete(':id')
async deleteOrder() { ... }
```

## Row-Level Security

For resources that belong to a user, always filter by ownership in the repository:

```typescript
async findByIdForUser(id: string, userId: string): Promise<OrderEntity | null> {
  const record = await this.prisma.order.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return record ? OrderEntity.fromPrisma(record) : null;
}
```

Admin endpoints use `findById` without user filter. Customer endpoints ALWAYS use
`findByIdForUser`. This is a repository-level guarantee, not a controller-level check.

## Input Validation (OWASP)

### class-validator Rules

```typescript
export class CreateOrderDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(9999)
  quantity: number;

  @IsString()
  @MaxLength(500)
  @Matches(/^[a-zA-Z0-9\s.,'-]+$/)  // no special chars
  shippingNote?: string;
}
```

### Global Validation Pipe

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strip unknown properties
  forbidNonWhitelisted: true, // throw on unknown properties
  transform: true,            // auto-transform types
  transformOptions: {
    enableImplicitConversion: false, // explicit typing only
  },
}));
```

### SQL Injection Prevention

Prisma parameterizes all queries by default. For raw queries, ALWAYS use parameterized:

```typescript
// SAFE
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// DANGEROUS — never do this
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

### XSS Prevention

- Sanitize HTML input with `sanitize-html` before storage
- NestJS + React/Vue frontends: framework auto-escapes output
- Set `Content-Type: application/json` on all API responses
- Use Helmet for security headers

## Security Headers (Helmet)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

## CORS

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400,
});
```

## Secrets Management

- Never commit secrets to git
- Use environment variables loaded from `.env` (local) or secret manager (prod)
- Validate all required env vars at startup with `@nestjs/config` + Joi schema
- Rotate secrets on a schedule; JWT signing keys at least every 90 days
- Use `@nestjs/config`'s `ConfigService` — never access `process.env` directly in services

```typescript
// config validation schema
const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  ALLOWED_ORIGINS: Joi.string().required(),
});
```

## Audit Logging

Log every security-sensitive operation:

```typescript
@Injectable()
export class AuditService {
  async log(entry: {
    action: string;        // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PERMISSION_CHANGE
    userId: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({ data: entry });
  }
}
```

Audit log is append-only. Never update or delete audit records.

## Sensitive Data Protection

- Hash passwords with `bcrypt` (cost factor 12)
- Encrypt PII at rest if compliance requires it (AES-256-GCM)
- Mask sensitive fields in logs (email → `j***@example.com`)
- Never return password hashes, tokens, or internal IDs in API responses
- Implement data retention policies: auto-purge after N days for transient data
