/*
  Warnings:

  - Made the column `created_at` on table `couriers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `couriers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `directorates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `directorates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `letters` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `letters` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `notifications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill before tightening the columns.
--
-- created_at/updated_at were nullable with no default and Prisma had no
-- @default(now())/@updatedAt, so every row the application created (as
-- opposed to the seed script) landed with NULL timestamps. That is why
-- Management reporting had no usable date to filter or display
-- (UAT MGT-004). Existing NULLs are backfilled to the row's other
-- timestamp where one exists, and to now() otherwise - the true
-- creation time was never recorded, so this is the closest honest
-- value available.

UPDATE `couriers`     SET `created_at` = COALESCE(`updated_at`, NOW(3)) WHERE `created_at` IS NULL;
UPDATE `couriers`     SET `updated_at` = COALESCE(`created_at`, NOW(3)) WHERE `updated_at` IS NULL;
UPDATE `directorates` SET `created_at` = COALESCE(`updated_at`, NOW(3)) WHERE `created_at` IS NULL;
UPDATE `directorates` SET `updated_at` = COALESCE(`created_at`, NOW(3)) WHERE `updated_at` IS NULL;
UPDATE `letters`      SET `created_at` = COALESCE(`updated_at`, NOW(3)) WHERE `created_at` IS NULL;
UPDATE `letters`      SET `updated_at` = COALESCE(`created_at`, NOW(3)) WHERE `updated_at` IS NULL;
UPDATE `notifications` SET `created_at` = COALESCE(`updated_at`, NOW(3)) WHERE `created_at` IS NULL;
UPDATE `notifications` SET `updated_at` = COALESCE(`created_at`, NOW(3)) WHERE `updated_at` IS NULL;
UPDATE `users`        SET `created_at` = COALESCE(`updated_at`, NOW(3)) WHERE `created_at` IS NULL;
UPDATE `users`        SET `updated_at` = COALESCE(`created_at`, NOW(3)) WHERE `updated_at` IS NULL;

-- AlterTable
ALTER TABLE `couriers` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `directorates` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `letters` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updated_at` DATETIME(3) NOT NULL;
