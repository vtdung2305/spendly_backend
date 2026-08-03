-- DropIndex
DROP INDEX "uq_savings_goals_user_year";

-- AlterTable: add the new columns as nullable first so existing rows can be backfilled
ALTER TABLE "savings_goals" ADD COLUMN     "name" TEXT;
ALTER TABLE "savings_goals" ADD COLUMN     "deadline" DATE;
ALTER TABLE "savings_goals" ADD COLUMN     "initial_amount" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Backfill existing rows from the column being dropped: one goal per year -> name "Mục tiêu tiết kiệm <year>", deadline Dec 31 of that year
UPDATE "savings_goals" SET "name" = 'Mục tiêu tiết kiệm ' || "year", "deadline" = make_date("year", 12, 31) WHERE "name" IS NULL;

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "savings_goals" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "savings_goals" ALTER COLUMN "deadline" SET NOT NULL;

-- DropColumn
ALTER TABLE "savings_goals" DROP COLUMN "year";

-- CreateIndex
CREATE INDEX "idx_savings_goals_user_deadline" ON "savings_goals"("user_id", "deadline");
