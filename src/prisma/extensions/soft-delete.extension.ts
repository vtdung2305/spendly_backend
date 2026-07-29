import { Prisma } from '@prisma/client';

/**
 * Auto-filters deletedAt: null on read operations for models that have a
 * deletedAt column (User, Category, Transaction, Budget). Explicit archived
 * lookups must bypass this via prisma.$queryRaw or a dedicated repository method.
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
