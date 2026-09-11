-- AlterTable
ALTER TABLE `users`
  ADD COLUMN `disabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `must_reset_password` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ODU', 'Admin', 'Management', 'Courier') NOT NULL DEFAULT 'ODU';
