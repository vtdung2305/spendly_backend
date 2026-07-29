# /generate-docker

Generate Docker and docker-compose configuration for the project.

## Trigger
User says: "generate Dockerfile", "docker setup", "containerize", "generate-docker".

## Workflow

1. Read `references/08-docker-infra.md` for all Docker conventions
2. Generate:
   - `Dockerfile` (multi-stage production: base → deps → prisma → build → production)
   - `Dockerfile.dev` (development with hot reload)
   - `docker-compose.yml` (dev: api + postgres + redis + redis-commander)
   - `docker-compose.prod.yml` (prod: replicas, resource limits, health checks)
   - `.dockerignore`
   - `.env.example`
   - `health.module.ts` + `health.controller.ts` (if not exists)
3. Include:
   - Health check endpoints (live, ready, startup)
   - Non-root user in production image
   - dumb-init for signal handling
   - Volume mounts for development
   - tmpfs for test database

## Key Decisions
- Production image: ~150MB (multi-stage, npm prune --production)
- Development: hot-reload via volume mount
- Database: PostgreSQL 16 Alpine
- Cache: Redis 7 Alpine
