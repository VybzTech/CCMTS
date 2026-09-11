-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NULL,
    `last_name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `unit` ENUM('ADMIN', 'ORIGIN_UNIT', 'COURIER') NOT NULL,
    `role` ENUM('ADMIN', 'VERIFIER', 'SCHEDULER', 'COURIER_MANAGER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Letter` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `lga` ENUM('IKEJA', 'SURULERE', 'MUSHIN', 'KOSOFE', 'IKORODU', 'LEKKI') NOT NULL,
    `urgency` ENUM('VERY_HIGH', 'MEDIUM', 'LOW') NOT NULL,
    `liabilityAmount` DECIMAL(15, 2) NOT NULL,
    `liabilityYear` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'ALLOCATED', 'IN_TRANSIT', 'DELIVERED', 'DELIVERY_FAILED', 'POD_VERIFIED') NOT NULL,
    `destinationGeo` GEOMETRY NOT NULL,
    `scheduleId` VARCHAR(191) NULL,
    `courierId` VARCHAR(191) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `allocatedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Letter_lga_idx`(`lga`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Courier` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `type` ENUM('LIRS_RIDER', 'DHL', 'OTHER_EXTERNAL') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `maxDailyLoad` INTEGER NOT NULL,
    `reliabilityScore` DOUBLE NOT NULL,
    `serviceLGAs` JSON NOT NULL,
    `baseLocation` GEOMETRY NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Schedule` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'CLOSED') NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `POD` (
    `id` VARCHAR(191) NOT NULL,
    `letterId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `receivedBy` VARCHAR(191) NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `POD_letterId_key`(`letterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryFailure` (
    `id` VARCHAR(191) NOT NULL,
    `letterId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `notedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeliveryFailure_letterId_key`(`letterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Letter` ADD CONSTRAINT `Letter_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `Schedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Letter` ADD CONSTRAINT `Letter_courierId_fkey` FOREIGN KEY (`courierId`) REFERENCES `Courier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Letter` ADD CONSTRAINT `Letter_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `POD` ADD CONSTRAINT `POD_letterId_fkey` FOREIGN KEY (`letterId`) REFERENCES `Letter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliveryFailure` ADD CONSTRAINT `DeliveryFailure_letterId_fkey` FOREIGN KEY (`letterId`) REFERENCES `Letter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
