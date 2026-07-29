# /review-pr

Review code for architecture compliance, security, performance, and conventions.

## Trigger
User says: "review this code", "check my PR", "review-pr", or pastes code for review.

## Workflow

1. Load the relevant checklists:
   - `assets/checklists/pr-checklist.md`
   - `assets/checklists/security-checklist.md`
2. Read relevant references for the code being reviewed
3. Check each category:

### Architecture
- Business logic in UseCases only (not controllers or repos)
- Dependency rule: no Prisma in controllers, no HTTP in usecases
- No cross-module repository imports
- Module structure follows convention

### Security
- Auth guard on all protected endpoints
- Row-level access control in repositories
- Input validation with class-validator
- No secrets in code
- Parameterized queries only

### Performance
- No N+1 queries (check Prisma includes)
- Cache invalidation if cached data modified
- Heavy operations in BullMQ jobs
- No sync blocking calls

### Database
- Soft delete filters applied
- Indexes for query patterns
- Transactions for multi-table writes
- Forward-only migrations

### API Standards
- Standard response envelope
- Swagger decorators on all routes
- Error codes documented
- Cursor pagination for lists

### Testing
- Unit tests for all UseCase branches
- Test coverage maintained

## Output Format
Group findings by severity:
- 🔴 **Must fix** — Architecture violation, security issue
- 🟡 **Should fix** — Performance concern, missing test, convention deviation
- 🟢 **Suggestion** — Style improvement, optional optimization
