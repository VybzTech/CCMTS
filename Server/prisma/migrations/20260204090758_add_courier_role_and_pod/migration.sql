/*
  Warnings:

  - You are about to drop the `AllocationConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Batch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Courier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeliveryFailure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Letter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lirs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `POD` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Batch` DROP FOREIGN KEY `Batch_allocatedCourierId_fkey`;

-- DropForeignKey
ALTER TABLE `Courier` DROP FOREIGN KEY `Courier_id_fkey`;

-- DropForeignKey
ALTER TABLE `DeliveryFailure` DROP FOREIGN KEY `DeliveryFailure_letterId_fkey`;

-- DropForeignKey
ALTER TABLE `Letter` DROP FOREIGN KEY `Letter_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `Letter` DROP FOREIGN KEY `Letter_scheduleId_fkey`;

-- DropForeignKey
ALTER TABLE `Letter` DROP FOREIGN KEY `Letter_verifiedById_fkey`;

-- DropForeignKey
ALTER TABLE `Lirs` DROP FOREIGN KEY `Lirs_id_fkey`;

-- DropForeignKey
ALTER TABLE `POD` DROP FOREIGN KEY `POD_letterId_fkey`;

-- DropForeignKey
ALTER TABLE `Schedule` DROP FOREIGN KEY `Schedule_createdById_fkey`;

-- DropTable
DROP TABLE `AllocationConfig`;

-- DropTable
DROP TABLE `Batch`;

-- DropTable
DROP TABLE `Courier`;

-- DropTable
DROP TABLE `DeliveryFailure`;

-- DropTable
DROP TABLE `Letter`;

-- DropTable
DROP TABLE `Lirs`;

-- DropTable
DROP TABLE `POD`;

-- DropTable
DROP TABLE `Schedule`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` DATETIME(3) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ODU', 'Admin', 'Management', 'Courier') NOT NULL DEFAULT 'ODU',
    `directorate_id` BIGINT UNSIGNED NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `directorates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `directorates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `couriers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `availability` BOOLEAN NOT NULL DEFAULT true,
    `active_tasks` INTEGER NOT NULL DEFAULT 0,
    `performance` INTEGER NOT NULL DEFAULT 100,
    `completed_deliveries` INTEGER NOT NULL DEFAULT 0,
    `base_lga` ENUM('IKEJA', 'VICTORIA_ISLAND', 'SURULERE', 'IKOYI', 'OJODU', 'ALIMOSHO', 'OSHODI', 'LAGOS_ISLAND', 'LAGOS_MAINLAND', 'EPE', 'BADAGRY', 'IKORODU', 'NOT_LAGOS', 'AGEGE', 'AJEROMI_IFELODUN', 'AMUWO_ODOFIN', 'APAPA', 'EGBEDA', 'ETI_OSA', 'IFAKO_IJAIYE', 'MUSHIN', 'YABA') NOT NULL,
    `other_branches_lga` JSON NOT NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `couriers_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `letters` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tracking_id` VARCHAR(255) NOT NULL,
    `sender_directorate_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `recipient_name` VARCHAR(255) NOT NULL,
    `recipient_address` VARCHAR(255) NOT NULL,
    `lga_address` ENUM('IKEJA', 'VICTORIA_ISLAND', 'SURULERE', 'IKOYI', 'OJODU', 'ALIMOSHO', 'OSHODI', 'LAGOS_ISLAND', 'LAGOS_MAINLAND', 'EPE', 'BADAGRY', 'IKORODU', 'NOT_LAGOS', 'AGEGE', 'AJEROMI_IFELODUN', 'AMUWO_ODOFIN', 'APAPA', 'EGBEDA', 'ETI_OSA', 'IFAKO_IJAIYE', 'MUSHIN', 'YABA') NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `submitted_by` VARCHAR(255) NOT NULL,
    `priority` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    `status` ENUM('Pending Approval', 'Approved', 'Assigned', 'In-Transit', 'Delivered', 'Undelivered') NOT NULL DEFAULT 'Pending Approval',
    `liability_value` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `liability_year` VARCHAR(255) NOT NULL,
    `courier_id` BIGINT UNSIGNED NULL,
    `assigned_at` DATETIME(3) NULL,
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `attachment_path` VARCHAR(255) NULL,
    `pod_image_path` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `letters_tracking_id_key`(`tracking_id`),
    INDEX `letters_sender_directorate_id_foreign`(`sender_directorate_id`),
    INDEX `letters_created_by_foreign`(`created_by`),
    INDEX `letters_courier_id_foreign`(`courier_id`),
    INDEX `letters_approved_by_foreign`(`approved_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `letter_timelines` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `letter_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `letter_timelines_letter_id_foreign`(`letter_id`),
    INDEX `letter_timelines_user_id_foreign`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('success', 'warning', 'error', 'info') NOT NULL DEFAULT 'info',
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `letter_id` BIGINT UNSIGNED NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    INDEX `notifications_user_id_foreign`(`user_id`),
    INDEX `notifications_letter_id_foreign`(`letter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_action`(`action`),
    INDEX `idx_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_resets` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_email`(`email`),
    INDEX `idx_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL,
    `last_used_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `personal_access_tokens_token_key`(`token`),
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type`, `tokenable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_limits` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `ip_address` VARCHAR(45) NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `requests` INTEGER NOT NULL DEFAULT 1,
    `window_start` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ip_endpoint`(`ip_address`, `endpoint`),
    INDEX `idx_window_start`(`window_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_directorate_id_fkey` FOREIGN KEY (`directorate_id`) REFERENCES `directorates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `couriers` ADD CONSTRAINT `couriers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letters` ADD CONSTRAINT `letters_sender_directorate_id_fkey` FOREIGN KEY (`sender_directorate_id`) REFERENCES `directorates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letters` ADD CONSTRAINT `letters_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letters` ADD CONSTRAINT `letters_courier_id_fkey` FOREIGN KEY (`courier_id`) REFERENCES `couriers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letters` ADD CONSTRAINT `letters_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letter_timelines` ADD CONSTRAINT `letter_timelines_letter_id_fkey` FOREIGN KEY (`letter_id`) REFERENCES `letters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `letter_timelines` ADD CONSTRAINT `letter_timelines_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_letter_id_fkey` FOREIGN KEY (`letter_id`) REFERENCES `letters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
