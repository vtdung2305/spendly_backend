# Conventions & Team Collaboration Reference

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| File names | kebab-case | `create-order.usecase.ts` |
| Classes | PascalCase | `CreateOrderUseCase` |
| Interfaces | PascalCase, prefix `I` for ports | `IOrderRepository` |
| Variables, functions | camelCase | `orderTotal`, `calculateDiscount()` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_ATTEMPTS` |
| Enums | PascalCase name, SCREAMING_SNAKE values | `OrderStatus.PENDING` |
| DB tables | plural snake_case | `order_items` |
| DB columns | snake_case | `created_at` |
| API paths | kebab-case plural | `/api/v1/order-items` |
| Environment vars | SCREAMING_SNAKE | `DATABASE_URL` |
| DI tokens | Symbol, SCREAMING_SNAKE | `ORDER_REPOSITORY` |

## File Suffixes

| Suffix | Purpose |
|--------|---------|
| `.controller.ts` | HTTP controller |
| `.usecase.ts` | Business logic |
| `.repository.ts` | Data access |
| `.entity.ts` | Domain entity |
| `.dto.ts` | Data transfer object |
| `.guard.ts` | Authorization guard |
| `.interceptor.ts` | Request/response interceptor |
| `.filter.ts` | Exception filter |
| `.pipe.ts` | Validation pipe |
| `.service.ts` | Shared infrastructure service |
| `.module.ts` | NestJS module |
| `.spec.ts` | Unit test |
| `.integration.spec.ts` | Integration test |
| `.e2e-spec.ts` | End-to-end test |

## Git Flow

### Branch Strategy

```
main          ← production-ready, tagged releases
  └── develop ← integration branch, always deployable to staging
       ├── feature/ORD-123-create-order-api
       ├── feature/USR-456-user-profile
       ├── bugfix/ORD-789-fix-total-calc
       └── hotfix/SEC-001-patch-auth-bypass  (branches from main)
```

Rules:
- `main` is protected: merge only via PR with approvals
- `develop` is the integration target for feature branches
- Feature branches: `feature/<ticket-id>-<short-description>`
- Bugfix branches: `bugfix/<ticket-id>-<short-description>`
- Hotfix branches: `hotfix/<ticket-id>-<description>` (branch from `main`, merge to `main` AND `develop`)
- Delete branch after merge

### Commit Convention (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation only
- `refactor`: code change that neither fixes a bug nor adds a feature
- `perf`: performance improvement
- `test`: adding or correcting tests
- `chore`: build process, CI, dependencies
- `ci`: CI/CD changes

Examples:
```
feat(orders): add cursor pagination to list orders API
fix(auth): prevent refresh token reuse after rotation
refactor(products): extract price calculation to value object
perf(orders): add composite index for user+status queries
test(orders): add integration tests for soft delete
chore(deps): upgrade prisma to 5.x
```

### Husky + lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx commitlint --edit $1
```

## Pull Request Template

```markdown
<!-- .github/pull_request_template.md -->

## Summary
<!-- What does this PR do? Link the ticket. -->

Closes #<ticket-number>

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Performance
- [ ] Documentation
- [ ] Infrastructure

## Changes
<!-- List the key changes -->

## API Changes
<!-- New/modified endpoints. Include request/response examples if applicable. -->

## Database Changes
<!-- New migrations, schema changes, index additions -->

## Testing
<!-- How was this tested? -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing done
- [ ] Test coverage maintained above 80%

## Checklist
- [ ] Code follows naming conventions
- [ ] Business logic is in UseCases only
- [ ] No Prisma imports in controllers
- [ ] DTOs validate all input
- [ ] Error codes are documented
- [ ] Swagger decorators added
- [ ] No secrets in code
- [ ] Capability registry updated (if new endpoint)
- [ ] Migration is forward-only and non-breaking
```

## Code Review Checklist

When reviewing a PR, check:

**Architecture**
- Business logic is in UseCase, not controller or repository
- No cross-module repository imports
- Dependency rule is respected (inner layers don't import outer)
- New endpoints are registered in the capability registry

**Security**
- Input validated with class-validator
- Row-level access control in repository queries
- No secrets logged or returned in responses
- Auth guard applied to protected endpoints

**Database**
- Migration is non-breaking (expand-contract for breaking changes)
- Indexes added for new query patterns
- Soft delete filter applied
- Transactions used for multi-table writes

**Performance**
- No N+1 queries (check includes/batching)
- Cache invalidation if cached data is modified
- Heavy operations offloaded to queue

**Testing**
- Happy path + error paths tested
- Edge cases covered
- No test pollution (each test cleans up)

## Release Checklist

```markdown
## Pre-release
- [ ] All PRs merged to develop
- [ ] Integration tests pass on develop
- [ ] Staging deployment verified
- [ ] Database migration tested on staging
- [ ] Performance regression check
- [ ] Security scan passed
- [ ] API documentation updated
- [ ] CHANGELOG updated

## Release
- [ ] Create release branch from develop
- [ ] Version bump in package.json
- [ ] Merge release branch to main
- [ ] Tag the release (v1.2.3)
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates for 30 minutes

## Post-release
- [ ] Merge main back to develop
- [ ] Close related tickets
- [ ] Notify stakeholders
- [ ] Update ADR if architectural decisions changed
```

## ADR (Architecture Decision Record)

Store in `docs/adr/` with sequential numbering.

See `assets/templates/adr-template.md` for the template.

## Onboarding

New team members should:
1. Read the README (project overview, setup instructions)
2. Read this conventions document
3. Read `docs/api-capability-registry.md` (understand what exists)
4. Read the ADR index (understand why decisions were made)
5. Run the project locally with `docker-compose up`
6. Implement one small feature using the scaffold script
7. Submit a PR and go through the review process

See `docs/onboarding.md` for the detailed guide.
