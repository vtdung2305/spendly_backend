# Pull Request Review Checklist

## Architecture
- [ ] Business logic is in UseCases, not controllers or repositories
- [ ] No cross-module repository imports
- [ ] Dependency rule respected (no Prisma in controllers, no HTTP in usecases)
- [ ] New module follows the standard folder structure
- [ ] `npm run verify:layers` passes

## API Design
- [ ] Endpoint registered in capability registry (if new)
- [ ] Swagger decorators on all routes
- [ ] Standard response envelope used
- [ ] Error codes are domain-specific and documented
- [ ] `npm run verify:api` passes

## Security
- [ ] Auth guard applied to protected endpoints
- [ ] Row-level access control in repository queries
- [ ] Input validated with class-validator + whitelist: true
- [ ] No secrets in code or logs
- [ ] Sensitive data masked in logs

## Database
- [ ] Migration is forward-only (no editing deployed migrations)
- [ ] Indexes added for new WHERE/ORDER BY patterns
- [ ] Soft delete filter applied in all repository queries
- [ ] Transactions used for multi-table mutations
- [ ] Audit log written for sensitive operations

## Performance
- [ ] No N+1 queries (check Prisma includes)
- [ ] Cache invalidation if cached data changes
- [ ] Heavy work offloaded to BullMQ
- [ ] No sync blocking operations in request handlers

## Testing
- [ ] Unit tests for all UseCase branches
- [ ] Integration tests for repository queries
- [ ] Coverage above 80%
- [ ] Test data cleaned up after each test

## Code Quality
- [ ] Naming conventions followed
- [ ] No `any` types
- [ ] No commented-out code
- [ ] Descriptive variable and function names
