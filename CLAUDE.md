# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Spendly backend — personal finance / expense-tracking API. NestJS + Prisma + PostgreSQL + Redis
(BullMQ) + Cloudinary (avatars) + JWT auth with Google/Facebook OAuth.

## Commands

```bash
npm run start:dev          # dev server, watch mode
npm run build               # nest build -> dist/
npm run lint                # eslint --fix over src/apps/libs/test
npm run format               # prettier --write src

npm test                     # unit tests (src/**/*.spec.ts, mocked deps, no DB needed)
npm test -- transactions     # run a subset by path/name match
npx jest path/to/file.spec.ts   # run a single test file directly
npm run test:cov             # unit tests with coverage
npm run test:e2e             # test/app.e2e-spec.ts — needs real Postgres+Redis running

npx prisma migrate dev --name <name>   # create + apply a migration locally
npx prisma migrate deploy               # apply committed migrations (staging/prod, never `dev`)
npx prisma generate                     # regenerate Prisma client after schema changes
npm run prisma:seed                     # seed demo user (dev only — never in production)
```

Docker dev loop: `docker compose up --build` starts `api` (hot reload), `db` (Postgres 16), `redis`.
Swagger UI at `/docs` (non-production only); health check at `/health`.

## Architecture

Layering per request: **Controller → UseCase → Repository (Prisma) → PostgreSQL**.

- Controllers parse HTTP input and call exactly one UseCase; no business logic, no Prisma imports.
- UseCases hold all business logic — one class per operation (e.g. `create-transaction.usecase.ts`).
- Repositories are concrete injectable classes wrapping Prisma directly — **no `I*Repository`
  interface + DI token indirection** (deliberate deviation from the usual ports/adapters template
  in `.claude/nodejs-backend-architect/`: there's a single Prisma implementation and no swap planned).
- Responses are wrapped in a standard envelope by `TransformInterceptor`
  (`{ success, data, meta }` / `{ success: false, error }`); errors go through `HttpExceptionFilter`.

Modules live under `src/modules/*`, one per business domain (`auth`, `users`, `files`, `categories`,
`transactions`, `budgets`, `savings-goals`, `dashboard`, `recurring-transactions`, `notifications`,
`mail`). **Cross-module reads must go through an exported `*QueryService`** (e.g.
`TransactionsQueryService`) — never reach into another module's repository directly. A module's
public surface is only what it lists in `exports: []`.

See `.claude/nodejs-backend-architect/docs/api-capability-registry.md` for the full
endpoint-to-screen mapping, and `README.md` for the per-module responsibility table and the
notable business rules (budget-threshold notifications, recurring-transaction generation,
OTP email verification flow, savings-goal `currentAmount` computed at read time, category
delete reassigning transactions to "Khác").

### API conventions

- All routes are versioned under `/api/v1/...`.
- Cursor-based pagination is the default for list endpoints; offset pagination only for
  small, page-numbered admin views.
- Error codes are machine-readable SCREAMING_SNAKE strings in the envelope's `error.code`.

### Testing conventions

Unit tests (`*.usecase.spec.ts`) live next to the code they cover and mock every dependency —
no database involved. They focus on the highest-risk logic: refresh-token rotation/reuse
detection, password reset, category delete/reassign, budget/savings-goal percent math,
period-range bucketing, cursor encode/decode, dashboard/report aggregations. Trivial
pass-through use-cases (plain list/get/delete, no branching) are intentionally left untested
at the unit level and covered by e2e instead.

The e2e suite (`test/app.e2e-spec.ts`) exercises register → verify-otp → login → protected
route against a real Postgres/Redis, with `MailQueueService` mocked (no SMTP/Cloudinary
credentials needed). Only the auth flow has e2e coverage today — categories/transactions/
budgets/dashboard do not.

## Reference docs

`.claude/nodejs-backend-architect/` contains a generic Node backend architecture skill
(reference docs, checklists, scaffold script). Treat it as background/template material, not
ground truth for this repo — the README documents where this codebase deliberately departs
from it (see the repository-pattern deviation above). `references/10-conventions-collaboration.md`
has the naming conventions and file-suffix table (`.controller.ts`, `.usecase.ts`,
`.repository.ts`, `.dto.ts`, etc.) actually followed here.
