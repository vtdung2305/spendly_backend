# Spendly Backend

Backend API for **Spendly** — a personal finance / expense-tracking app. Built with
NestJS + Prisma + PostgreSQL, following the design in `.claude/nodejs-backend-architect`
and the API contract designed against `design_handoff_finance_app/`.

## Stack

NestJS · TypeScript · Prisma · PostgreSQL · Redis · Cloudinary (avatar storage) ·
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
| `auth` | Register + email OTP verification, login, Google/Facebook OAuth, refresh token rotation, logout, forgot/reset password |
| `users` | Current user profile + preferences (theme/language/currency/notifications) |
| `files` | Avatar upload to Cloudinary |
| `categories` | Expense/income category CRUD; deleting a category reassigns its transactions to "Khác" |
| `transactions` | Income/expense CRUD, daily summary (Calendar), period summary (Reports) |
| `budgets` | Monthly per-category budget limits, with `spentAmount`/`usedPercent` computed from transactions |
| `savings-goals` | Named savings goals with a free deadline and optional starting amount; `currentAmount` is computed at read time from transactions plus the starting amount, never stored |
| `dashboard` | One aggregated `GET /dashboard/summary` endpoint composing the modules above |
| `recurring-transactions` | CRUD for recurring expenses/income; daily BullMQ job auto-generates the real Transaction on the configured day of month |
| `notifications` | In-app notification center + FCM push (optional), reminder settings, device token registration; auto-fires on budget-threshold-crossing, recurring generation, and a daily no-transaction-logged check |
| `mail` | SMTP sending (nodemailer) + `emails` BullMQ queue; `auth` enqueues password-reset emails here |

## Getting started (Docker)

```bash
cp .env.example .env
# edit .env: set GOOGLE_CLIENT_ID / FACEBOOK_APP_ID / FACEBOOK_APP_SECRET,
# SMTP_HOST/SMTP_USER/SMTP_PASS (an Ethereal.email inbox works for local dev),
# and CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET
# (free account at https://cloudinary.com/users/register/free — dashboard shows all three)

docker compose up --build
```

This starts `api` (NestJS, hot-reload), `db` (Postgres 16), and `redis`. Avatars upload
straight to Cloudinary, so there's no local storage service to run.

Run migrations and seed a demo user once the containers are healthy:

```bash
docker compose exec api npx prisma migrate dev --name init
docker compose exec api npm run prisma:seed
```

API docs (Swagger): http://localhost:3001/docs
Health check: http://localhost:3001/health

Demo login after seeding: `demo@spendly.app` / `Passw0rd!`

## Getting started (local, no Docker)

Requires Node 20+ and a local Postgres + Redis (or point `.env` at hosted ones);
Cloudinary is a hosted service so there's nothing extra to run locally for it.

```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

## Production (Docker)

### 1. Prepare the server

Docker + Docker Compose v2 installed, repo cloned, DNS/reverse proxy (nginx, Caddy, Traefik...)
in front of port 3000 for TLS — `docker-compose.prod.yml` does not terminate TLS itself.

### 2. Create the production `.env`

Copy `.env.example` to `.env` on the server and replace every value — **do not reuse dev
secrets**. `docker-compose.prod.yml` additionally needs these (not in `.env.example`,
since they're only consumed by the compose file, not the app):

```bash
# appended to .env, or exported in the shell/CI before `docker compose up`
POSTGRES_DB=spendly_prod
POSTGRES_USER=spendly
POSTGRES_PASSWORD=<strong-random-password>
REDIS_PASSWORD=<strong-random-password>
```

Then make sure the app-facing vars in `.env` point at those same values and at the
service names from `docker-compose.prod.yml` (`db`, `redis` — not `localhost`):

```bash
DATABASE_URL=postgresql://spendly:<POSTGRES_PASSWORD>@db:5432/spendly_prod?schema=public&connection_limit=10
REDIS_URL=redis://:<REDIS_PASSWORD>@redis:6379
CLOUDINARY_CLOUD_NAME=<real Cloudinary cloud name>
CLOUDINARY_API_KEY=<real Cloudinary API key>
CLOUDINARY_API_SECRET=<real Cloudinary API secret>
JWT_SECRET=<32+ char random secret, different from dev>
JWT_REFRESH_SECRET=<32+ char random secret, different from dev>
ALLOWED_ORIGINS=https://app.yourdomain.com
SMTP_HOST=<real SMTP provider>
SMTP_USER=<real SMTP user>
SMTP_PASS=<real SMTP password>
GOOGLE_CLIENT_ID=<real prod OAuth client id>
FACEBOOK_APP_ID=<real prod app id>
FACEBOOK_APP_SECRET=<real prod app secret>
```

Cloudinary avatar URLs are already public HTTPS (`res.cloudinary.com/...`), so unlike a
self-hosted object store there's no separate public endpoint/CDN to stand up for this.

### 3. Build and start

```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```

This builds the multi-stage production `Dockerfile` (non-root user, `npm prune --production`,
`dumb-init` entrypoint), runs 2 replicas of `api`, and starts `db`/`redis` — neither of
which publish ports to the host in this file, only `api:3000` does.

### 4. Run migrations (not `migrate dev`)

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

`migrate deploy` applies committed migrations as-is and never prompts or generates new
ones — that's the only migration command that belongs in production. **Do not run
`npm run prisma:seed` in production** — it creates a demo account with a published,
known password (`demo@spendly.app` / `Passw0rd!`).

### 5. Verify

```bash
curl https://api.yourdomain.com/health   # { "status": "ok", "info": { "database": { "status": "up" } } }
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

