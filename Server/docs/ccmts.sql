

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ccmts`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `couriers`
--

CREATE TABLE `couriers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `availability` tinyint(1) NOT NULL DEFAULT 1,
  `active_tasks` int(11) NOT NULL DEFAULT 0,
  `performance` int(11) NOT NULL DEFAULT 100,
  `completed_deliveries` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `couriers`
--

INSERT INTO `couriers` (`id`, `name`, `phone`, `email`, `availability`, `active_tasks`, `performance`, `completed_deliveries`, `created_at`, `updated_at`) VALUES
(1, 'John Courier', '08012345678', 'john@courier.com', 1, 0, 95, 45, NULL, NULL),
(2, 'Jane Courier', '08012345679', 'jane@courier.com', 1, 1, 88, 38, NULL, NULL),
(3, 'Mike Courier', '08012345680', 'mike@courier.com', 1, 0, 92, 52, NULL, NULL),
(4, 'Sarah Courier', '08012345681', 'sarah@courier.com', 0, 0, 85, 30, NULL, NULL),
(5, 'David Courier', '08012345682', 'david@courier.com', 1, 0, 90, 41, NULL, NULL),
(6, 'DHL', '', '', 1, 0, 100, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `directorates`
--

CREATE TABLE `directorates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `directorates`
--

INSERT INTO `directorates` (`id`, `name`, `code`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Human Resources', 'HR', 'Human Resources Department', NULL, NULL),
(2, 'Finance', 'FIN', 'Finance and Accounts Department', NULL, NULL),
(3, 'IT Services', 'IT', 'Information Technology Services', NULL, NULL),
(4, 'Legal', 'LEG', 'Legal Affairs Department', NULL, NULL),
(5, 'Operations', 'OPS', 'Operations Department', NULL, NULL),
(6, 'Marketing', 'MKT', 'Marketing and Communications', NULL, NULL),
(7, 'Accounts', 'ACCT', 'Accounts Department', NULL, NULL),
(8, 'Tax Audit', 'TAX-AUD', 'Tax Audit Department', NULL, NULL),
(9, 'RMU', 'RMU', 'Revenue Monitoring Unit', NULL, NULL),
(10, 'Review', 'REV', 'Review Department', NULL, NULL),
(11, 'Entertainment', 'ENT', 'Entertainment Department', NULL, NULL),
(12, 'PIT', 'PIT', 'Personal Income Tax Department', NULL, NULL),
(13, 'Legal', 'LEGAL', 'Legal Department', NULL, NULL),
(14, 'Informal Sector', 'INF-SEC', 'Informal Sector Department', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `letters`
--

CREATE TABLE `letters` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tracking_id` varchar(255) NOT NULL,
  `sender_directorate_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `recipient_name` varchar(255) NOT NULL,
  `recipient_address` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `priority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `status` enum('Pending Approval','Approved','Assigned','In-Transit','Delivered','Undelivered') NOT NULL DEFAULT 'Pending Approval',
  `liability_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `courier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `letters`
--

INSERT INTO `letters` (`id`, `tracking_id`, `sender_directorate_id`, `created_by`, `recipient_name`, `recipient_address`, `subject`, `priority`, `status`, `liability_value`, `courier_id`, `assigned_at`, `approved_by`, `approved_at`, `delivered_at`, `attachment_path`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'LTR-2026-001', 6, 3, 'Recipient 1', 'Building 8, Floor 2, Office 338', 'Official Document 1 - Contract', 'Medium', 'Approved', 8229.00, NULL, NULL, 1, '2026-01-15 12:49:47', NULL, NULL, NULL, '2026-01-14 12:44:35', NULL),
(2, 'LTR-2026-002', 6, 3, 'Recipient 2', 'Building 7, Floor 2, Office 394', 'Official Document 2 - Notice', 'Medium', 'Undelivered', 1794.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-02 12:44:35', NULL),
(3, 'LTR-2026-003', 1, 3, 'Recipient 3', 'Building 5, Floor 5, Office 462', 'Official Document 3 - Notice', 'Low', 'Undelivered', 5077.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-04 12:44:35', NULL),
(5, 'LTR-2026-005', 5, 3, 'Recipient 5', 'Building 9, Floor 5, Office 223', 'Official Document 5 - Report', 'Low', 'Delivered', 7383.00, 3, NULL, NULL, NULL, '2026-01-11 12:44:35', NULL, NULL, '2026-01-13 12:44:35', NULL),
(6, 'LTR-2026-006', 6, 3, 'Recipient 6', 'Building 8, Floor 3, Office 357', 'Official Document 6 - Contract', 'High', 'Approved', 8692.00, NULL, NULL, 1, '2026-01-19 14:59:58', NULL, NULL, NULL, '2026-01-06 12:44:35', NULL),
(7, 'LTR-2026-007', 3, 3, 'Recipient 7', 'Building 10, Floor 1, Office 135', 'Official Document 7 - Memo', 'High', 'Approved', 1845.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 12:44:35', NULL),
(8, 'LTR-2026-008', 3, 3, 'Recipient 8', 'Building 9, Floor 1, Office 129', 'Official Document 8 - Memo', 'Low', 'Assigned', 1508.00, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 12:44:35', NULL),
(9, 'LTR-2026-009', 5, 3, 'Recipient 9', 'Building 3, Floor 1, Office 329', 'Official Document 9 - Invoice', 'Low', 'Assigned', 907.00, 2, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-08 12:44:35', NULL),
(10, 'LTR-2026-010', 2, 3, 'Recipient 10', 'Building 4, Floor 2, Office 283', 'Official Document 10 - Contract', 'Low', 'In-Transit', 9639.00, 2, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 12:44:35', NULL),
(11, 'LTR-2026-011', 1, 3, 'Recipient 11', 'Building 8, Floor 3, Office 497', 'Official Document 11 - Memo', 'Medium', 'Approved', 7144.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 12:44:35', NULL),
(12, 'LTR-2026-012', 4, 3, 'Recipient 12', 'Building 4, Floor 4, Office 150', 'Official Document 12 - Report', 'Medium', 'Delivered', 3345.00, 5, NULL, NULL, NULL, '2026-01-10 12:44:35', NULL, NULL, '2026-01-10 12:44:35', NULL),
(14, 'LTR-2026-014', 4, 3, 'Recipient 14', 'Building 9, Floor 1, Office 373', 'Official Document 14 - Report', 'Low', 'Approved', 3656.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-14 12:44:35', NULL),
(15, 'LTR-2026-015', 6, 3, 'Recipient 15', 'Building 1, Floor 1, Office 287', 'Official Document 15 - Notice', 'High', 'Approved', 2278.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-14 12:44:35', NULL),
(16, 'LTR-2026-016', 5, 3, 'Recipient 16', 'Building 8, Floor 1, Office 283', 'Official Document 16 - Notice', 'Low', 'In-Transit', 9207.00, 2, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 12:44:35', NULL),
(17, 'LTR-2026-017', 2, 3, 'Recipient 17', 'Building 9, Floor 5, Office 401', 'Official Document 17 - Invoice', 'Medium', 'In-Transit', 8183.00, 3, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-09 12:44:35', NULL),
(18, 'LTR-2026-018', 2, 3, 'Recipient 18', 'Building 7, Floor 2, Office 302', 'Official Document 18 - Memo', 'Medium', 'Assigned', 7528.00, 3, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-11 12:44:35', NULL),
(19, 'LTR-2026-019', 3, 3, 'Recipient 19', 'Building 8, Floor 1, Office 473', 'Official Document 19 - Invoice', 'High', 'In-Transit', 721.00, 3, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 12:44:35', NULL),
(20, 'LTR-2026-020', 1, 3, 'Recipient 20', 'Building 7, Floor 4, Office 282', 'Official Document 20 - Contract', 'High', 'Assigned', 7497.00, 5, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-11 12:44:35', NULL),
(21, 'LTR-2026-021', 5, 3, 'Recipient 21', 'Building 4, Floor 2, Office 327', 'Official Document 21 - Invoice', 'High', 'Approved', 542.00, NULL, NULL, 1, '2026-01-19 14:59:58', NULL, NULL, NULL, '2026-01-05 12:44:35', NULL),
(23, 'LTR-2026-023', 4, 3, 'Recipient 23', 'Building 1, Floor 5, Office 218', 'Official Document 23 - Invoice', 'Low', 'Assigned', 4959.00, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-06 12:44:35', NULL),
(24, 'LTR-2026-024', 1, 3, 'Recipient 24', 'Building 4, Floor 1, Office 311', 'Official Document 24 - Report', 'Medium', 'In-Transit', 6503.00, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 12:44:35', NULL),
(25, 'LTR-2026-025', 6, 3, 'Recipient 25', 'Building 9, Floor 2, Office 103', 'Official Document 25 - Contract', 'Medium', 'Delivered', 6200.00, 3, NULL, NULL, NULL, '2026-01-13 12:44:35', NULL, NULL, '2026-01-14 12:44:35', NULL),
(26, 'LTR-2026-026', 3, 3, 'Recipient 26', 'Building 3, Floor 5, Office 485', 'Official Document 26 - Contract', 'Low', 'Delivered', 1137.00, 2, NULL, NULL, NULL, '2026-01-13 12:44:35', NULL, NULL, '2026-01-10 12:44:35', NULL),
(27, 'LTR-2026-027', 2, 3, 'Recipient 27', 'Building 3, Floor 1, Office 133', 'Official Document 27 - Report', 'High', 'Approved', 5421.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 12:44:35', NULL),
(28, 'LTR-2026-028', 1, 3, 'Recipient 28', 'Building 4, Floor 2, Office 126', 'Official Document 28 - Invoice', 'High', 'Delivered', 3355.00, 3, NULL, NULL, NULL, '2026-01-08 12:44:35', NULL, NULL, '2026-01-03 12:44:35', NULL),
(29, 'LTR-2026-029', 5, 3, 'Recipient 29', 'Building 7, Floor 3, Office 486', 'Official Document 29 - Notice', 'High', 'Approved', 4326.00, NULL, NULL, 1, '2026-01-19 14:59:58', NULL, NULL, NULL, '2026-01-11 12:44:35', NULL),
(30, 'LTR-2026-030', 1, 3, 'Recipient 30', 'Building 9, Floor 5, Office 496', 'Official Document 30 - Contract', 'Medium', 'Assigned', 5435.00, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-10 12:44:35', NULL),
(31, 'LTR-2026-031', 6, 3, 'Recipient 31', 'Building 1, Floor 2, Office 398', 'Official Document 31 - Memo', 'Medium', 'Approved', 4185.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-14 12:44:35', NULL),
(32, 'LTR-2026-032', 1, 3, 'Recipient 32', 'Building 10, Floor 3, Office 357', 'Official Document 32 - Memo', 'High', 'Delivered', 1462.00, 2, NULL, NULL, NULL, '2026-01-14 12:44:35', NULL, NULL, '2026-01-08 12:44:35', NULL),
(33, 'LTR-2026-033', 5, 3, 'Recipient 33', 'Building 2, Floor 4, Office 295', 'Official Document 33 - Report', 'Medium', 'Undelivered', 9346.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-05 12:44:35', NULL),
(34, 'LTR-2026-034', 6, 3, 'Recipient 34', 'Building 7, Floor 2, Office 286', 'Official Document 34 - Invoice', 'Low', 'Assigned', 5078.00, 2, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-11 12:44:35', NULL),
(36, 'LTR-2026-036', 3, 3, 'Recipient 36', 'Building 3, Floor 2, Office 124', 'Official Document 36 - Invoice', 'High', 'Undelivered', 7610.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-08 12:44:35', NULL),
(37, 'LTR-2026-037', 5, 3, 'Recipient 37', 'Building 3, Floor 4, Office 225', 'Official Document 37 - Notice', 'Low', 'Undelivered', 4041.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-05 12:44:35', NULL),
(39, 'LTR-2026-039', 2, 3, 'Recipient 39', 'Building 7, Floor 3, Office 420', 'Official Document 39 - Notice', 'High', 'Approved', 9369.00, NULL, NULL, 1, '2026-01-19 14:59:57', NULL, NULL, NULL, '2026-01-14 12:44:35', NULL),
(40, 'LTR-2026-040', 5, 3, 'Recipient 40', 'Building 7, Floor 3, Office 416', 'Official Document 40 - Invoice', 'High', 'Assigned', 9786.00, 2, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 12:44:35', NULL),
(41, 'LTR-2026-041', 2, 3, 'Recipient 41', 'Building 2, Floor 2, Office 187', 'Official Document 41 - Memo', 'Medium', 'In-Transit', 4961.00, 2, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-07 12:44:35', NULL),
(42, 'LTR-2026-042', 3, 3, 'Recipient 42', 'Building 2, Floor 5, Office 102', 'Official Document 42 - Notice', 'Low', 'In-Transit', 3784.00, 4, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-03 12:44:35', NULL),
(43, 'LTR-2026-043', 3, 3, 'Recipient 43', 'Building 10, Floor 5, Office 390', 'Official Document 43 - Notice', 'High', 'In-Transit', 6902.00, 3, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-06 12:44:35', NULL),
(44, 'LTR-2026-044', 3, 3, 'Recipient 44', 'Building 1, Floor 5, Office 484', 'Official Document 44 - Invoice', 'Medium', 'Approved', 2123.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 12:44:35', NULL),
(45, 'LTR-2026-045', 1, 3, 'Recipient 45', 'Building 10, Floor 1, Office 217', 'Official Document 45 - Report', 'High', 'In-Transit', 8967.00, 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-08 12:44:35', NULL),
(46, 'LTR-2026-046', 6, 3, 'Recipient 46', 'Building 10, Floor 2, Office 436', 'Official Document 46 - Invoice', 'Low', 'In-Transit', 7343.00, 4, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-08 12:44:35', NULL),
(47, 'LTR-2026-047', 2, 3, 'Recipient 47', 'Building 5, Floor 5, Office 387', 'Official Document 47 - Notice', 'Low', 'Delivered', 2014.00, 5, NULL, NULL, NULL, '2026-01-09 12:44:35', NULL, NULL, '2026-01-10 12:44:35', NULL),
(48, 'LTR-2026-048', 3, 3, 'Recipient 48', 'Building 10, Floor 5, Office 363', 'Official Document 48 - Notice', 'Medium', 'Approved', 4070.00, NULL, NULL, 1, '2026-01-19 14:59:58', NULL, NULL, NULL, '2026-01-03 12:44:35', NULL),
(49, 'LTR-2026-049', 1, 3, 'Recipient 49', 'Building 4, Floor 1, Office 369', 'Official Document 49 - Invoice', 'Low', 'Delivered', 6112.00, 3, NULL, NULL, NULL, '2026-01-14 12:44:35', NULL, NULL, '2026-01-08 12:44:35', NULL),
(50, 'LTR-2026-050', 3, 3, 'Recipient 50', 'Building 4, Floor 4, Office 117', 'Official Document 50 - Notice', 'Low', 'Approved', 5142.00, NULL, NULL, 1, '2026-01-19 14:59:58', NULL, NULL, NULL, '2026-01-08 12:44:35', NULL),
(52, 'LTR-2026-051', 3, 6, 'Test Recipient 1', '123 Test Street, Lagos', 'IT Equipment Request', 'High', 'Approved', 75000.00, NULL, NULL, 1, '2026-01-19 14:59:57', NULL, NULL, 'Bulk upload test 1', '2026-01-18 06:24:16', NULL),
(54, 'LTR-2026-053', 3, 6, 'Test Recipient 3', '789 Demo Road, Victoria Island', 'Network Maintenance Notice', 'Low', 'Approved', 25000.00, NULL, NULL, 1, '2026-01-19 14:59:57', NULL, NULL, 'Bulk upload test 3', '2026-01-18 06:24:16', NULL),
(55, 'LTR-2026-054', 3, 6, 'Dangote', '123 Main Street, Lagos', 'Tax Assessment Notice', 'Medium', 'Approved', 50000.00, NULL, NULL, 1, '2026-01-19 14:56:33', NULL, NULL, 'Urgent delivery required', '2026-01-19 11:17:42', NULL),
(56, 'LTR-2026-055', 3, 6, 'Peak', '456 Victoria Island, Lagos', 'BOJ', 'High', 'Approved', 150000.00, NULL, NULL, 1, '2026-01-19 14:59:57', NULL, NULL, NULL, '2026-01-19 11:17:42', NULL),
(58, 'LTR-2026-056', 2, 4, 'Dr Mariam Olabisi', '18 apkoroko street, Ikorodu, Ikorodu, Lagos State', 'Failed assessment', 'High', 'Pending Approval', 123456.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-19 16:51:34', NULL),
(59, 'LTR-2026-057', 3, 6, 'Adebayo Ogundimu', '15 Awolowo Road, Ikeja, Lagos State', 'Tax Assessment Notice', '', 'Pending Approval', 45000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Standard delivery', '2026-01-21 15:36:52', NULL),
(60, 'LTR-2026-058', 3, 6, 'Chidinma Okafor', '23 Marina Street, Lagos Island, Lagos State', 'Audit Report 2025', '', 'Pending Approval', 250000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Confidential document', '2026-01-21 15:36:52', NULL),
(61, 'LTR-2026-059', 3, 6, 'Oluwaseun Adeleke', '78 Allen Avenue, Ikeja, Lagos State', 'Payment Reminder Notice', '', 'Pending Approval', 35000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(62, 'LTR-2026-060', 3, 6, 'Fatima Abdullahi', '45 Admiralty Way, Eti-Osa, Lagos State', 'Contract Renewal Letter', '', 'Pending Approval', 1500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Legal department copy', '2026-01-21 15:36:52', NULL),
(63, 'LTR-2026-061', 3, 6, 'Emeka Nwankwo', '12 Bode Thomas Street, Surulere, Lagos State', 'Pension Fund Statement', '', 'Pending Approval', 80000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Quarterly report', '2026-01-21 15:36:52', NULL),
(64, 'LTR-2026-062', 3, 6, 'Aisha Mohammed', '34 Opebi Road, Ikeja, Lagos State', 'Land Use Certificate', '', 'Pending Approval', 5000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Title document', '2026-01-21 15:36:52', NULL),
(65, 'LTR-2026-063', 3, 6, 'Tunde Bakare', '67 Toyin Street, Ikeja, Lagos State', 'Business License Approval', '', 'Pending Approval', 120000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(66, 'LTR-2026-064', 3, 6, 'Ngozi Eze', '89 Ajose Adeogun Street, Eti-Osa, Lagos State', 'Environmental Compliance Notice', '', 'Pending Approval', 75000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Follow up required', '2026-01-21 15:36:52', NULL),
(67, 'LTR-2026-065', 3, 6, 'Ibrahim Suleiman', '23 Apapa Oshodi Expressway, Apapa, Lagos State', 'Import Permit Authorization', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Port clearance', '2026-01-21 15:36:52', NULL),
(68, 'LTR-2026-066', 3, 6, 'Yetunde Afolabi', '56 Herbert Macaulay Way, Lagos Mainland, Lagos State', 'Staff Promotion Letter', '', 'Pending Approval', 25000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(69, 'LTR-2026-067', 3, 6, 'Chukwuemeka Obi', '12 Broad Street, Lagos Island, Lagos State', 'Property Tax Invoice', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025 assessment', '2026-01-21 15:36:52', NULL),
(70, 'LTR-2026-068', 3, 6, 'Blessing Okoro', '45 Akin Adesola Street, Eti-Osa, Lagos State', 'Insurance Policy Document', '', 'Pending Approval', 8000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'High value item', '2026-01-21 15:36:52', NULL),
(71, 'LTR-2026-069', 3, 6, 'Musa Garba', '78 Commercial Avenue, Ikorodu, Lagos State', 'Trade License Renewal', '', 'Pending Approval', 65000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(72, 'LTR-2026-070', 3, 6, 'Olumide Fashola', '34 Adeola Odeku Street, Eti-Osa, Lagos State', 'Investment Certificate', '', 'Pending Approval', 12000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Bank guarantee', '2026-01-21 15:36:52', NULL),
(73, 'LTR-2026-071', 3, 6, 'Patience Udo', '90 Gbagada Express, Kosofe, Lagos State', 'Health Insurance Card', '', 'Pending Approval', 15000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'New enrollment', '2026-01-21 15:36:52', NULL),
(74, 'LTR-2026-072', 3, 6, 'Ahmed Bello', '23 Campbell Street, Lagos Island, Lagos State', 'Court Summons', '', 'Pending Approval', 50000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Legal matter', '2026-01-21 15:36:52', NULL),
(75, 'LTR-2026-073', 3, 6, 'Obiora Nnamdi', '45 Warehouse Road, Apapa, Lagos State', 'Customs Declaration', '', 'Pending Approval', 7500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Import goods', '2026-01-21 15:36:52', NULL),
(76, 'LTR-2026-074', 3, 6, 'Halima Yusuf', '12 FESTAC Town, Amuwo-Odofin, Lagos State', 'Housing Allocation Letter', '', 'Pending Approval', 350000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Estate management', '2026-01-21 15:36:52', NULL),
(77, 'LTR-2026-075', 3, 6, 'Segun Odegbami', '78 Stadium Road, Surulere, Lagos State', 'Sports Council Certificate', '', 'Pending Approval', 45000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(78, 'LTR-2026-076', 3, 6, 'Chiamaka Onyeka', '34 Adeniran Ogunsanya, Surulere, Lagos State', 'Business Registration', '', 'Pending Approval', 85000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'New company', '2026-01-21 15:36:52', NULL),
(79, 'LTR-2026-077', 3, 6, 'Kabiru Abubakar', '56 Agege Motor Road, Agege, Lagos State', 'Vehicle Registration', '', 'Pending Approval', 120000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(80, 'LTR-2026-078', 3, 6, 'Oluwakemi Taiwo', '89 Ikorodu Road, Kosofe, Lagos State', 'Birth Certificate Application', '', 'Pending Approval', 5000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(81, 'LTR-2026-079', 3, 6, 'Ifeanyi Chukwu', '23 Badagry Expressway, Badagry, Lagos State', 'Fishing License', '', 'Pending Approval', 35000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Commercial fishing', '2026-01-21 15:36:52', NULL),
(82, 'LTR-2026-080', 3, 6, 'Zainab Abdulrahman', '45 Eko Atlantic, Eti-Osa, Lagos State', 'Investment Prospectus', '', 'Pending Approval', 50000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Major investment', '2026-01-21 15:36:52', NULL),
(83, 'LTR-2026-081', 3, 6, 'Adeyemi Adewale', '67 Ojuelegba Road, Surulere, Lagos State', 'Scholarship Award Letter', '', 'Pending Approval', 500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Education grant', '2026-01-21 15:36:52', NULL),
(84, 'LTR-2026-082', 3, 6, 'Grace Effiong', '12 Falomo Shopping Center, Eti-Osa, Lagos State', 'Retail License Application', '', 'Pending Approval', 95000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(85, 'LTR-2026-083', 3, 6, 'Uche Okechukwu', '78 Alaba International, Ojo, Lagos State', 'Electronics Import Permit', '', 'Pending Approval', 15000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk shipment', '2026-01-21 15:36:52', NULL),
(86, 'LTR-2026-084', 3, 6, 'Rashida Lawal', '34 Maryland, Kosofe, Lagos State', 'Health Facility License', '', 'Pending Approval', 180000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Clinic registration', '2026-01-21 15:36:52', NULL),
(87, 'LTR-2026-085', 3, 6, 'Babatunde Oladipo', '56 Ebute Metta, Lagos Mainland, Lagos State', 'Railway Compensation Notice', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Land acquisition', '2026-01-21 15:36:52', NULL),
(88, 'LTR-2026-086', 3, 6, 'Adaeze Igwe', '89 Lekki Phase 1, Eti-Osa, Lagos State', 'Construction Permit', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Building approval', '2026-01-21 15:36:52', NULL),
(89, 'LTR-2026-087', 3, 6, 'Solomon Yakubu', '23 Mile 2, Amuwo-Odofin, Lagos State', 'Transport Union Registration', '', 'Pending Approval', 75000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(90, 'LTR-2026-088', 3, 6, 'Folashade Coker', '45 Ilupeju Industrial, Kosofe, Lagos State', 'Factory License Renewal', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Annual renewal', '2026-01-21 15:36:52', NULL),
(91, 'LTR-2026-089', 3, 6, 'Chidi Okonkwo', '67 Ogba Industrial, Ikeja, Lagos State', 'Manufacturing Permit', '', 'Pending Approval', 3200000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'New facility', '2026-01-21 15:36:52', NULL),
(92, 'LTR-2026-090', 3, 6, 'Mariam Adelabu', '12 Yaba Tech Road, Lagos Mainland, Lagos State', 'Academic Transcript Request', '', 'Pending Approval', 15000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(93, 'LTR-2026-091', 3, 6, 'Kenneth Amadi', '78 Mushin Market, Mushin, Lagos State', 'Market Stall Allocation', '', 'Pending Approval', 65000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Trading permit', '2026-01-21 15:36:52', NULL),
(94, 'LTR-2026-092', 3, 6, 'Shade Onasanya', '34 Anthony Village, Kosofe, Lagos State', 'Property Valuation Report', '', 'Pending Approval', 125000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(95, 'LTR-2026-093', 3, 6, 'Abdulkadir Hassan', '56 Oshodi Terminal, Oshodi-Isolo, Lagos State', 'Bus Route License', '', 'Pending Approval', 280000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Commercial transport', '2026-01-21 15:36:52', NULL),
(96, 'LTR-2026-094', 3, 6, 'Nneka Uzoma', '89 Festac Link Road, Amuwo-Odofin, Lagos State', 'Community Development Levy', '', 'Pending Approval', 45000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(97, 'LTR-2026-095', 3, 6, 'Olayinka Balogun', '23 Palmgrove Estate, Shomolu, Lagos State', 'Estate Service Charge', '', 'Pending Approval', 180000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Annual dues', '2026-01-21 15:36:52', NULL),
(98, 'LTR-2026-096', 3, 6, 'Emmanuel Bassey', '45 Satellite Town, Ojo, Lagos State', 'Land Survey Certificate', '', 'Pending Approval', 750000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Boundary demarcation', '2026-01-21 15:36:52', NULL),
(99, 'LTR-2026-097', 3, 6, 'Khadijah Mustapha', '67 Magodo Phase 2, Kosofe, Lagos State', 'Building Plan Approval', '', 'Pending Approval', 1200000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(100, 'LTR-2026-098', 3, 6, 'Ayodele Martins', '12 Ojota Under Bridge, Kosofe, Lagos State', 'Street Trading Permit', '', 'Pending Approval', 25000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(101, 'LTR-2026-099', 3, 6, 'Ikenna Agu', '78 Computer Village, Ikeja, Lagos State', 'IT Business Registration', '', 'Pending Approval', 150000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Tech startup', '2026-01-21 15:36:52', NULL),
(102, 'LTR-2026-100', 3, 6, 'Rukayat Bakare', '34 Ojodu Berger, Ifako-Ijaiye, Lagos State', 'School License Application', '', 'Pending Approval', 850000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Private school', '2026-01-21 15:36:52', NULL),
(103, 'LTR-2026-101', 3, 6, 'Tobiloba Adegoke', '56 Sangotedo, Eti-Osa, Lagos State', 'Estate Development Permit', '', 'Pending Approval', 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Residential project', '2026-01-21 15:36:52', NULL),
(104, 'LTR-2026-102', 3, 6, 'Chinyere Nwafor', '89 Ajah Market, Eti-Osa, Lagos State', 'Market Association Fee', '', 'Pending Approval', 35000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(105, 'LTR-2026-103', 3, 6, 'Yusuf Balarabe', '23 Iyana Ipaja, Alimosho, Lagos State', 'Motor Park Registration', '', 'Pending Approval', 95000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(106, 'LTR-2026-104', 3, 6, 'Bukola Fashanu', '45 Ikotun Road, Alimosho, Lagos State', 'Cooperative Society Certificate', '', 'Pending Approval', 120000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(107, 'LTR-2026-105', 3, 6, 'Obinna Eze', '67 Egbeda Market, Alimosho, Lagos State', 'Wholesale License', '', 'Pending Approval', 280000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Bulk trading', '2026-01-21 15:36:52', NULL),
(108, 'LTR-2026-106', 3, 6, 'Amina Danjuma', '12 Ikeja City Mall, Ikeja, Lagos State', 'Retail Store Permit', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(109, 'LTR-2026-107', 3, 6, 'Kayode Bamgbose', '78 Surulere Stadium, Surulere, Lagos State', 'Event Permit Application', '', 'Pending Approval', 350000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Large gathering', '2026-01-21 15:36:52', NULL),
(110, 'LTR-2026-108', 3, 6, 'Ifunanya Okoli', '34 Somolu Market, Shomolu, Lagos State', 'Food Handler Certificate', '', 'Pending Approval', 15000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(111, 'LTR-2026-109', 3, 6, 'Mukhtar Aliyu', '56 Alausa Secretariat, Ikeja, Lagos State', 'Government Contract Award', '', 'Pending Approval', 75000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Infrastructure project', '2026-01-21 15:36:52', NULL),
(112, 'LTR-2026-110', 3, 6, 'Omowunmi Salami', '89 Oniru Estate, Eti-Osa, Lagos State', 'Luxury Tax Assessment', '', 'Pending Approval', 5000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(113, 'LTR-2026-111', 3, 6, 'Chukwudi Nwosu', '23 Trade Fair Complex, Ojo, Lagos State', 'Exhibition Permit', '', 'Pending Approval', 650000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Annual trade fair', '2026-01-21 15:36:52', NULL),
(114, 'LTR-2026-112', 3, 6, 'Latifat Oyelaran', '45 Jakande Estate, Eti-Osa, Lagos State', 'Housing Maintenance Notice', '', 'Pending Approval', 85000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(115, 'LTR-2026-113', 3, 6, 'Victor Oghene', '67 LUTH Road, Lagos Mainland, Lagos State', 'Medical Practice License', '', 'Pending Approval', 950000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Hospital registration', '2026-01-21 15:36:52', NULL),
(116, 'LTR-2026-114', 3, 6, 'Abiodun Ogunyemi', '12 UNILAG Campus, Lagos Mainland, Lagos State', 'Research Grant Award', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Academic funding', '2026-01-21 15:36:52', NULL),
(117, 'LTR-2026-115', 3, 6, 'Chisom Ajayi', '78 Oregun Industrial, Ikeja, Lagos State', 'Chemical Storage Permit', '', 'Pending Approval', 1800000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Hazardous materials', '2026-01-21 15:36:52', NULL),
(118, 'LTR-2026-116', 3, 6, 'Habiba Shehu', '34 Shomolu Market, Shomolu, Lagos State', 'Textile Trading License', '', 'Pending Approval', 175000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(119, 'LTR-2026-117', 3, 6, 'Olumuyiwa Adekunle', '56 National Stadium, Surulere, Lagos State', 'Sports Facility Rental', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(120, 'LTR-2026-118', 3, 6, 'Adaobi Ikechukwu', '89 Ibeju Lekki, Ibeju-Lekki, Lagos State', 'Free Trade Zone Permit', '', 'Pending Approval', 35000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Industrial zone', '2026-01-21 15:36:52', NULL),
(121, 'LTR-2026-119', 3, 6, 'Suleiman Musa', '23 Apapa Wharf, Apapa, Lagos State', 'Shipping Agency License', '', 'Pending Approval', 12500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(122, 'LTR-2026-120', 3, 6, 'Foluke Oni', '45 Alagomeji, Lagos Mainland, Lagos State', 'Railway Station Permit', '', 'Pending Approval', 280000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(123, 'LTR-2026-121', 3, 6, 'Nnamdi Azikiwe', '67 Epe Marina, Epe, Lagos State', 'Fishing Cooperative License', '', 'Pending Approval', 125000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Local fishermen', '2026-01-21 15:36:52', NULL),
(124, 'LTR-2026-122', 3, 6, 'Jumoke Akinwunmi', '12 Badagry Beach, Badagry, Lagos State', 'Tourism Operator Permit', '', 'Pending Approval', 350000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(125, 'LTR-2026-123', 3, 6, 'Ikechukwu Okafor', '78 Alimosho Plaza, Alimosho, Lagos State', 'Shopping Complex License', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(126, 'LTR-2026-124', 3, 6, 'Salamatu Umar', '34 Isolo Industrial, Oshodi-Isolo, Lagos State', 'Warehouse Registration', '', 'Pending Approval', 750000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(127, 'LTR-2026-125', 3, 6, 'Adebola Adeniyi', '56 Ajeromi Market, Ajeromi-Ifelodun, Lagos State', 'Fish Trading Permit', '', 'Pending Approval', 95000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(128, 'LTR-2026-126', 3, 6, 'Chinonso Nwachukwu', '89 Agege Stadium, Agege, Lagos State', 'Recreation Center Permit', '', 'Pending Approval', 280000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:52', NULL),
(129, 'LTR-2026-127', 3, 6, 'Rashidat Yekini', '23 Ifako Junction, Ifako-Ijaiye, Lagos State', 'Pharmacy License', '', 'Pending Approval', 650000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Medical retail', '2026-01-21 15:36:52', NULL),
(130, 'LTR-2026-128', 3, 6, 'Olufemi Oladele', '45 Ikorodu BRT, Ikorodu, Lagos State', 'Transport Terminal Fee', '', 'Pending Approval', 125000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(131, 'LTR-2026-129', 3, 6, 'Amarachi Obi', '67 Lagos Business School, Eti-Osa, Lagos State', 'Educational Accreditation', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(132, 'LTR-2026-130', 3, 6, 'Maryam Gwarzo', '12 Ijora Causeway, Apapa, Lagos State', 'Industrial Zone Permit', '', 'Pending Approval', 5500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(133, 'LTR-2026-131', 3, 6, 'Tosin Ayoola', '78 Chevron Estate, Eti-Osa, Lagos State', 'Gated Community Permit', '', 'Pending Approval', 1500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(134, 'LTR-2026-132', 3, 6, 'Emeka Onyekachi', '34 Adeniji Adele, Lagos Island, Lagos State', 'Heritage Building Permit', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Historical site', '2026-01-21 15:36:53', NULL),
(135, 'LTR-2026-133', 3, 6, 'Kemi Adeyeye', '56 Awoyaya, Ibeju-Lekki, Lagos State', 'Land Development Levy', '', 'Pending Approval', 850000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(136, 'LTR-2026-134', 3, 6, 'Ibrahim Abdullahi', '89 Dopemu Junction, Agege, Lagos State', 'Commercial Vehicle License', '', 'Pending Approval', 185000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(137, 'LTR-2026-135', 3, 6, 'Aduke Oyeleke', '23 Bariga, Shomolu, Lagos State', 'Community Hall Permit', '', 'Pending Approval', 250000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(138, 'LTR-2026-136', 3, 6, 'Ugochukwu Nweke', '45 Ketu Market, Kosofe, Lagos State', 'Spare Parts License', '', 'Pending Approval', 320000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(139, 'LTR-2026-137', 3, 6, 'Zainab Sani', '67 Idumota Market, Lagos Island, Lagos State', 'Wholesale Textile Permit', '', 'Pending Approval', 4500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(140, 'LTR-2026-138', 3, 6, 'Olanrewaju Alade', '12 Ojo Barracks, Ojo, Lagos State', 'Military Estate Permit', '', 'Pending Approval', 180000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(141, 'LTR-2026-139', 3, 6, 'Uchenna Ogbuji', '78 Ikoyi Club, Eti-Osa, Lagos State', 'Private Club License', '', 'Pending Approval', 7500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(142, 'LTR-2026-140', 3, 6, 'Hadiza Bello', '34 Ayobo Road, Alimosho, Lagos State', 'Poultry Farm License', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(143, 'LTR-2026-141', 3, 6, 'Seyi Adelowo', '56 GRA Ikeja, Ikeja, Lagos State', 'Diplomatic Residence Permit', '', 'Pending Approval', 15000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(144, 'LTR-2026-142', 3, 6, 'Chiamanda Ekwueme', '89 Oregun Link, Ikeja, Lagos State', 'Tech Hub Registration', '', 'Pending Approval', 850000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(145, 'LTR-2026-143', 3, 6, 'Aliyu Mohammed', '23 Mile 12, Kosofe, Lagos State', 'Long Distance Transport', '', 'Pending Approval', 380000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(146, 'LTR-2026-144', 3, 6, 'Oluwadamilola Adesina', '45 Ogudu GRA, Kosofe, Lagos State', 'Residential Renovation', '', 'Pending Approval', 650000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(147, 'LTR-2026-145', 3, 6, 'Precious Effiong', '67 Festac First Avenue, Amuwo-Odofin, Lagos State', 'Block Industry Permit', '', 'Pending Approval', 280000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(148, 'LTR-2026-146', 3, 6, 'Munir Abubakar', '12 Amuwo Industrial, Amuwo-Odofin, Lagos State', 'Steel Processing License', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(149, 'LTR-2026-147', 3, 6, 'Temitope Ogunleye', '78 Lekki Conservation, Eti-Osa, Lagos State', 'Environmental Impact Report', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(150, 'LTR-2026-148', 3, 6, 'Chukwuebuka Ani', '34 Badore Road, Eti-Osa, Lagos State', 'Waterfront Development', '', 'Pending Approval', 45000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(151, 'LTR-2026-149', 3, 6, 'Hawwa Usman', '56 Iyana Iba, Ojo, Lagos State', 'Agricultural Land Permit', '', 'Pending Approval', 750000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(152, 'LTR-2026-150', 3, 6, 'Ayomide Fashola', '89 Abule Egba, Agege, Lagos State', 'Motor Mechanic License', '', 'Pending Approval', 85000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(153, 'LTR-2026-151', 3, 6, 'Ifeoma Nwagwu', '23 Cement Bus Stop, Ikeja, Lagos State', 'Building Materials License', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(154, 'LTR-2026-152', 3, 6, 'Bashir Suleiman', '45 Igando Road, Alimosho, Lagos State', 'Housing Estate Permit', '', 'Pending Approval', 12000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(155, 'LTR-2026-153', 3, 6, 'Tolulope Adewuyi', '67 Iju Ishaga, Ifako-Ijaiye, Lagos State', 'Water Bottling License', '', 'Pending Approval', 950000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(156, 'LTR-2026-154', 3, 6, 'Obiageli Okwu', '12 Mafoluku, Oshodi-Isolo, Lagos State', 'Catering Business Permit', '', 'Pending Approval', 180000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(157, 'LTR-2026-155', 3, 6, 'Dauda Lawal', '78 Airport Road, Ikeja, Lagos State', 'Aviation Service License', '', 'Pending Approval', 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(158, 'LTR-2026-156', 3, 6, 'Ronke Badmus', '34 Idimu Road, Alimosho, Lagos State', 'Bakery License', '', 'Pending Approval', 250000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(159, 'LTR-2026-157', 3, 6, 'Kingsley Okonkwo', '56 FESTAC Link Bridge, Amuwo-Odofin, Lagos State', 'Bridge Maintenance Fee', '', 'Pending Approval', 125000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(160, 'LTR-2026-158', 3, 6, 'Fatimah Afolayan', '89 Mende, Kosofe, Lagos State', 'School Bus Permit', '', 'Pending Approval', 180000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(161, 'LTR-2026-159', 3, 6, 'Bayo Akinola', '23 Akoka, Lagos Mainland, Lagos State', 'Student Housing Permit', '', 'Pending Approval', 650000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(162, 'LTR-2026-160', 3, 6, 'Nkechi Udechukwu', '45 Onipanu, Shomolu, Lagos State', 'Retail Pharmacy License', '', 'Pending Approval', 750000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(163, 'LTR-2026-161', 3, 6, 'Gambo Yahaya', '67 Coconut Beach, Badagry, Lagos State', 'Beach Resort Permit', '', 'Pending Approval', 18000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(164, 'LTR-2026-162', 3, 6, 'Adeyinka Ojo', '12 Isale Eko, Lagos Island, Lagos State', 'Historical Market Permit', '', 'Pending Approval', 350000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(165, 'LTR-2026-163', 3, 6, 'Chiamaka Nwodo', '78 Agidingbi, Ikeja, Lagos State', 'Software Company License', '', 'Pending Approval', 650000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(166, 'LTR-2026-164', 3, 6, 'Mallam Umar', '34 Alapere, Kosofe, Lagos State', 'Mosque Building Permit', '', 'Pending Approval', 850000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(167, 'LTR-2026-165', 3, 6, 'Simisola Adetayo', '56 Abraham Adesanya, Eti-Osa, Lagos State', 'Private Estate Permit', '', 'Pending Approval', 5500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(168, 'LTR-2026-166', 3, 6, 'Uzoma Anyaegbunam', '89 Oworonsoki, Kosofe, Lagos State', 'Marine Transport License', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(169, 'LTR-2026-167', 3, 6, 'Sadia Abdullahi', '23 Fagba, Ifako-Ijaiye, Lagos State', 'Textile Factory Permit', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(170, 'LTR-2026-168', 3, 6, 'Gbenga Ogunbiyi', '45 Grammar School, Oshodi-Isolo, Lagos State', 'Educational Trust Fund', '', 'Pending Approval', 1500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(171, 'LTR-2026-169', 3, 6, 'Chinenye Oguike', '67 Dolphin Estate, Eti-Osa, Lagos State', 'Luxury Apartment Permit', '', 'Pending Approval', 35000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(172, 'LTR-2026-170', 3, 6, 'Rilwan Mohammed', '12 Iba Housing, Ojo, Lagos State', 'Low Cost Housing Levy', '', 'Pending Approval', 250000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(173, 'LTR-2026-171', 3, 6, 'Titilayo Ogunkoya', '78 Command, Alimosho, Lagos State', 'Military Family Housing', '', 'Pending Approval', 380000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(174, 'LTR-2026-172', 3, 6, 'Obumneme Okorie', '34 Isheri, Kosofe, Lagos State', 'River Bank Development', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(175, 'LTR-2026-173', 3, 6, 'Hauwa Idris', '56 Ejigbo, Oshodi-Isolo, Lagos State', 'Community Center Permit', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(176, 'LTR-2026-174', 3, 6, 'Oluwafunmilayo Ige', '89 Lawanson, Surulere, Lagos State', 'Day Care Center License', '', 'Pending Approval', 280000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(177, 'LTR-2026-175', 3, 6, 'Chukwuma Okonjo', '23 Itire, Surulere, Lagos State', 'Auto Workshop License', '', 'Pending Approval', 350000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(178, 'LTR-2026-176', 3, 6, 'Basirat Adegbite', '45 Akowonjo, Alimosho, Lagos State', 'Supermarket License', '', 'Pending Approval', 650000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(179, 'LTR-2026-177', 3, 6, 'Kingsley Nwachukwu', '67 Egbe, Oshodi-Isolo, Lagos State', 'Furniture Factory Permit', '', 'Pending Approval', 1200000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(180, 'LTR-2026-178', 3, 6, 'Yemi Shogunle', '12 Pipeline, Alimosho, Lagos State', 'Petroleum Storage Permit', '', 'Pending Approval', 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Hazardous facility', '2026-01-21 15:36:53', NULL),
(181, 'LTR-2026-179', 3, 6, 'Adannaya Okafor', '78 New Oko Oba, Agege, Lagos State', 'Abattoir License', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(182, 'LTR-2026-180', 3, 6, 'Suleiman Abdulwahab', '34 Iju, Ifako-Ijaiye, Lagos State', 'Water Treatment Permit', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(183, 'LTR-2026-181', 3, 6, 'Bukky Benson', '56 Pen Cinema, Agege, Lagos State', 'Cinema Hall License', '', 'Pending Approval', 850000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(184, 'LTR-2026-182', 3, 6, 'Ifeanyi Onu', '89 Matori, Oshodi-Isolo, Lagos State', 'Beverage Factory Permit', '', 'Pending Approval', 5500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(185, 'LTR-2026-183', 3, 6, 'Nafisa Abubakar', '23 Olodi Apapa, Apapa, Lagos State', 'Port Service License', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(186, 'LTR-2026-184', 3, 6, 'Toyosi Aderibigbe', '45 Navy Town, Ojo, Lagos State', 'Defense Estate Permit', '', 'Pending Approval', 550000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(187, 'LTR-2026-185', 3, 6, 'Chibuzo Nwokolo', '67 Eputu, Ibeju-Lekki, Lagos State', 'Farm Estate Permit', '', 'Pending Approval', 1500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(188, 'LTR-2026-186', 3, 6, 'Raheem Olajide', '12 Ibeshe, Ikorodu, Lagos State', 'Riverine Transport Permit', '', 'Pending Approval', 450000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(189, 'LTR-2026-187', 3, 6, 'Omolola Fajemisin', '78 Owode Onirin, Kosofe, Lagos State', 'Building Materials Market', '', 'Pending Approval', 750000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(190, 'LTR-2026-188', 3, 6, 'Adekunle Ajasin', '34 Kara Market, Ikorodu, Lagos State', 'Cattle Market License', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(191, 'LTR-2026-189', 3, 6, 'Ijeoma Okonjo', '56 Eleko Beach, Ibeju-Lekki, Lagos State', 'Beach Front Development', '', 'Pending Approval', 55000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(192, 'LTR-2026-190', 3, 6, 'Yakubu Ahmadu', '89 Imota, Ikorodu, Lagos State', 'Rice Mill License', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(193, 'LTR-2026-191', 3, 6, 'Deborah Akintoye', '23 Bayeku, Ikorodu, Lagos State', 'Fishery Processing Permit', '', 'Pending Approval', 850000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(194, 'LTR-2026-192', 3, 6, 'Nnamdi Ezeife', '45 Igbogbo, Ikorodu, Lagos State', 'Sand Dredging License', '', 'Pending Approval', 5500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(195, 'LTR-2026-193', 3, 6, 'Hadijat Mohammed', '67 Majidun, Ikorodu, Lagos State', 'Timber Processing Permit', '', 'Pending Approval', 1200000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(196, 'LTR-2026-194', 3, 6, 'Segun Awolowo', '12 Ipakodo, Ikorodu, Lagos State', 'Ferry Terminal Permit', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(197, 'LTR-2026-195', 3, 6, 'Nwamaka Igwe', '78 Ijede, Ikorodu, Lagos State', 'Chemical Plant Permit', '', 'Pending Approval', 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Environmental review', '2026-01-21 15:36:53', NULL),
(198, 'LTR-2026-196', 3, 6, 'Abdulahi Bature', '34 Agbowa, Ikorodu, Lagos State', 'Agricultural Coop License', '', 'Pending Approval', 550000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(199, 'LTR-2026-197', 3, 6, 'Folakemi Ogundele', '56 Laspotech Road, Ikorodu, Lagos State', 'Educational Zone Permit', '', 'Pending Approval', 1500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(200, 'LTR-2026-198', 3, 6, 'Obi Okonkwo', '89 Ogijo, Shomolu, Lagos State', 'Industrial Estate Permit', '', 'Pending Approval', 12000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(201, 'LTR-2026-199', 3, 6, 'Salamat Ayinde', '23 Gbagada Phase 2, Kosofe, Lagos State', 'Commercial Complex Permit', '', 'Pending Approval', 18000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(202, 'LTR-2026-200', 3, 6, 'Temilade Adewale', '45 Pedro, Shomolu, Lagos State', 'Warehouse Facility Permit', '', 'Pending Approval', 2500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(203, 'LTR-2026-201', 3, 6, 'Chinedu Ike', '67 Onigbongbo, Ikeja, Lagos State', 'IT Park Registration', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(204, 'LTR-2026-202', 3, 6, 'Medinat Saliu', '12 Alausa, Ikeja, Lagos State', 'Government Quarter Permit', '', 'Pending Approval', 1500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(205, 'LTR-2026-203', 3, 6, 'Oluwaseyi Adewuyi', '78 Secretariat, Ikeja, Lagos State', 'Administrative Building', '', 'Pending Approval', 35000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(206, 'LTR-2026-204', 3, 6, 'Adaora Anyanwu', '34 GRA Phase 1, Ikeja, Lagos State', 'Diplomatic Mission Permit', '', 'Pending Approval', 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(207, 'LTR-2026-205', 3, 6, 'Murtala Mohammed', '56 Oregun Road, Ikeja, Lagos State', 'Data Center License', '', 'Pending Approval', 15000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(208, 'LTR-2026-206', 3, 6, 'Boluwatife Ogunjobi', '89 Kudirat Abiola Way, Ikeja, Lagos State', 'Media House License', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(209, 'LTR-2026-207', 3, 6, 'Uchechukwu Nwoye', '23 NICON Town, Eti-Osa, Lagos State', 'Insurance Tower Permit', '', 'Pending Approval', 45000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(210, 'LTR-2026-208', 3, 6, 'Aisha Dikko', '45 Oniru Beach, Eti-Osa, Lagos State', 'Beach Club License', '', 'Pending Approval', 12000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(211, 'LTR-2026-209', 3, 6, 'Olumuyiwa Ogundipe', '67 Banana Island, Eti-Osa, Lagos State', 'Ultra Luxury Estate Permit', '', 'Pending Approval', 150000000.00, NULL, NULL, NULL, NULL, NULL, NULL, 'Premium location', '2026-01-21 15:36:53', NULL),
(212, 'LTR-2026-210', 3, 6, 'Amarachi Okafor', '12 Parkview Estate, Eti-Osa, Lagos State', 'Gated Estate Permit', '', 'Pending Approval', 25000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(213, 'LTR-2026-211', 3, 6, 'Haruna Kwankwaso', '78 Ikoyi Crescent, Eti-Osa, Lagos State', 'Heritage Mansion Permit', '', 'Pending Approval', 55000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(214, 'LTR-2026-212', 3, 6, 'Omotola Ekeinde', '34 Old Ikoyi, Eti-Osa, Lagos State', 'Historical Renovation', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(215, 'LTR-2026-213', 3, 6, 'Kelechi Nwankwo', '56 Falomo, Eti-Osa, Lagos State', 'Commercial Tower Permit', '', 'Pending Approval', 75000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(216, 'LTR-2026-214', 3, 6, 'Zainab Oladimeji', '89 Osborne Phase 1, Eti-Osa, Lagos State', 'Waterfront Villa Permit', '', 'Pending Approval', 35000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(217, 'LTR-2026-215', 3, 6, 'Babajide Sanwo', '23 Queens Drive, Eti-Osa, Lagos State', 'Royal Estate Permit', '', 'Pending Approval', 45000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(218, 'LTR-2026-216', 3, 6, 'Oluwatoyin Falola', '45 Bourdillon Road, Eti-Osa, Lagos State', 'Executive Residence Permit', '', 'Pending Approval', 65000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(219, 'LTR-2026-217', 3, 6, 'Chukwuemeka Odumegwu', '67 Cooper Road, Eti-Osa, Lagos State', 'Legacy Building Permit', '', 'Pending Approval', 28000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(220, 'LTR-2026-218', 3, 6, 'Fatima Waziri', '12 Turnbull Road, Eti-Osa, Lagos State', 'Colonial Heritage Permit', '', 'Pending Approval', 5500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(221, 'LTR-2026-219', 3, 6, 'Adeniyi Adebayo', '78 Maitama Close, Eti-Osa, Lagos State', 'Ambassadorial Residence', '', 'Pending Approval', 85000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(222, 'LTR-2026-220', 3, 6, 'Ngozi Ikpeazu', '34 Alexander Road, Eti-Osa, Lagos State', 'Consulate Building Permit', '', 'Pending Approval', 95000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(223, 'LTR-2026-221', 3, 6, 'Mustapha Abubakar', '56 Gerrard Road, Eti-Osa, Lagos State', 'Cultural Center Permit', '', 'Pending Approval', 15000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(224, 'LTR-2026-222', 3, 6, 'Oluwakemi Okonkwo', '89 Glover Road, Eti-Osa, Lagos State', 'Art Gallery License', '', 'Pending Approval', 3500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(225, 'LTR-2026-223', 3, 6, 'Chidimma Eze', '23 Moloney Street, Lagos Island, Lagos State', 'Financial District Permit', '', 'Pending Approval', 125000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(226, 'LTR-2026-224', 3, 6, 'Abdulrahman Yusuf', '45 Balogun Street, Lagos Island, Lagos State', 'Trading Complex License', '', 'Pending Approval', 35000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(227, 'LTR-2026-225', 3, 6, 'Temiloluwa Adegoke', '67 Nnamdi Azikiwe Street, Lagos Island, Lagos State', 'Bank Building Permit', '', 'Pending Approval', 250000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(228, 'LTR-2026-226', 3, 6, 'Obianuju Obi', '12 Customs Street, Lagos Island, Lagos State', 'Port Authority Building', '', 'Pending Approval', 45000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(229, 'LTR-2026-227', 3, 6, 'Garba Shehu', '78 Igbosere Road, Lagos Island, Lagos State', 'Court Complex Permit', '', 'Pending Approval', 55000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(230, 'LTR-2026-228', 3, 6, 'Damilola Osinbajo', '34 Catholic Mission, Lagos Island, Lagos State', 'Religious Institution Permit', '', 'Pending Approval', 8500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(231, 'LTR-2026-229', 3, 6, 'Kemi Olunloyo', '56 Tinubu Square, Lagos Island, Lagos State', 'Historic Square Permit', '', 'Pending Approval', 12000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL),
(232, 'LTR-2026-230', 3, 6, 'Emeka Anyaoku', '89 Odunlami Street, Lagos Island, Lagos State', 'Heritage Market Permit', '', 'Pending Approval', 5500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-21 15:36:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `letter_timelines`
--

CREATE TABLE `letter_timelines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `letter_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `letter_timelines`
--

INSERT INTO `letter_timelines` (`id`, `letter_id`, `status`, `description`, `user_id`, `created_at`) VALUES
(1, 1, 'Registered', 'Letter registered in the system', 3, '2026-01-14 12:44:35'),
(2, 2, 'Registered', 'Letter registered in the system', 3, '2026-01-02 12:44:35'),
(3, 3, 'Registered', 'Letter registered in the system', 3, '2026-01-04 12:44:35'),
(5, 5, 'Registered', 'Letter registered in the system', 3, '2026-01-13 12:44:35'),
(6, 6, 'Registered', 'Letter registered in the system', 3, '2026-01-06 12:44:35'),
(7, 7, 'Registered', 'Letter registered in the system', 3, '2026-01-13 12:44:35'),
(8, 8, 'Registered', 'Letter registered in the system', 3, '2026-01-03 12:44:35'),
(9, 9, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(10, 10, 'Registered', 'Letter registered in the system', 3, '2026-01-15 12:44:35'),
(11, 11, 'Registered', 'Letter registered in the system', 3, '2026-01-13 12:44:35'),
(12, 12, 'Registered', 'Letter registered in the system', 3, '2026-01-10 12:44:35'),
(14, 14, 'Registered', 'Letter registered in the system', 3, '2026-01-14 12:44:35'),
(15, 15, 'Registered', 'Letter registered in the system', 3, '2026-01-14 12:44:35'),
(16, 16, 'Registered', 'Letter registered in the system', 3, '2026-01-15 12:44:35'),
(17, 17, 'Registered', 'Letter registered in the system', 3, '2026-01-09 12:44:35'),
(18, 18, 'Registered', 'Letter registered in the system', 3, '2026-01-11 12:44:35'),
(19, 19, 'Registered', 'Letter registered in the system', 3, '2026-01-15 12:44:35'),
(20, 20, 'Registered', 'Letter registered in the system', 3, '2026-01-11 12:44:35'),
(21, 21, 'Registered', 'Letter registered in the system', 3, '2026-01-05 12:44:35'),
(23, 23, 'Registered', 'Letter registered in the system', 3, '2026-01-06 12:44:35'),
(24, 24, 'Registered', 'Letter registered in the system', 3, '2026-01-15 12:44:35'),
(25, 25, 'Registered', 'Letter registered in the system', 3, '2026-01-14 12:44:35'),
(26, 26, 'Registered', 'Letter registered in the system', 3, '2026-01-10 12:44:35'),
(27, 27, 'Registered', 'Letter registered in the system', 3, '2026-01-12 12:44:35'),
(28, 28, 'Registered', 'Letter registered in the system', 3, '2026-01-03 12:44:35'),
(29, 29, 'Registered', 'Letter registered in the system', 3, '2026-01-11 12:44:35'),
(30, 30, 'Registered', 'Letter registered in the system', 3, '2026-01-10 12:44:35'),
(31, 31, 'Registered', 'Letter registered in the system', 3, '2026-01-14 12:44:35'),
(32, 32, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(33, 33, 'Registered', 'Letter registered in the system', 3, '2026-01-05 12:44:35'),
(34, 34, 'Registered', 'Letter registered in the system', 3, '2026-01-11 12:44:35'),
(36, 36, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(37, 37, 'Registered', 'Letter registered in the system', 3, '2026-01-05 12:44:35'),
(39, 39, 'Registered', 'Letter registered in the system', 3, '2026-01-14 12:44:35'),
(40, 40, 'Registered', 'Letter registered in the system', 3, '2026-01-13 12:44:35'),
(41, 41, 'Registered', 'Letter registered in the system', 3, '2026-01-07 12:44:35'),
(42, 42, 'Registered', 'Letter registered in the system', 3, '2026-01-03 12:44:35'),
(43, 43, 'Registered', 'Letter registered in the system', 3, '2026-01-06 12:44:35'),
(44, 44, 'Registered', 'Letter registered in the system', 3, '2026-01-13 12:44:35'),
(45, 45, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(46, 46, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(47, 47, 'Registered', 'Letter registered in the system', 3, '2026-01-10 12:44:35'),
(48, 48, 'Registered', 'Letter registered in the system', 3, '2026-01-03 12:44:35'),
(49, 49, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(50, 50, 'Registered', 'Letter registered in the system', 3, '2026-01-08 12:44:35'),
(51, 1, 'Approved', 'Letter approved by Admin User', 1, '2026-01-15 12:49:47'),
(52, 16, 'Assigned', 'Assigned to courier: Jane Courier', 1, '2026-01-15 12:50:06'),
(55, 52, 'Registered', 'Letter registered in the system', 6, '2026-01-18 06:24:16'),
(57, 54, 'Registered', 'Letter registered in the system', 6, '2026-01-18 06:24:16'),
(58, 55, 'Registered', 'Letter registered in the system', 6, '2026-01-19 11:17:42'),
(59, 56, 'Registered', 'Letter registered in the system', 6, '2026-01-19 11:17:42'),
(61, 16, 'In-Transit', 'Letter is in transit', 1, '2026-01-19 13:14:06'),
(62, 55, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:56:33'),
(63, 56, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:57'),
(64, 52, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:57'),
(65, 54, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:57'),
(66, 39, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:57'),
(67, 29, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:58'),
(68, 50, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:58'),
(69, 6, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:58'),
(70, 21, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:58'),
(71, 48, 'Approved', 'Letter approved by Admin User', 1, '2026-01-19 14:59:58'),
(79, 58, 'Registered', 'Letter registered in the system', 4, '2026-01-19 16:51:34'),
(80, 59, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(81, 60, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(82, 61, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(83, 62, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(84, 63, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(85, 64, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(86, 65, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(87, 66, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(88, 67, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(89, 68, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(90, 69, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(91, 70, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(92, 71, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(93, 72, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(94, 73, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(95, 74, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(96, 75, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(97, 76, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(98, 77, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(99, 78, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(100, 79, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(101, 80, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(102, 81, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(103, 82, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(104, 83, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(105, 84, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(106, 85, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(107, 86, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(108, 87, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(109, 88, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(110, 89, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(111, 90, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(112, 91, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(113, 92, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(114, 93, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(115, 94, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(116, 95, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(117, 96, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(118, 97, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(119, 98, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(120, 99, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(121, 100, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(122, 101, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(123, 102, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(124, 103, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(125, 104, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(126, 105, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(127, 106, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(128, 107, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(129, 108, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(130, 109, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(131, 110, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(132, 111, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(133, 112, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(134, 113, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(135, 114, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(136, 115, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(137, 116, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(138, 117, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(139, 118, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(140, 119, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(141, 120, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(142, 121, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(143, 122, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(144, 123, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(145, 124, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(146, 125, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(147, 126, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(148, 127, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(149, 128, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(150, 129, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:52'),
(151, 130, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(152, 131, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(153, 132, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(154, 133, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(155, 134, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(156, 135, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(157, 136, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(158, 137, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(159, 138, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(160, 139, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(161, 140, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(162, 141, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(163, 142, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(164, 143, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(165, 144, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(166, 145, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(167, 146, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(168, 147, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(169, 148, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(170, 149, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(171, 150, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(172, 151, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(173, 152, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(174, 153, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(175, 154, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(176, 155, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(177, 156, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(178, 157, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(179, 158, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(180, 159, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(181, 160, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(182, 161, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(183, 162, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(184, 163, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(185, 164, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(186, 165, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(187, 166, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(188, 167, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(189, 168, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(190, 169, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(191, 170, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(192, 171, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(193, 172, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(194, 173, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(195, 174, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(196, 175, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(197, 176, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(198, 177, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(199, 178, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(200, 179, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(201, 180, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(202, 181, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(203, 182, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(204, 183, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(205, 184, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(206, 185, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(207, 186, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(208, 187, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(209, 188, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(210, 189, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(211, 190, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(212, 191, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(213, 192, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(214, 193, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(215, 194, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(216, 195, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(217, 196, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(218, 197, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(219, 198, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(220, 199, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(221, 200, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(222, 201, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(223, 202, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(224, 203, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(225, 204, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(226, 205, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(227, 206, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(228, 207, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(229, 208, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(230, 209, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(231, 210, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(232, 211, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(233, 212, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(234, 213, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(235, 214, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(236, 215, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(237, 216, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(238, 217, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(239, 218, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(240, 219, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(241, 220, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(242, 221, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(243, 222, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(244, 223, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(245, 224, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(246, 225, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(247, 226, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(248, 227, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(249, 228, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(250, 229, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(251, 230, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(252, 231, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(253, 232, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(254, 233, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(255, 234, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(256, 235, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(257, 236, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(258, 237, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(259, 238, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(260, 239, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(261, 240, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(262, 241, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(263, 242, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(264, 243, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(265, 244, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(266, 245, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(267, 246, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(268, 247, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:53'),
(269, 248, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(270, 249, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(271, 250, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(272, 251, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(273, 252, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(274, 253, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(275, 254, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(276, 255, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(277, 256, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(278, 257, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(279, 258, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(280, 259, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(281, 260, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(282, 261, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(283, 262, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(284, 263, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(285, 264, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(286, 265, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(287, 266, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(288, 267, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(289, 268, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(290, 269, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(291, 270, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(292, 271, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(293, 272, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(294, 273, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(295, 274, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(296, 275, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(297, 276, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(298, 277, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(299, 278, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(300, 279, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(301, 280, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(302, 281, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(303, 282, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(304, 283, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(305, 284, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(306, 285, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(307, 286, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(308, 287, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(309, 288, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(310, 289, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(311, 290, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(312, 291, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(313, 292, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(314, 293, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(315, 294, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(316, 295, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(317, 296, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(318, 297, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(319, 298, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(320, 299, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(321, 300, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(322, 301, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(323, 302, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(324, 303, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(325, 304, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(326, 305, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(327, 306, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(328, 307, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(329, 308, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(330, 309, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(331, 310, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(332, 311, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(333, 312, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(334, 313, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(335, 314, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(336, 315, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(337, 316, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(338, 317, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(339, 318, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(340, 319, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(341, 320, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(342, 321, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(343, 322, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(359, 338, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(360, 339, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(361, 340, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(362, 341, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(363, 342, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(364, 343, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(365, 344, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(366, 345, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(367, 346, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(368, 347, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(369, 348, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(370, 349, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(371, 350, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(372, 351, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(373, 352, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(374, 353, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(375, 354, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(376, 355, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(377, 356, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(378, 357, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(379, 358, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(380, 359, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(381, 360, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(382, 361, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(383, 362, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(384, 363, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(385, 364, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(386, 365, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(387, 366, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(388, 367, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(389, 368, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(390, 369, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(391, 370, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(392, 371, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(393, 372, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(394, 373, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:54'),
(395, 374, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(396, 375, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(397, 376, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(398, 377, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(399, 378, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(400, 379, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(401, 380, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(402, 381, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(403, 382, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(404, 383, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(405, 384, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(406, 385, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(407, 386, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(408, 387, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(409, 388, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(410, 389, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(411, 390, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(412, 391, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(413, 392, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(414, 393, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(415, 394, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(416, 395, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(417, 396, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(418, 397, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(419, 398, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(420, 399, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(421, 400, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(422, 401, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(423, 402, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(424, 403, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(425, 404, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(426, 405, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(427, 406, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(428, 407, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(429, 408, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(430, 409, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(431, 410, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(432, 411, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(433, 412, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(434, 413, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(435, 414, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(436, 415, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(437, 416, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(438, 417, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(439, 418, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(440, 419, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(441, 420, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(442, 421, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(443, 422, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(444, 423, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(445, 424, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(446, 425, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(447, 426, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(448, 427, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(449, 428, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(450, 429, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(451, 430, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(452, 431, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(453, 432, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(454, 433, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(455, 434, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(456, 435, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(457, 436, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(458, 437, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(459, 438, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(460, 439, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(461, 440, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(462, 441, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(463, 442, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(464, 443, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(465, 444, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(466, 445, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(467, 446, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(468, 447, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(469, 448, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(470, 449, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(486, 465, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(487, 466, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(488, 467, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(489, 468, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(490, 469, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(491, 470, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(492, 471, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(493, 472, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(494, 473, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(495, 474, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(496, 475, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(497, 476, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(498, 477, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(499, 478, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(500, 479, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(501, 480, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(502, 481, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(503, 482, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(504, 483, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(505, 484, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(506, 485, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(507, 486, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(508, 487, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(509, 488, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(510, 489, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(511, 490, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(512, 491, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(513, 492, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(514, 493, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(515, 494, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(516, 495, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(517, 496, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(518, 497, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(519, 498, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(520, 499, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(521, 500, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(522, 501, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:55'),
(523, 502, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(524, 503, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(525, 504, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(526, 505, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(527, 506, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(528, 507, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(529, 508, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(530, 509, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(531, 510, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(532, 511, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(533, 512, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(534, 513, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(535, 514, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(536, 515, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(537, 516, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(538, 517, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(539, 518, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(540, 519, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(541, 520, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(542, 521, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(543, 522, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(544, 523, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(545, 524, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(546, 525, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(547, 526, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(548, 527, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(549, 528, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(550, 529, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(551, 530, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(552, 531, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(553, 532, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(554, 533, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(555, 534, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(556, 535, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(557, 536, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(558, 537, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(559, 538, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(560, 539, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(561, 540, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(562, 541, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(563, 542, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(564, 543, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(565, 544, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(566, 545, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(567, 546, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(568, 547, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(569, 548, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(570, 549, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(571, 550, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(572, 551, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(573, 552, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(574, 553, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(575, 554, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(576, 555, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(577, 556, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(578, 557, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(579, 558, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(580, 559, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(581, 560, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(582, 561, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(583, 562, 'Registered', 'Letter registered in the system', 6, '2026-01-21 15:36:56'),
(584, 512, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(585, 513, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(586, 514, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(587, 515, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(588, 516, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(589, 517, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(590, 518, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(591, 519, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(592, 520, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(593, 521, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(594, 522, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(595, 523, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(596, 524, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(597, 525, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(598, 526, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:02'),
(599, 527, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(600, 528, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(601, 529, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(602, 530, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(603, 531, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(604, 532, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(605, 533, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(606, 534, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(607, 535, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(608, 536, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(609, 537, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(610, 538, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(611, 539, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(612, 540, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(613, 541, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:09'),
(614, 542, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:45'),
(615, 543, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(616, 544, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(617, 545, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(618, 546, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(619, 547, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(620, 548, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(621, 549, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(622, 550, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(623, 551, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(624, 552, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(625, 553, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(626, 554, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(627, 555, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(628, 556, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:46'),
(629, 557, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(630, 558, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(631, 559, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(632, 560, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(633, 561, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(634, 562, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(635, 503, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(636, 504, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(637, 505, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51'),
(638, 506, 'Approved', 'Letter approved by Admin User', 1, '2026-01-21 15:41:51');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(2, '2024_01_01_000000_create_directorates_table', 1),
(3, '2024_01_01_000001_create_users_table', 1),
(4, '2024_01_01_000002_create_couriers_table', 1),
(5, '2024_01_01_000003_create_letters_table', 1),
(6, '2024_01_01_000004_create_letter_timelines_table', 1),
(7, '2024_01_01_000005_create_notifications_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('success','warning','error','info') NOT NULL DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `letter_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `letter_id`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-001 has been approved.', 1, 1, NULL, NULL),
(2, 3, 'info', 'Courier Assigned', 'A courier has been assigned to your letter LTR-2026-016.', 16, 1, NULL, NULL),
(3, 3, 'error', 'Letter Rejected', 'Your letter LTR-2026-051 has been rejected.', NULL, 1, NULL, NULL),
(4, 1, 'warning', 'Assignment Deadline Expired', 'Letter LTR-2026-001 has exceeded the 72-hour assignment deadline. It has been overdue for 24.2 hours. Recipient: Recipient 1. Please assign a courier immediately.', 1, 0, '2026-01-19 13:02:11', '2026-01-19 13:02:11'),
(5, 3, 'info', 'Letter In-Transit', 'Your letter LTR-2026-016 is now In-Transit.', 16, 0, '2026-01-19 13:14:06', '2026-01-19 13:14:06'),
(6, 6, 'success', 'Letter Approved', 'Your letter LTR-2026-054 has been approved.', 55, 0, '2026-01-19 14:56:33', '2026-01-19 14:56:33'),
(7, 6, 'success', 'Letter Approved', 'Your letter LTR-2026-055 has been approved.', 56, 0, '2026-01-19 14:59:57', '2026-01-19 14:59:57'),
(8, 6, 'success', 'Letter Approved', 'Your letter LTR-2026-051 has been approved.', 52, 0, '2026-01-19 14:59:57', '2026-01-19 14:59:57'),
(9, 6, 'success', 'Letter Approved', 'Your letter LTR-2026-053 has been approved.', 54, 0, '2026-01-19 14:59:57', '2026-01-19 14:59:57'),
(10, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-039 has been approved.', 39, 0, '2026-01-19 14:59:57', '2026-01-19 14:59:57'),
(11, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-029 has been approved.', 29, 0, '2026-01-19 14:59:58', '2026-01-19 14:59:58'),
(12, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-050 has been approved.', 50, 0, '2026-01-19 14:59:58', '2026-01-19 14:59:58'),
(13, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-006 has been approved.', 6, 0, '2026-01-19 14:59:58', '2026-01-19 14:59:58'),
(14, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-021 has been approved.', 21, 0, '2026-01-19 14:59:58', '2026-01-19 14:59:58'),
(15, 3, 'success', 'Letter Approved', 'Your letter LTR-2026-048 has been approved.', 48, 0, '2026-01-19 14:59:58', '2026-01-19 14:59:58'),
(16, 6, 'error', 'Letter Rejected', 'Your letter LTR-2026-056 has been rejected.', NULL, 0, '2026-01-19 15:00:08', '2026-01-19 15:00:08'),
(17, 6, 'error', 'Letter Rejected', 'Your letter LTR-2026-052 has been rejected.', NULL, 0, '2026-01-19 15:00:08', '2026-01-19 15:00:08'),
(18, 3, 'error', 'Letter Rejected', 'Your letter LTR-2026-038 has been rejected.', NULL, 0, '2026-01-19 15:00:08', '2026-01-19 15:00:08'),
(19, 3, 'error', 'Letter Rejected', 'Your letter LTR-2026-013 has been rejected.', NULL, 0, '2026-01-19 15:00:08', '2026-01-19 15:00:08'),
(20, 3, 'error', 'Letter Rejected', 'Your letter LTR-2026-004 has been rejected.', NULL, 0, '2026-01-19 15:00:08', '2026-01-19 15:00:08'),

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rate_limits`
--

CREATE TABLE `rate_limits` (
  `id` int(10) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `requests` int(11) NOT NULL DEFAULT 1,
  `window_start` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rate_limits`
--

INSERT INTO `rate_limits` (`id`, `ip_address`, `endpoint`, `requests`, `window_start`) VALUES
(1, '::1', '/login', 1, '2026-01-19 13:03:01'),
(2, '::1', '/login', 3, '2026-01-19 14:37:10'),
(3, '::1', '/login', 1, '2026-01-19 14:50:24'),
(4, '::1', '/login', 1, '2026-01-19 15:00:20'),
(5, '::1', '/login', 2, '2026-01-19 15:08:38'),
(6, '::1', '/login', 1, '2026-01-19 16:03:18'),
(7, '::1', '/login', 4, '2026-01-19 16:17:33'),
(8, '::1', '/login', 1, '2026-01-19 16:36:19'),
(9, '::1', '/login', 3, '2026-01-20 11:37:31'),
(10, '::1', '/login', 3, '2026-01-21 15:35:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ODU','Admin','Management') NOT NULL DEFAULT 'ODU',
  `directorate_id` bigint(20) UNSIGNED DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `directorate_id`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@ccmts.com', NULL, '$2y$10$sgM.tfjRYcWyLU/XWtpi9ugVbQaWWyu9U9MXCUzAxpCrBECQzAcYK', 'Admin', NULL, NULL, NULL, NULL),
(2, 'Management User', 'management@ccmts.com', NULL, '$2y$10$sgM.tfjRYcWyLU/XWtpi9ugVbQaWWyu9U9MXCUzAxpCrBECQzAcYK', 'Management', NULL, NULL, NULL, NULL),
(3, 'HR Officer', 'hr@ccmts.com', NULL, '$2y$10$sgM.tfjRYcWyLU/XWtpi9ugVbQaWWyu9U9MXCUzAxpCrBECQzAcYK', 'ODU', 1, NULL, NULL, NULL),
(4, 'Finance Officer', 'finance@ccmts.com', NULL, '$2y$10$sgM.tfjRYcWyLU/XWtpi9ugVbQaWWyu9U9MXCUzAxpCrBECQzAcYK', 'ODU', 2, NULL, NULL, NULL),
(5, 'Accounts Officer', 'accounts@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 7, NULL, NULL, NULL),
(6, 'IT Officer', 'it@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 3, NULL, NULL, NULL),
(7, 'Tax Audit Officer', 'taxaudit@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 8, NULL, NULL, NULL),
(8, 'RMU Officer', 'rmu@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 9, NULL, NULL, NULL),
(9, 'Review Officer', 'review@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 10, NULL, NULL, NULL),
(10, 'Entertainment Officer', 'entertainment@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 11, NULL, NULL, NULL),
(11, 'PIT Officer', 'pit@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 12, NULL, NULL, NULL),
(12, 'Legal Officer', 'legal@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 13, NULL, NULL, NULL),
(13, 'Informal Sector Officer', 'informalsector@lirs.gov.ng', NULL, '$2y$10$JUE0GsFBhPb/gVVCx8r/UOrRa.RlNfxa.xT0lCVMhD63UaI6iUEiW', 'ODU', 14, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `couriers`
--
ALTER TABLE `couriers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `directorates`
--
ALTER TABLE `directorates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `directorates_code_unique` (`code`);

--
-- Indexes for table `letters`
--
ALTER TABLE `letters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `letters_tracking_id_unique` (`tracking_id`),
  ADD KEY `letters_sender_directorate_id_foreign` (`sender_directorate_id`),
  ADD KEY `letters_created_by_foreign` (`created_by`),
  ADD KEY `letters_courier_id_foreign` (`courier_id`),
  ADD KEY `letters_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `letter_timelines`
--
ALTER TABLE `letter_timelines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `letter_timelines_letter_id_foreign` (`letter_id`),
  ADD KEY `letter_timelines_user_id_foreign` (`user_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_foreign` (`user_id`),
  ADD KEY `notifications_letter_id_foreign` (`letter_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip_endpoint` (`ip_address`,`endpoint`),
  ADD KEY `idx_window_start` (`window_start`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_directorate_id_foreign` (`directorate_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `couriers`
--
ALTER TABLE `couriers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `directorates`
--
ALTER TABLE `directorates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `letters`
--
ALTER TABLE `letters`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=563;

--
-- AUTO_INCREMENT for table `letter_timelines`
--
ALTER TABLE `letter_timelines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=884;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=323;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rate_limits`
--
ALTER TABLE `rate_limits`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `letters`
--
ALTER TABLE `letters`
  ADD CONSTRAINT `letters_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `letters_courier_id_foreign` FOREIGN KEY (`courier_id`) REFERENCES `couriers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `letters_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `letters_sender_directorate_id_foreign` FOREIGN KEY (`sender_directorate_id`) REFERENCES `directorates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `letter_timelines`
--
ALTER TABLE `letter_timelines`
  ADD CONSTRAINT `letter_timelines_letter_id_foreign` FOREIGN KEY (`letter_id`) REFERENCES `letters` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `letter_timelines_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_letter_id_foreign` FOREIGN KEY (`letter_id`) REFERENCES `letters` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_directorate_id_foreign` FOREIGN KEY (`directorate_id`) REFERENCES `directorates` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
