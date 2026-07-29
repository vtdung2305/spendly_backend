# /generate-tests

Generate unit, integration, or e2e tests for a module or specific file.

## Trigger
User says: "write tests for X", "generate tests", "test the orders module", "generate-tests".

## Workflow

1. Read `references/07-testing.md` for patterns and conventions
2. Identify test scope:
   - **Unit test** → UseCase or Entity (mock all dependencies)
   - **Integration test** → Repository (real DB in Docker)
   - **E2E test** → Controller (full HTTP flow with supertest)
3. For each test file:
   - Follow naming convention: `.spec.ts`, `.integration.spec.ts`, `.e2e-spec.ts`
   - Use Arrange-Act-Assert pattern
   - Cover: happy path + every error branch
   - Include edge cases from the design doc
4. Generate test helpers if needed:
   - `test-factory.ts` for creating test entities
   - `test-auth.ts` for generating test JWT tokens
   - `test-db.ts` for database cleanup

## Quality Checks
- No test pollution (each test cleans up its data)
- Mocks match actual interface signatures
- Assertions are specific (not just `toBeDefined()`)
- Coverage targets: 80% branches, functions, lines, statements
