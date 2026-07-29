# Spendly Backend

Backend API for **Spendly** — a personal finance / expense-tracking app. Built with
NestJS + Prisma + PostgreSQL, following the design in `.claude/nodejs-backend-architect`
and the API contract designed against `design_handoff_finance_app/`.

## Stack

NestJS · TypeScript · Prisma · PostgreSQL · Redis · MinIO (S3-compatible avatar storage) ·
JWT auth with Google/Facebook OAuth · Docker

## Architecture

Controller → UseCase (business logic) → Repository (Prisma) → PostgreSQL. Modules are
feature-scoped (`src/modules/*`); cross-module reads go through an exported `*QueryService`,
never through another module's repository directly. See `.claude/nodejs-backend-architect/docs/api-capability-registry.md`
for the full endpoint-to-screen mapping.

Deviation from the skill template: repositories are concrete injectable classes (no
`I*Repository` interface + DI token indirection), since there is a single Prisma
implementation and no swap planned. All other layering rules (no Prisma in controllers,
no business logic outside use-cases, soft delete, standard response envelope) are followed
as specified.

## Modules

| Module | Responsibility |
|---|---|
| `auth` | Register, login, Google/Facebook OAuth, refresh token rotation, logout, forgot/reset password |
| `users` | Current user profile + preferences (theme/language/currency/notifications) |
| `files` | Avatar upload to MinIO |
| `categories` | Expense/income category CRUD; deleting a category reassigns its transactions to "Khác" |
| `transactions` | Income/expense CRUD, daily summary (Calendar), period summary (Reports) |
| `budgets` | Monthly per-category budget limits, with `spentAmount`/`usedPercent` computed from transactions |
| `savings-goals` | Yearly savings target; `currentAmount` is computed at read time, never stored |
| `dashboard` | One aggregated `GET /dashboard/summary` endpoint composing the modules above |
| `mail` | SMTP sending (nodemailer) + `emails` BullMQ queue; `auth` enqueues password-reset emails here |

## Getting started (Docker)

```bash
cp .env.example .env
# edit .env: set GOOGLE_CLIENT_ID / FACEBOOK_APP_ID / FACEBOOK_APP_SECRET,
# and SMTP_HOST/SMTP_USER/SMTP_PASS (an Ethereal.email inbox works for local dev)

docker compose up --build
```

This starts `api` (NestJS, hot-reload), `db` (Postgres 16), `redis`, and `minio`
(console at http://localhost:9001, login `spendly` / `spendly12345`).

Run migrations and seed a demo user once the containers are healthy:

```bash
docker compose exec api npx prisma migrate dev --name init
docker compose exec api npm run prisma:seed
```

API docs (Swagger): http://localhost:3000/docs
Health check: http://localhost:3000/health

Demo login after seeding: `demo@spendly.app` / `Passw0rd!`

## Getting started (local, no Docker)

Requires Node 20+, a local Postgres, Redis, and MinIO (or point `.env` at hosted ones).

```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

## Production

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Requires `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`,
`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` plus the usual `.env` vars in the environment.

## OAuth setup notes

- **Google**: create an OAuth 2.0 Client ID (Web or Mobile) in Google Cloud Console;
  the backend verifies the client-supplied Google ID token against `GOOGLE_CLIENT_ID`
  using `google-auth-library`.
- **Facebook**: create a Facebook App; the backend verifies the client-supplied access
  token via the Graph API `debug_token` endpoint using `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET`,
  then fetches the profile. The Facebook app must have the `email` permission approved.

## Email delivery

`POST /api/v1/auth/forgot-password` enqueues a `password-reset` job onto the `emails`
BullMQ queue (Redis-backed) instead of sending inline, so the endpoint returns immediately
regardless of SMTP latency. `MailProcessor` (in `modules/mail`) picks it up, renders
`templates/password-reset.template.ts`, and sends via `MailerService` (nodemailer, generic
SMTP — works with Ethereal, Mailtrap, SendGrid SMTP, SES SMTP, Gmail app-password, etc.).
Failed sends retry 3x with exponential backoff before landing in the dead-letter set.

For local dev without a real inbox: create a free throwaway inbox at
https://ethereal.email and put its host/user/pass into `.env` — every reset email
becomes viewable there instantly.

## Testing

Unit tests live next to the code they cover (`*.usecase.spec.ts`), per
`references/07-testing.md`, and mock every dependency — no database needed:

```bash
npm test              # unit tests (src/**/*.spec.ts)
npm run test:cov      # with coverage
```

Covers the highest-risk business logic: refresh-token rotation + reuse detection,
password reset, category delete/reassign, budget/savings-goal percent math, period-range
bucketing (week/month/year), cursor encode/decode, and the dashboard/report aggregations.
Trivial pass-through use-cases (simple list/get/delete with no branching) are left to the
e2e layer rather than unit-tested for their own sake.

`test/app.e2e-spec.ts` covers the register → login → protected-route flow end-to-end
against a real Postgres/Redis/MinIO:

```bash
docker compose up -d db redis minio
npx prisma migrate deploy
npm run test:e2e
```

## Known follow-ups (not in this pass)

- Only the auth flow has e2e coverage; categories/transactions/budgets/dashboard e2e
  suites are not yet written.
- `CAP-029` (Savings Goal upsert) has no consuming screen in the current design handoff;
  kept per the approved design pending product confirmation.
