-- Seed Script for Letter Delivery Management System
-- This script populates the database with comprehensive test data

-- ========================================
-- 0. CLEANUP DATABASE
-- ========================================
SELECT 'Cleaning up existing data...' AS 'LOG';
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE letter_timelines;
TRUNCATE TABLE letters;
TRUNCATE TABLE couriers;
TRUNCATE TABLE users;
TRUNCATE TABLE directorates;
TRUNCATE TABLE password_resets;
TRUNCATE TABLE personal_access_tokens;
TRUNCATE TABLE rate_limits;
SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Cleanup completed.' AS 'LOG';

-- ========================================
-- 1. DIRECTORATE DATA
-- ========================================
SELECT 'Section 1: Inserting directorates...' AS 'LOG';
INSERT INTO directorates (name, code, description, created_at, updated_at) VALUES
('Finance Department', 'FIN', 'Handles all financial operations and budgeting', NOW(), NOW()),
('Human Resources', 'HR', 'Personnel management and employee services', NOW(), NOW()),
('Operations', 'OPS', 'Day-to-day operational management', NOW(), NOW()),
('Legal Department', 'LEG', 'Legal affairs and compliance', NOW(), NOW()),
('Information Technology', 'IT', 'Technology infrastructure and support', NOW(), NOW()),
('Communications', 'COM', 'Public relations and internal communications', NOW(), NOW()),
('Procurement', 'PROC', 'Procurement and supply chain management', NOW(), NOW()),
('Audit', 'AUD', 'Internal and external audit functions', NOW(), NOW());