### 6. Redeploy on a new release

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

## Production (without Docker)

Same app, run as a plain Node process on the host. You still need Postgres 16 and Redis 7
reachable from the server — install them natively or point `.env` at managed services
(RDS, ElastiCache...). Avatar storage is Cloudinary (hosted), so there's nothing extra to
provision for that.

### 1. Install Node.js 20 and clone the repo

```bash
# e.g. via nvm
nvm install 20 && nvm use 20
git clone <repo-url> spendly-backend && cd spendly-backend
```

### 2. Configure `.env`

Same as the Docker guide above, except point `DATABASE_URL`/`REDIS_URL` at wherever those
services actually run (`localhost`, an internal hostname, or a managed service endpoint)
instead of the Docker service names `db`/`redis`. `CLOUDINARY_*` stays the same either way.

### 3. Install, generate, and build

```bash
npm ci                    # full install, including devDependencies — needed to build
npx prisma generate
npm run build              # emits dist/
npm prune --omit=dev       # drop devDependencies now that dist/ is built
```

### 4. Run migrations

```bash
npx prisma migrate deploy   # never `migrate dev` in production
# do NOT run `npm run prisma:seed` — it creates a demo account with a published password
```

### 5. Start the process under a process manager

A bare `node dist/src/main.js` dies on crash and doesn't restart on reboot — run it under
`pm2` (or a systemd unit) instead:

```bash
npm i -g pm2
pm2 start dist/src/main.js --name spendly-api -i max --update-env
pm2 save
pm2 startup   # prints (and can install) a systemd unit so pm2 itself survives a reboot
```

`-i max` runs one instance per CPU core behind pm2's built-in load balancer (the app is
stateless — auth/session state lives in Postgres/Redis, not in-process — so this is safe).

Equivalent systemd unit if you'd rather not use pm2 (`/etc/systemd/system/spendly-api.service`):

```ini
[Unit]
Description=Spendly API
After=network.target

[Service]
WorkingDirectory=/opt/spendly-backend
EnvironmentFile=/opt/spendly-backend/.env
ExecStart=/usr/bin/node dist/src/main.js
Restart=always
RestartSec=5
User=spendly

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now spendly-api
```

### 6. Reverse proxy + TLS

Put nginx/Caddy in front of port 3000 for TLS termination — the app itself only speaks
plain HTTP. Avatar URLs are served directly from Cloudinary over HTTPS, so no extra
reverse-proxy config is needed for those.

### 7. Verify

```bash
curl http://localhost:3000/health
pm2 logs spendly-api        # or: journalctl -u spendly-api -f
```

### 8. Redeploy on a new release

```bash
git pull
npm ci && npx prisma generate && npm run build && npm prune --omit=dev
npx prisma migrate deploy
pm2 reload spendly-api      # zero-downtime reload; use `systemctl restart spendly-api` for the unit variant
```

## Deploy to Render.com

Render can run this either as a **Docker** service (reuses the repo's production `Dockerfile`)
or as a **native Node** service. Docker is recommended since it's the exact image already
built and tested locally.

### 1. Provision managed services

In the Render dashboard: **New → PostgreSQL** and **New → Key Value (Redis)**. Copy their
**Internal Database URL** / **Internal Connection String** — you'll wire these into the web
service's env vars next (Internal URLs are free and faster than External ones for
service-to-service traffic on Render).

### 2. Create the Web Service

**New → Web Service** → connect this repo → **Environment: Docker** (Dockerfile Path: `Dockerfile`,
which already builds to the `production` stage).

Set these under **Settings**:
- **Health Check Path**: `/health`
- **Pre-Deploy Command**: `npx prisma migrate deploy`
  (runs once per deploy, after the image builds, before traffic switches to it — exactly
  where migrations belong. Requires `prisma` to be a regular `dependency`, not a
  `devDependency`, since the production image prunes dev deps — already the case in this repo.)

### 3. Environment variables

Add every var from `.env.example` under **Environment**, with these Render-specific values:
```bash
DATABASE_URL=<Postgres Internal Database URL from step 1>
REDIS_URL=<Redis Internal Connection String from step 1>
NODE_ENV=production
# PORT is injected automatically by Render — do not set it yourself
JWT_SECRET=<generate: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 32 — must differ from JWT_SECRET>
ALLOWED_ORIGINS=https://your-flutter-web-or-admin-domain.com
```
Plus real values for `GOOGLE_CLIENT_ID`/`FACEBOOK_APP_*`, `CLOUDINARY_*`, `SMTP_*`,
`APP_RESET_PASSWORD_URL`, and optionally `FIREBASE_*` (leave blank to disable push).

