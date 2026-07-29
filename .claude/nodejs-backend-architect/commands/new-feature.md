# /new-feature

Implement a complete feature module following the approved design.

## Trigger
User says: "implement X", "build the orders module", "code feature Y", "new-feature".

## Prerequisites
Phase A design must be approved. If not, run `/analyze-spec` first.

## Workflow

1. Read ALL relevant references:
   - `references/02-architecture.md` (layers, folder structure)
   - `references/03-database.md` (schema conventions)
   - `references/04-api-standards.md` (endpoint patterns)
   - `references/05-security.md` (auth, validation)
2. Reference the example: `assets/examples/orders-module/`
3. Generate files in this order:
   a. **Prisma schema** additions (model + indexes + relations)
   b. **Domain entity** (plain TS, business methods, fromPrisma mapper)
   c. **Repository interface** (port with Symbol token)
   d. **Repository implementation** (Prisma adapter, soft delete, cursor pagination)
   e. **DTOs** (create, update, query — with class-validator)
   f. **UseCases** (one per business operation)
   g. **Controller** (Swagger decorators, guards, ParseUUIDPipe)
   h. **Module** (wiring DI, imports, exports)
   i. **Unit tests** for UseCases
4. Update `docs/api-capability-registry.md` with new capabilities
5. Remind user to run:
   - `npx prisma migrate dev --name add_<module>_table`
   - `npm run verify:layers`
   - `npm run verify:api`

## Quality Checks Before Output
- No Prisma in controllers
- No HTTP concepts in usecases
- No cross-module repository imports
- All endpoints have @ApiOperation + @ApiResponse
- All DTOs have validation decorators
- Row-level security in repository queries
