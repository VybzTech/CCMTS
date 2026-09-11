/*
  Warnings:

  - You are about to drop the column `confidenceWeight` on the `AllocationConfig` table. All the data in the column will be lost.
  - You are about to drop the column `locationConfidence` on the `Courier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `AllocationConfig` DROP COLUMN `confidenceWeight`,
    ADD COLUMN `proximityWeight` DOUBLE NOT NULL DEFAULT 0.4;

-- AlterTable
ALTER TABLE `Courier` DROP COLUMN `locationConfidence`;
