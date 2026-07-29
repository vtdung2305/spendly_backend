# /review-security

Focused security review of code or architecture.

## Trigger
User says: "security review", "check security", "review-security", "is this secure".

## Workflow

1. Read `references/05-security.md` thoroughly
2. Read `assets/checklists/security-checklist.md`
3. Audit the code against OWASP Top 10:

### Authentication
- JWT token lifetime (≤15 min access, ≤7d refresh)
- Refresh token rotation with reuse detection
- Password hashing (bcrypt, cost ≥12)
- Rate limiting on auth endpoints

### Authorization
- @UseGuards on every non-public endpoint
- RBAC via RolesGuard
- Row-level security in ALL customer-facing repository queries
- No privilege escalation paths

### Input Validation
- Global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
- All DTOs decorated with class-validator
- File upload MIME validation
- No raw SQL with user input ($queryRawUnsafe)

### Data Protection
- No PII in JWT payload
- Secrets validated at startup, not in code
- Sensitive fields redacted in logs
- Error responses don't leak internals

### Infrastructure
- Helmet enabled
- CORS with explicit origins
- HSTS enabled
- Audit logging for security events

## Output Format
For each finding:
- **Severity**: Critical / High / Medium / Low
- **Location**: file and line if applicable
- **Issue**: what's wrong
- **Fix**: what to do
- **Reference**: which section of references/05-security.md applies
