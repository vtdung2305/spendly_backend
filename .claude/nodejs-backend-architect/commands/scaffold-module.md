# /scaffold-module

Generate a new feature module skeleton using the scaffold script.

## Trigger
User says: "scaffold a module", "create module X", "scaffold-module X".

## Workflow

1. Extract the module name from the user's request
2. Ask if they need `--with-queue` (BullMQ processor) or `--with-guard` (owner guard)
3. Run: `node scripts/scaffold_module.mjs <name> [flags]`
4. Show the generated file tree
5. Remind the user to:
   - Add the module to `app.module.ts`
   - Create the Prisma model
   - Run migration
   - Customize the entity's `fromPrisma()` mapper
   - Register capabilities in the registry
6. Optionally: customize the generated files based on the user's design

## Notes
If a design doc exists for this module, use it to pre-fill:
- Entity fields and business methods
- DTO validation rules
- UseCase business logic
- Repository query patterns