-- ========================================
-- 2. USER DATA
-- ========================================
SELECT 'Section 2: Inserting users...' AS 'LOG';
-- All seeded accounts share the password: Password123!
-- (previous hash here was a truncated/invalid bcrypt string that could never match any password)
INSERT INTO users (name, email, password, role, directorate_id, email_verified_at, created_at, updated_at) VALUES
-- Admins
('Rasheed', 'Rasheed.admin@lirs.net', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Admin', 1, NOW(), NOW(), NOW()),

-- Management Users
('David', 'David.IT@lirs.net', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Management', 5, NOW(), NOW(), NOW()),
('Ifedayo', 'Ifedayo.IT@lirs.net', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Management', 5, NOW(), NOW(), NOW()),

-- ODU Users (Regular Users)
('John Doe', 'john.doe@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 1, NOW(), NOW(), NOW()),
('Jane Smith', 'jane.smith@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 2, NOW(), NOW(), NOW()),
('Michael Johnson', 'michael.johnson@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 3, NOW(), NOW(), NOW()),
('Sarah Williams', 'sarah.williams@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 4, NOW(), NOW(), NOW()),
('David Brown', 'david.brown@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 5, NOW(), NOW(), NOW()),
('Emma Davis', 'emma.davis@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 6, NOW(), NOW(), NOW()),
('Robert Miller', 'robert.miller@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 7, NOW(), NOW(), NOW()),
('Lisa Anderson', 'lisa.anderson@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'ODU', 8, NOW(), NOW(), NOW()),

-- Courier Users
('Beta Courier', 'beta.courier@gmail.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW()),
('Laudable Courier', 'laudable.courier@gmail.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW()),
('Tunde Okafor', 'tunde.okafor@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW()),
('Blessing Adeyemi', 'blessing.adeyemi@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW()),
('Chinedu Okafor', 'chinedu.okafor@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW()),
('Zainab Mohammed', 'zainab.mohammed@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW()),
('Olu Adebayo', 'olu.adebayo@letterdelivery.com', '$2a$10$nxCx8oO9Qq3W3.e0BAuUfuiYEOBiyxrJp5KCzceqiDBbam54dOh9y', 'Courier', 3, NOW(), NOW(), NOW());

-- ========================================
-- 3. COURIER PROFILES
-- ========================================
SELECT 'Section 3: Inserting courier profiles...' AS 'LOG';
INSERT INTO couriers (user_id, name, phone, email, availability, active_tasks, performance, completed_deliveries, base_lga, other_branches_lga, created_at, updated_at) VALUES
(12, 'Beta Courier', '08012345601', 'beta.courier@gmail.com', true, 3, 98, 152, 'IKEJA', '["VICTORIA_ISLAND", "SURULERE"]', NOW(), NOW()),
(13, 'Laudable Courier', '08012345602', 'laudable.courier@gmail.com', true, 2, 95, 128, 'VICTORIA_ISLAND', '["IKOYI", "LAGOS_ISLAND"]', NOW(), NOW()),
(14, 'Tunde Okafor', '08012345603', 'tunde.okafor@letterdelivery.com', true, 4, 92, 145, 'SURULERE', '["YABA", "IKOYI"]', NOW(), NOW()),
(15, 'Blessing Adeyemi', '08012345604', 'blessing.adeyemi@letterdelivery.com', true, 2, 100, 167, 'IKORODU', '["EPE", "BADAGRY"]', NOW(), NOW()),
(16, 'Chinedu Okafor', '08012345605', 'chinedu.okafor@letterdelivery.com', false, 1, 88, 98, 'ALIMOSHO', '["OSHODI", "AGEGE"]', NOW(), NOW()),
(17, 'Zainab Mohammed', '08012345606', 'zainab.mohammed@letterdelivery.com', true, 3, 96, 156, 'IKEJA', '["OJODU", "MUSHIN"]', NOW(), NOW()),
(18, 'Olu Adebayo', '08012345607', 'olu.adebayo@letterdelivery.com', true, 1, 94, 134, 'ETI_OSA', '["VICTORIA_ISLAND", "IKOYI"]', NOW(), NOW());

-- ========================================
-- 4. LETTER DATA
-- ========================================
SELECT 'Section 4: Inserting letter data...' AS 'LOG';
INSERT INTO letters (tracking_id, sender_directorate_id, created_by, recipient_name, recipient_address, lga_address, subject, submitted_by, priority, status, liability_value, liability_year, courier_id, assigned_at, approved_by, approved_at, delivered_at, attachment_path, pod_image_path, notes, created_at, updated_at) VALUES

-- Pending Approval Letters
('TRK-2025-001', 1, 7, 'Ade Ogunwale', '123 Lekki Phase 1, Lagos', 'VICTORIA_ISLAND', 'Quarterly Financial Report Submission', 'Finance Officer 1', 'High', 'Pending Approval', 50000.00, '2025', NULL, NULL, NULL, NULL, NULL, '/attachments/letter_001.pdf', NULL, 'Contains sensitive financial data', NOW(), NOW()),
('TRK-2025-002', 2, 8, 'Mrs. Patricia Adeyemi', '456 Yaba Road, Lagos', 'YABA', 'HR Policy Update Notice', 'HR Officer 1', 'Medium', 'Pending Approval', 0.00, '2025', NULL, NULL, NULL, NULL, NULL, '/attachments/letter_002.pdf', NULL, 'Policy effective from March 1st', NOW(), NOW()),
('TRK-2025-003', 3, 9, 'Chief Engineer Akinbode', '789 Ikoyi Drive, Lagos', 'IKOYI', 'Operational Excellence Award', 'Operations Coordinator', 'Low', 'Pending Approval', 0.00, '2025', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Commendation letter', NOW(), NOW()),

-- Approved But Not Assigned
('TRK-2025-004', 4, 10, 'Barrister Oluwaseun Adebayo', '321 Surulere Street, Lagos', 'SURULERE', 'Legal Compliance Review', 'Legal Officer', 'High', 'Approved', 75000.00, '2025', NULL, NULL, 3, NOW(), NULL, '/attachments/letter_004.pdf', NULL, 'Requires urgent delivery', NOW(), NOW()),
('TRK-2025-005', 5, 11, 'Engr. Tunde Akinyemi', '654 Ojodu Lane, Lagos', 'OJODU', 'IT Infrastructure Upgrade Notice', 'IT Specialist', 'Medium', 'Approved', 0.00, '2025', NULL, NULL, 3, NOW(), NULL, '/attachments/letter_005.pdf', NULL, 'System maintenance schedule included', NOW(), NOW()),

-- Assigned Letters
('TRK-2025-006', 6, 4, 'Mr. Segun Alade', '987 Ikeja Main Road, Lagos', 'IKEJA', 'Press Release Distribution', 'Communications Officer', 'Low', 'Assigned', 0.00, '2025', 6, '2025-02-01 08:30:00', 2, '2025-02-01 08:00:00', NULL, NULL, NULL, 'For public announcement', NOW(), NOW()),
('TRK-2025-007', 7, 5, 'Dr. Adebola Osibanjo', '147 Victoria Island, Lagos', 'VICTORIA_ISLAND', 'Procurement Tender Notice', 'Procurement Officer', 'High', 'Assigned', 125000.00, '2025', 7, '2025-02-02 09:15:00', 2, '2025-02-02 09:00:00', NULL, '/attachments/letter_007.pdf', NULL, 'Sealed bid submission required', NOW(), NOW()),

-- In-Transit Letters
('TRK-2025-008', 8, 6, 'Mrs. Folake Oladele', '258 Oshodi Avenue, Lagos', 'OSHODI', 'Audit Report Distribution', 'Audit Officer', 'High', 'In-Transit', 200000.00, '2025', 3, '2025-02-03 07:45:00', 3, '2025-02-03 07:30:00', NULL, '/attachments/letter_008.pdf', NULL, 'Confidential - Do not open', NOW(), NOW()),
('TRK-2025-009', 1, 7, 'Mr. Kamal Adeyokunbo', '369 Ikorodu Road, Lagos', 'IKORODU', 'Budget Allocation Notice', 'Finance Officer 2', 'High', 'In-Transit', 500000.00, '2025', 4, '2025-02-03 10:20:00', 3, '2025-02-03 10:00:00', NULL, '/attachments/letter_009.pdf', NULL, 'Approved by CFO', NOW(), NOW()),
('TRK-2025-010', 2, 8, 'Ms. Ngozi Eze', '456 Badagry Expressway, Lagos', 'BADAGRY', 'Staff Training Schedule', 'HR Coordinator', 'Medium', 'In-Transit', 0.00, '2025', 1, '2025-02-03 11:00:00', 2, '2025-02-03 10:45:00', NULL, '/attachments/letter_010.pdf', NULL, 'Training starts next month', NOW(), NOW()),

-- Delivered Letters
('TRK-2025-011', 3, 9, 'Engr. Omolara Oyetunde', '789 Alimosho Way, Lagos', 'ALIMOSHO', 'Project Completion Certificate', 'Operations Manager', 'Medium', 'Delivered', 0.00, '2025', 5, '2025-02-01 08:00:00', 3, '2025-02-01 07:45:00', '2025-02-01 14:30:00', NULL, '/pod/letter_011_pod.jpg', 'Successfully delivered', NOW(), NOW()),
('TRK-2025-012', 4, 10, 'Barrister Chukwudi Nwosu', '321 Agege Road, Lagos', 'AGEGE', 'Contract Amendment Notice', 'Legal Counsel', 'High', 'Delivered', 300000.00, '2025', 6, '2025-02-01 09:30:00', 3, '2025-02-01 09:15:00', '2025-02-01 15:45:00', '/attachments/letter_012.pdf', '/pod/letter_012_pod.jpg', 'Signed by recipient', NOW(), NOW()),
('TRK-2025-013', 5, 11, 'Dr. Afolabi Okonkwo', '654 Ajeromi Road, Lagos', 'AJEROMI_IFELODUN', 'System Access Credentials', 'IT Director', 'High', 'Delivered', 0.00, '2025', 7, '2025-02-02 07:00:00', 2, '2025-02-02 06:45:00', '2025-02-02 13:15:00', NULL, '/pod/letter_013_pod.jpg', 'Delivered in secure envelope', NOW(), NOW()),
('TRK-2025-014', 6, 4, 'Ms. Amara Nkosi', '987 Amuwo Odofin Estate, Lagos', 'AMUWO_ODOFIN', 'Media Kit Distribution', 'Communications Manager', 'Low', 'Delivered', 0.00, '2025', 2, '2025-02-01 08:15:00', 2, '2025-02-01 08:00:00', '2025-02-01 11:45:00', NULL, '/pod/letter_014_pod.jpg', 'Multiple copies delivered', NOW(), NOW()),
('TRK-2025-015', 7, 5, 'Mr. Victor Adeyemi', '147 Apapa Wharf, Lagos', 'APAPA', 'Supplier Payment Authorization', 'Procurement Manager', 'High', 'Delivered', 1500000.00, '2025', 3, '2025-02-02 06:30:00', 3, '2025-02-02 06:15:00', '2025-02-02 10:00:00', '/attachments/letter_015.pdf', '/pod/letter_015_pod.jpg', 'Urgent financial transaction', NOW(), NOW()),
('TRK-2025-016', 8, 6, 'Mr. Kunle Balogun', '258 Egbeda Junction, Lagos', 'EGBEDA', 'Quarterly Audit Findings', 'Lead Auditor', 'High', 'Delivered', 350000.00, '2025', 4, '2025-02-02 09:00:00', 3, '2025-02-02 08:45:00', '2025-02-02 12:30:00', '/attachments/letter_016.pdf', '/pod/letter_016_pod.jpg', 'Management response required', NOW(), NOW()),

-- Undelivered Letters
('TRK-2025-017', 1, 7, 'Mr. Ade Kolawole', '369 Eti-Osa Road, Lagos', 'ETI_OSA', 'Benefit Realization Report', 'Finance Analyst', 'Medium', 'Undelivered', 0.00, '2025', 6, '2025-02-03 12:00:00', 2, '2025-02-03 11:45:00', NULL, '/attachments/letter_017.pdf', NULL, 'Recipient not available - retry scheduled', NOW(), NOW()),
('TRK-2025-018', 2, 8, 'Ms. Folake Akinsanya', '456 Ifako Ijaiye Street, Lagos', 'IFAKO_IJAIYE', 'Performance Appraisal Results', 'HR Business Partner', 'Low', 'Undelivered', 0.00, '2025', 1, '2025-02-03 13:30:00', 2, '2025-02-03 13:15:00', NULL, '/attachments/letter_018.pdf', NULL, 'Address not found', NOW(), NOW()),
('TRK-2025-019', 3, 9, 'Chief Bayo Oladimeji', '789 Mushin Road, Lagos', 'MUSHIN', 'Partnership Agreement', 'Operations Liaison', 'High', 'Undelivered', 500000.00, '2025', 5, '2025-02-03 14:45:00', 3, '2025-02-03 14:30:00', NULL, '/attachments/letter_019.pdf', NULL, 'Recipient refused delivery', NOW(), NOW()),
('TRK-2025-020', 4, 10, 'Dr. Chidi Ekwueme', '321 Yaba Straight, Lagos', 'YABA', 'Conflict Resolution Notice', 'Senior Legal Officer', 'High', 'Undelivered', 250000.00, '2025', 7, '2025-02-03 15:20:00', 2, '2025-02-03 15:00:00', NULL, '/attachments/letter_020.pdf', NULL, 'Delivery attempts exhausted', NOW(), NOW());

-- ========================================
-- 5. LETTER TIMELINE DATA
-- ========================================
SELECT 'Section 5: Inserting letter timeline data...' AS 'LOG';
INSERT INTO letter_timelines (letter_id, status, description, user_id, created_at) VALUES
-- Letter 1 Timeline
(1, 'Pending Approval', 'Letter created and awaiting approval', 7, NOW()),

-- Letter 6 Timeline
(6, 'Pending Approval', 'Letter created by Communications Officer', 4, NOW()),
(6, 'Approved', 'Letter approved for delivery', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 'Assigned', 'Assigned to courier Zainab Mohammed', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 'In-Transit', 'Letter picked up and in transit', 17, DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Letter 8 Timeline
(8, 'Pending Approval', 'Audit report letter created', 6, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 'Approved', 'Approved for distribution', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 'Assigned', 'Assigned to courier Tunde Okafor', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 'In-Transit', 'Letter in transit to recipient', 14, DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Letter 11 Timeline
(11, 'Pending Approval', 'Project completion letter created', 9, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(11, 'Approved', 'Approved by Operations Manager', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(11, 'Assigned', 'Assigned to Chinedu Okafor', 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(11, 'In-Transit', 'Letter in transit', 16, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(11, 'Delivered', 'Letter successfully delivered', 16, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Letter 12 Timeline
(12, 'Pending Approval', 'Contract amendment notice created', 10, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 'Approved', 'Approved by Legal Manager', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 'Assigned', 'Assigned to Zainab Mohammed', 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(12, 'In-Transit', 'Letter in transit', 17, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(12, 'Delivered', 'Contract amendment delivered to Barrister Nwosu', 17, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Letter 15 Timeline
(15, 'Pending Approval', 'Payment authorization letter created', 5, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(15, 'Approved', 'Approved by Procurement Manager', 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(15, 'Assigned', 'Assigned to courier Tunde Okafor', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(15, 'In-Transit', 'Urgent payment authorization in transit', 14, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(15, 'Delivered', 'Payment authorization successfully delivered', 14, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ========================================
-- 6. NOTIFICATION DATA
-- ========================================
SELECT 'Section 6: Inserting notification data...' AS 'LOG';
INSERT INTO notifications (user_id, type, title, message, letter_id, is_read, created_at, updated_at) VALUES
-- Notifications for various users about their letters
(7, 'info', 'Letter Created', 'Your letter TRK-2025-001 has been created and is pending approval.', 1, false, NOW(), NOW()),
(3, 'warning', 'Approval Required', 'Letter TRK-2025-001 from Finance Department requires your approval.', 1, true, NOW(), NOW()),
(2, 'success', 'Letter Approved', 'Letter TRK-2025-006 has been approved and ready for assignment.', 6, true, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(17, 'info', 'Letter Assigned', 'You have been assigned letter TRK-2025-006 for delivery.', 6, true, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 'success', 'Letter Delivered', 'Your letter TRK-2025-014 has been successfully delivered.', 14, true, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(14, 'warning', 'Delivery Failed', 'Delivery attempt for letter TRK-2025-018 failed - address not found.', 18, false, NOW(), NOW()),
(14, 'error', 'Undelivered Letter', 'Letter TRK-2025-020 could not be delivered after multiple attempts.', 20, false, NOW(), NOW()),
(3, 'info', 'Performance Alert', 'Courier performance summary: 5 successful deliveries this week.', NULL, true, NOW(), NOW()),
(2, 'success', 'Daily Report', 'Daily delivery report completed - 8 letters delivered successfully.', NULL, true, NOW(), NOW()),
(16, 'info', 'New Assignment', 'You have been assigned 2 new letters for delivery.', NULL, false, NOW(), NOW());

-- ========================================
-- 7. ACTIVITY LOG DATA
-- ========================================
SELECT 'Section 7: Inserting activity log data...' AS 'LOG';
INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent, created_at) VALUES
(3, 'LOGIN', 'Admin login to system', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(7, 'LETTER_CREATED', 'Created letter TRK-2025-001', '192.168.1.101', 'Mozilla/5.0 (MacOS)', DATE_SUB(NOW(), INTERVAL 1.5 HOUR)),
(2, 'LETTER_APPROVED', 'Approved letter TRK-2025-006', '192.168.1.102', 'Mozilla/5.0 (iPhone)', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(17, 'LETTER_ASSIGNED', 'Accepted assignment for TRK-2025-006', '192.168.1.103', 'Mozilla/5.0 (Android)', DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
(14, 'DELIVERY_INITIATED', 'Started delivery of TRK-2025-008', '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(14, 'DELIVERY_COMPLETED', 'Completed delivery of TRK-2025-013', '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(3, 'LOGOUT', 'Admin logout from system', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(16, 'LOGIN', 'Courier login to system', '192.168.1.105', 'Mozilla/5.0 (Android)', NOW()),
(9, 'LETTER_CREATED', 'Created letter TRK-2025-003', '192.168.1.101', 'Mozilla/5.0 (MacOS)', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 'REPORT_GENERATED', 'Generated daily delivery report', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- ========================================
-- End of Seed Script
-- ========================================
SELECT 'Seed script completed successfully!' AS 'LOG';