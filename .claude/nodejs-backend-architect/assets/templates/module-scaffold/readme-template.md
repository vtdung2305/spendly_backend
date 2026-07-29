# {PROJECT_NAME}

{One-line description}

## Tech Stack

- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ
- Docker

## Quick Start

```bash
# Clone and install
git clone {repo-url}
cd {project-name}
cp .env.example .env
npm install

# Start infrastructure
docker-compose up -d db redis

# Run migrations and seed
npm run db:migrate:dev
npm run db:seed

# Start development server
npm run start:dev
```

API docs: http://localhost:3000/docs

## Project Structure

```
src/
├── config/           # Configuration modules
├── common/           # Shared guards, pipes, interceptors, decorators
├── modules/          # Feature modules (one per business domain)
│   ├── auth/
│   ├── users/
│   └── ...
├── prisma/           # Schema, migrations, seed
├── jobs/             # BullMQ queue definitions
└── health/           # Health check endpoints
```

## Development

```bash
npm run start:dev       # Start with hot reload
npm run test            # Unit tests
npm run test:integration # Integration tests (requires Docker DB)
npm run test:e2e        # End-to-end tests
npm run lint            # ESLint
npm run verify:layers   # Architecture layering check
npm run verify:api      # API contract verification
```

## Scaffolding a New Module

```bash
node scripts/scaffold_module.mjs <moduleName> [--with-queue] [--with-guard]
```

## Architecture

See `docs/` for:
- `api-capability-registry.md` — All business capabilities and their endpoints
- `adr/` — Architecture Decision Records

## Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Team

See `docs/onboarding.md` for the new member guide.
