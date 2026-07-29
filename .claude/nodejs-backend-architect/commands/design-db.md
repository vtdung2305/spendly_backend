# /design-db

Design or extend the database schema for a feature or domain.

## Trigger
User says: "design the database", "create schema for X", "add tables for Y", "design-db".

## Workflow

1. Read `references/03-database.md` for all schema conventions
2. Read `references/01-product-analysis.md` Step 5 (entities & relationships)
3. Identify all entities needed
4. For each entity, include:
   - Mandatory audit columns (id, createdAt, updatedAt, deletedAt, createdBy, updatedBy)
   - Appropriate indexes (FK columns, filter columns, pagination columns)
   - Enum types for closed status sets
   - Version column if concurrent edit risk exists
5. Produce:
   - Mermaid ER diagram
   - Full Prisma schema
   - Index rationale (why each index exists)
   - Migration notes (if extending existing schema)

## Rules
- Always use UUID primary keys
- Always include soft delete column
- Always specify `@@map` for table name
- Always use `@map` for snake_case column mapping
- Foreign key columns always get an index
