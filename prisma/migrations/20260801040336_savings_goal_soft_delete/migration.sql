-- AlterTable
ALTER TABLE "savings_goals" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_savings_goals_soft_delete" ON "savings_goals"("deleted_at");
