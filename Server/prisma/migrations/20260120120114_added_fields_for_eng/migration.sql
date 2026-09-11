/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Courier` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Courier` ADD COLUMN `currentDailyLoad` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastActiveAt` DATETIME(3) NULL,
    ADD COLUMN `locationConfidence` JSON NULL,
    MODIFY `maxDailyLoad` INTEGER NOT NULL DEFAULT 20,
    MODIFY `reliabilityScore` DOUBLE NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE `Letter` ADD COLUMN `batchId` VARCHAR(191) NULL,
    MODIFY `lga` ENUM('IKEJA', 'SURULERE', 'MUSHIN', 'KOSOFE', 'IKORODU', 'LEKKI', 'NOT_LAGOS') NOT NULL,
    MODIFY `status` ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'ALLOCATED', 'IN_TRANSIT', 'DELIVERED', 'DELIVERY_FAILED', 'POD_VERIFIED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `Schedule` MODIFY `status` ENUM('DRAFT', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `AllocationConfig` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `reliabilityWeight` DOUBLE NOT NULL DEFAULT 0.4,
    `confidenceWeight` DOUBLE NOT NULL DEFAULT 0.4,
    `equityWeight` DOUBLE NOT NULL DEFAULT 0.2,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Batch` (
    `id` VARCHAR(191) NOT NULL,
    `totalCount` INTEGER NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'COMPLETED',
    `allocatedCourierId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Courier_email_key` ON `Courier`(`email`);

-- CreateIndex
CREATE INDEX `Letter_status_idx` ON `Letter`(`status`);

-- AddForeignKey
ALTER TABLE `Letter` ADD CONSTRAINT `Letter_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_allocatedCourierId_fkey` FOREIGN KEY (`allocatedCourierId`) REFERENCES `Courier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
