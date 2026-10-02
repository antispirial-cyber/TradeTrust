-- TRADETRUST DATABASE SCHEMA (Architecture.txt)
-- Database: tradetrust_db

CREATE DATABASE IF NOT EXISTS tradetrust_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tradetrust_db;

-- 1. Traders Table
CREATE TABLE IF NOT EXISTS traders (
    trader_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    business_name VARCHAR(150) NOT NULL,
    business_desc TEXT,
    role ENUM('WHOLESALER','RETAILER') NOT NULL,
    cluster VARCHAR(100) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    photo_path VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    trust_score DECIMAL(4,2) DEFAULT 10.00,
    score_frozen BOOLEAN DEFAULT FALSE,
    score_before_freeze DECIMAL(4,2),
    is_verified_badge BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reported_id INT NOT NULL,
    description TEXT NOT NULL,
    amount_disputed DECIMAL(12,2),
    incident_date DATE NOT NULL,
    proof_path VARCHAR(255),
    status ENUM('ROUND_1_PENDING','ROUND_1_COUNTER_FILED','ROUND_2_PENDING','ROUND_2_COUNTER_FILED','ESCALATED_TO_ADMIN','APPROVED','REJECTED') DEFAULT 'ROUND_1_PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES traders(trader_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 3. Complaint Rounds Table
CREATE TABLE IF NOT EXISTS complaint_rounds (
    round_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    filed_by INT NOT NULL,
    round_number INT NOT NULL,
    description TEXT NOT NULL,
    proof_path VARCHAR(255),
    filed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (filed_by) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 4. Ledger Entries Table
CREATE TABLE IF NOT EXISTS ledger_entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    party_name VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    entry_type ENUM('CREDIT_GIVEN','CREDIT_RECEIVED') NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    status ENUM('PENDING','PAID','OVERDUE') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 5. Connections Table
CREATE TABLE IF NOT EXISTS connections (
    connection_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('PENDING','ACCEPTED','DECLINED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (requester_id, receiver_id),
    FOREIGN KEY (requester_id) REFERENCES traders(trader_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    link_ref VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 7. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Trader Settings Table
CREATE TABLE IF NOT EXISTS trader_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    trader_id INT NOT NULL UNIQUE,
    accent_color VARCHAR(10) DEFAULT '#1E6FFB',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trader_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- Seed Data (Default Password for test accounts: password123 -> SHA-256: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)
INSERT IGNORE INTO traders (trader_id, name, phone, business_name, business_desc, role, cluster, sector, password_hash, trust_score, is_verified_badge, created_at)
VALUES
(1, 'Rajesh Mehta', '9820012345', 'Mehta Jewellers Retail', 'Retail showroom in Zaveri Bazaar specializing in bridal jewellery, temple collections, and certified diamonds.', 'RETAILER', 'Zaveri Bazaar', 'Ornaments & Jewellery', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 10.00, TRUE, '2023-01-15 10:00:00'),
(2, 'Bhavin Shah', '9820054321', 'Shah Bullion & Pearls', 'Wholesale supplier of pearl strings and pure silver bullions.', 'RETAILER', 'Zaveri Bazaar', 'Ornaments & Jewellery', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 10.00, TRUE, '2023-04-10 11:30:00'),
(3, 'Naveen Chordia', '9820198765', 'Navkar Diamond & Gems', 'Wholesale supplier of loose certified solitaires, polki, and uncut diamonds catering to high-end jewellery houses.', 'WHOLESALER', 'Zaveri Bazaar', 'Ornaments & Jewellery', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 10.00, TRUE, '2022-11-20 09:15:00'),
(4, 'Zubin Zaveri', '9820234567', 'Zaveri Gold House', 'Renowned retailer of 22K, 18K and silver jewellery with custom design services.', 'RETAILER', 'Zaveri Bazaar', 'Gold & Silver Jewellery', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 10.00, TRUE, '2023-02-01 14:00:00'),
(5, 'Sonal Parekh', '9820345678', 'Sonal Gems & Crafts', 'Supplier of certified gemstones, beads and jewellery raw materials for global markets.', 'WHOLESALER', 'Zaveri Bazaar', 'Precious Stones', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 9.80, TRUE, '2023-03-14 16:45:00'),
(6, 'Dharmesh Vora', '9820456789', 'Dadar Fabrics Emporium', 'Wholesale textiles, cotton weaves, and ethnic dress materials distributing across Greater Mumbai.', 'WHOLESALER', 'Dadar Market', 'Fabrics', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 8.50, TRUE, '2023-05-18 10:00:00'),
(7, 'Mohanlal Silk Traders', '9820567890', 'Mangaldas Silk House', 'Bulk distributors of pure Banarasi, Kanjeevaram and raw silk fabrics.', 'WHOLESALER', 'Mangaldas Market', 'Fabrics', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 7.20, FALSE, '2023-08-22 12:00:00'),
(8, 'Lalit Electronics', '9820678901', 'Lamington Component Hub', 'Commercial microchips, power supplies, and test equipment retailer.', 'RETAILER', 'Lamington Road', 'Electronics', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 4.80, FALSE, '2023-09-05 13:20:00'),
(9, 'Chetan Stationery Co.', '9820789012', 'Crawford Stationery Depot', 'Bulk paper distributor, packaging supplier, and corporate stationery importer.', 'WHOLESALER', 'Crawford Market', 'Stationery', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 2.10, FALSE, '2023-10-12 15:10:00');

-- Initial Settings
INSERT IGNORE INTO trader_settings (setting_id, trader_id, accent_color)
VALUES (1, 1, '#1E6FFB');

-- Initial Connections
INSERT IGNORE INTO connections (connection_id, requester_id, receiver_id, status)
VALUES
(1, 1, 3, 'ACCEPTED'),
(2, 1, 4, 'ACCEPTED'),
(3, 1, 5, 'ACCEPTED');

-- Initial Admin (username: admin, password: password123)
INSERT IGNORE INTO admins (admin_id, username, password_hash)
VALUES (1, 'admin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');
