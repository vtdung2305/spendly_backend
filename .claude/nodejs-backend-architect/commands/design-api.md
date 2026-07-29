# /design-api

Design API endpoints for a feature or domain using capability-driven approach.

## Trigger
User says: "design API for X", "what endpoints do I need for Y", "design-api".

## Workflow

1. Read `references/04-api-standards.md` for all API conventions
2. Read `docs/api-capability-registry.md` — check if existing capabilities cover the need
3. For each new capability:
   - Define the business capability (what the system can do, not what a screen needs)
   - Map to HTTP endpoint (method, path, version)
   - List consuming screens/features
   - Define request schema (with validation rules)
   - Define response schema (using standard envelope)
   - Define error codes and HTTP status mapping
   - Specify auth requirements (roles, row-level rules)
   - Specify pagination strategy (cursor default)
4. Deduplicate:
   - Same entity + same verb = same capability (different filters, not different endpoints)
   - Dashboard/aggregation screens → dedicated query endpoint, not N frontend calls
5. Produce:
   - Updated capability registry rows
   - OpenAPI-style contract per endpoint
   - Sequence diagram for complex flows

## Anti-patterns to Flag
- One endpoint per screen (screen-driven design)
- Duplicate list endpoints with different names
- Missing error documentation
- Missing pagination on list endpoints
