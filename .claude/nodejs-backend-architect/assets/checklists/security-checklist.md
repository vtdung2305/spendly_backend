# Security Review Checklist

## Authentication
- [ ] JWT access token lifetime ≤ 15 minutes
- [ ] Refresh token rotation implemented (old token invalidated)
- [ ] Token reuse detection triggers full revocation
- [ ] Password hashed with bcrypt (cost factor ≥ 12)
- [ ] Login rate limited (5/min per IP)
- [ ] Password reset rate limited (3/hour per email)

## Authorization
- [ ] Every endpoint has explicit auth guard or @Public decorator
- [ ] RBAC roles checked via RolesGuard
- [ ] Row-level security: users can only access their own resources
- [ ] Admin endpoints verify admin role
- [ ] No privilege escalation paths (user cannot modify their own role)

## Input Validation
- [ ] Global ValidationPipe with whitelist: true, forbidNonWhitelisted: true
- [ ] All DTOs use class-validator decorators
- [ ] File uploads validate MIME type server-side
- [ ] File size limits enforced per type
- [ ] No raw SQL with string interpolation (use parameterized queries only)

## OWASP Top 10
- [ ] SQL Injection: Prisma parameterization (no $queryRawUnsafe with user input)
- [ ] XSS: HTML input sanitized, Content-Type: application/json
- [ ] CSRF: SameSite cookie + CORS origin whitelist
- [ ] Broken Access Control: ownership checks in repositories
- [ ] Security Misconfiguration: Helmet middleware applied
- [ ] Sensitive Data: no PII in JWT, no secrets in logs

## Headers & Transport
- [ ] Helmet middleware enabled
- [ ] CORS configured with explicit origins (no wildcard in production)
- [ ] HSTS enabled
- [ ] Content-Security-Policy set

## Secrets
- [ ] No secrets in source code
- [ ] Environment variables validated at startup
- [ ] .env files in .gitignore
- [ ] JWT secrets ≥ 32 characters

## Logging & Audit
- [ ] Audit log for security events (login, permission changes, deletions)
- [ ] Sensitive fields redacted in logs (Authorization header, passwords)
- [ ] Request ID in all log entries
- [ ] Error responses don't leak internal details (stack traces, SQL)
