# Onboarding Guide

Welcome! This guide gets you productive in the backend codebase within your first week.

## Day 1: Setup & Orientation

### Environment Setup
1. Install Node.js 20 LTS, Docker, and your preferred editor (VS Code recommended)
2. Clone the repo and run `cp .env.example .env`
3. Run `npm install`
4. Start infrastructure: `docker-compose up -d db redis`
5. Run migrations: `npm run db:migrate:dev`
6. Seed development data: `npm run db:seed`
7. Start the dev server: `npm run start:dev`
8. Open API docs at http://localhost:3000/docs

### Read These Documents
- This onboarding guide (you're here)
- `docs/api-capability-registry.md` — understand what the system can do
- The skill's `references/02-architecture.md` — understand the layer rules
- `docs/adr/` — understand why past decisions were made

## Day 2-3: Understand the Architecture

### Key Rules
- **Business logic** lives in `usecases/` — never in controllers or repositories
- **Controllers** only parse HTTP and call one UseCase
- **Repositories** only access data — they map Prisma models to domain entities
- **Entities** are plain TypeScript — no decorators, no framework imports
- **Modules are isolated** — no cross-module repository imports

### Explore a Module
Pick any module in `src/modules/` and trace a request through:
1. Controller receives HTTP request → DTO validates input
2. Controller calls UseCase
3. UseCase applies business rules → calls Repository
4. Repository queries Prisma → maps to Entity → returns
5. TransformInterceptor wraps response in standard envelope

### Run the Verification Scripts
```bash
npm run verify:layers   # Check architecture rules
npm run verify:api      # Check API contract conformance
```

## Day 4-5: Your First Feature

### Scaffold a Practice Module
```bash
node scripts/scaffold_module.mjs practice-items
```

This generates a complete module skeleton. Walk through every generated file to understand the patterns.

### Submit Your First PR
1. Create a branch: `git checkout -b feature/onboarding-practice`
2. Make a small change (add a field to a DTO, add a test)
3. Run checks: `npm run lint && npm run test && npm run verify:layers`
4. Open a PR using the template in `.github/pull_request_template.md`
5. Go through the code review process

## Key Conventions

### Naming
- Files: `kebab-case` (`create-order.usecase.ts`)
- Classes: `PascalCase` (`CreateOrderUseCase`)
- DB tables: `plural_snake_case` (`order_items`)

### Git
- Branch: `feature/<ticket>-<description>` or `bugfix/<ticket>-<description>`
- Commit: Conventional Commits (`feat(orders): add cancel endpoint`)
- PR: Use the template, fill in all sections

### Testing
- Unit test every UseCase (happy path + error branches)
- Integration test repository queries against real DB
- Target: 80% coverage

## Getting Help
- Architecture questions → check ADRs first, then ask the tech lead
- "Where does this go?" → check `references/02-architecture.md`
- "Does this API already exist?" → check `docs/api-capability-registry.md`
