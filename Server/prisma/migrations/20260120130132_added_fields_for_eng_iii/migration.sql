/*
  Warnings:

  - You are about to drop the column `email` on the `Courier` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Courier` table. All the data in the column will be lost.
  - You are about to drop the column `courierId` on the `Letter` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Courier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Letter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Letter` DROP FOREIGN KEY `Letter_courierId_fkey`;

-- DropIndex
DROP INDEX `Courier_email_key` ON `Courier`;

-- AlterTable
ALTER TABLE `Courier` DROP COLUMN `email`,
    DROP COLUMN `name`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Letter` DROP COLUMN `courierId`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `unit`;

-- CreateTable
CREATE TABLE `Lirs` (
    `id` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastActiveAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `unit` ENUM('ADMIN', 'ORIGIN_UNIT', 'COURIER') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `Lirs` ADD CONSTRAINT `Lirs_id_fkey` FOREIGN KEY (`id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Courier` ADD CONSTRAINT `Courier_id_fkey` FOREIGN KEY (`id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
