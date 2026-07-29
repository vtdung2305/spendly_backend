# API Capability Registry

This is the **single source of truth** for all business capabilities exposed as API endpoints.

Before proposing a new endpoint, check this registry:
1. Does an existing capability already serve the need?
2. If yes → add the new screen as a consumer, possibly extend filters/fields.
3. If no → add a new row. State why no existing capability covers it.

**Screens are consumers, never sources, of API design.**

## How to Read This Table

| Column | Meaning |
|--------|---------|
| ID | Stable identifier for the capability (CAP-NNN) |
| Capability | What the system can do (business language) |
| Domain | Which bounded context owns this |
| Endpoint | HTTP method + path |
| Consumers | Which screens/features use this endpoint |
| Auth | Required role(s) |
| Notes | Pagination, caching, special behavior |

## Registry

| ID | Capability | Domain | Endpoint | Consumers | Auth | Notes |
|----|-----------|--------|----------|-----------|------|-------|
| CAP-001 | Query Products | Catalog | `GET /api/v1/products` | Product List, Search Results, Admin Products, Recommendations | ANY | Cursor pagination, filterable by category/status/price |
| CAP-002 | Get Product Detail | Catalog | `GET /api/v1/products/:id` | Product Detail Page, Quick View Modal, Cart Item Display | ANY | Includes variants, images; cached 5min |
| CAP-003 | Create Product | Catalog | `POST /api/v1/products` | Admin Product Form | ADMIN | Validates unique SKU |
| CAP-004 | Place Order | Orders | `POST /api/v1/orders` | Checkout Page | CUSTOMER | Validates stock, calculates total, reserves stock |
| CAP-005 | Query Orders | Orders | `GET /api/v1/orders` | Order History, Admin Orders | CUSTOMER (own), ADMIN (all) | Cursor pagination, filterable by status/date |
| CAP-006 | Get Order Detail | Orders | `GET /api/v1/orders/:id` | Order Detail, Order Confirmation, Admin Order View | CUSTOMER (own), ADMIN | Includes items, status history |
| CAP-007 | Cancel Order | Orders | `POST /api/v1/orders/:id/cancel` | Order Detail (cancel button) | CUSTOMER (own, if PENDING/CONFIRMED), ADMIN | Releases stock, triggers refund if paid |
| | | | | | | |
| _CAP-NNN_ | _[Describe capability]_ | _[Domain]_ | _[Method /path]_ | _[List consumers]_ | _[Roles]_ | _[Notes]_ |

## Adding a New Capability

1. Pick the next CAP-NNN number
2. Fill in all columns
3. Under "Consumers", list every screen/feature that will call this endpoint
4. If the capability is similar to an existing one, explain in Notes why it can't be merged
5. Get architecture review before implementation

## Deprecating a Capability

1. Add `[DEPRECATED]` prefix to the capability name
2. Set a sunset date in Notes
3. Add `Sunset` header to the endpoint response
4. Ensure all consumers have migrated before removal
