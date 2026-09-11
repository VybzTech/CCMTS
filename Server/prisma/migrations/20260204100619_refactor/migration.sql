-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ODU', 'Admin', 'Management', 'Courier', 'Mgt') NOT NULL DEFAULT 'ODU';