### 4. Deploy

Push to the branch Render is watching (or click **Manual Deploy**). Render will:
build the Docker image → run the Pre-Deploy Command (migrations) → start the container →
health-check `/health` → switch traffic over.

### 5. Redeploy on a new release

Just `git push` — Render rebuilds and redeploys automatically (or re-run the same Manual
Deploy). No SSH/manual commands needed; the Pre-Deploy Command re-runs migrations every time.

### Alternative: native Node environment (no Docker)

If you'd rather not use the Dockerfile: **Environment: Node**, then:
- **Build Command**: `npm ci && npx prisma generate && npm run build`
- **Pre-Deploy Command**: `npx prisma migrate deploy`
- **Start Command**: `npm run start:prod`

Same env vars as above. This path never prunes `devDependencies`, so it works either way
regardless of where `prisma` lives in `package.json`.

## OAuth setup notes

- **Google**: create an OAuth 2.0 Client ID (Web or Mobile) in Google Cloud Console;
  the backend verifies the client-supplied Google ID token against `GOOGLE_CLIENT_ID`
  using `google-auth-library`.
- **Facebook**: create a Facebook App; the backend verifies the client-supplied access
  token via the Graph API `debug_token` endpoint using `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET`,
  then fetches the profile. The Facebook app must have the `email` permission approved.

## Push notifications (FCM)

Optional. Without `FIREBASE_*` env vars set, `FirebaseAdminService` logs one warning at
boot and every `notify()` call just skips the push step — the in-app notification (and
`GET /api/v1/notifications` list) still works fully either way.

To enable real push:
1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**.
2. From the downloaded JSON, set `FIREBASE_PROJECT_ID` (`project_id`), `FIREBASE_CLIENT_EMAIL`
   (`client_email`), and `FIREBASE_PRIVATE_KEY` (`private_key` — paste as-is, including the
   literal `\n` sequences; the app un-escapes them at startup).
3. The Flutter app registers its FCM token via `POST /api/v1/notifications/device-tokens`
   after login, and should call `DELETE /api/v1/notifications/device-tokens` on logout.

Notifications auto-fire from three triggers (each gated by the user's reminder-settings
toggle for that type — see `GET/PATCH /api/v1/notifications/reminder-settings`):
- **Budget alert** — the moment an expense pushes a category from under 80% to 80%+ of
  its monthly budget (compares before/after this specific transaction, so it doesn't
  re-fire on every expense once already over).
- **Recurring generated** — right after the daily recurring-transactions job creates a
  transaction (see the `recurring-transactions` module).
- **Daily reminder** — an hourly job (`0 * * * *`) checks every user whose reminder time
  matches the current hour and who hasn't logged a transaction yet today.

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

## Email OTP verification (register)

Matches the "Verify OTP" screen added to `design_handoff_finance_app`. Email/password
registration no longer returns a session directly:

```
POST /auth/register  → { userId, email, otpRequired: true }   (no accessToken yet)
                          — sends a 6-digit code via the emails queue, same delivery
                            path as password reset (see MailProcessor / EMAIL_OTP job)
POST /auth/verify-otp → { userId, accessToken, refreshToken, refreshTokenExpiresAt }
POST /auth/resend-otp → 204, always — silent no-op if the email doesn't exist or is
                          already verified, to avoid leaking account state
```

Rules:
- Code expires after `OTP_EXPIRY_MINUTES` (default 5) and locks out after `OTP_MAX_ATTEMPTS`
  wrong tries (default 5) — the client must call `resend-otp` after that.
- Issuing a new OTP (register retry or resend) invalidates any previously issued one; only
  the latest is ever valid.
- `POST /auth/login` now rejects with `403 EMAIL_NOT_VERIFIED` if the account hasn't
  completed OTP verification yet — the client should redirect to the OTP screen (re-prompt
  `resend-otp` if the original code already expired).
- Google/Facebook accounts skip this entirely — `emailVerifiedAt` is set at creation since
  the provider already verified the email.
- Retrying `register` with the same, still-unverified email re-sends a fresh OTP instead of
  erroring (covers the abandoned-registration case); registering an already-**verified**
  email still returns `409 EMAIL_ALREADY_EXISTS`.

This adds two Prisma models/fields — run a migration after pulling this change:
```bash
npx prisma migrate dev --name add_email_otp_verification   # local
# or, once merged: docker compose exec api npx prisma migrate deploy
```

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

`test/app.e2e-spec.ts` covers the register → verify-otp → login → protected-route flow
end-to-end against a real Postgres/Redis (MailQueueService is mocked, so no Cloudinary/SMTP
credentials are needed for this test):

```bash
docker compose up -d db redis
npx prisma migrate deploy
npm run test:e2e
```

## Known follow-ups (not in this pass)

- Only the auth flow has e2e coverage; categories/transactions/budgets/dashboard e2e
  suites are not yet written.
- `CAP-029` (Savings Goal upsert) has no consuming screen in the current design handoff;
  kept per the approved design pending product confirmation.
