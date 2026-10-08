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
    status ENUM('ROUND_1_PENDING','ROUND_1_COUNTER_FILED','ROUND_2_PENDING','ROUND_2_COUNTER_FILED','ESCALATED_TO_ADMIN','APPROVED','REJECTED','RETAKE_REQUESTED','RETAKE_APPROVED') DEFAULT 'ROUND_1_PENDING',
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

-- Official Seed Data (Password for all traders and admin: tradetrust -> SHA-256: e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a)
INSERT IGNORE INTO traders (trader_id, name, phone, business_name, business_desc, role, cluster, sector, password_hash, trust_score, is_verified_badge, created_at)
VALUES
(1, 'Rajpurohit Bangles', '9820011111', 'Rajpurohit Bangles', 'Wholesale manufacturer and distributor of traditional bangles, bridal chudas, and ethnic ornaments.', 'WHOLESALER', 'Zaveri Bazaar', 'Ornaments & Jewellery', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE, '2024-01-10 10:00:00'),
(2, 'Sharma Electronics', '9820022222', 'Sharma Electronics', 'Retailer and distributor of commercial electronics, test meters, and hardware components.', 'RETAILER', 'Lamington Road', 'Electronics', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE, '2024-02-15 11:30:00'),
(3, 'Seliya Stationary', '9820033333', 'Seliya Stationary', 'Bulk paper supplier, commercial printing stationery, and office ledger materials.', 'WHOLESALER', 'Crawford Market', 'Stationery', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE, '2024-03-20 09:15:00'),
(4, 'Sankhe Jwells', '9820044444', 'Sankhe Jwells', 'Showroom specializing in hallmarked gold jewellery, silver ornaments, and custom designs.', 'RETAILER', 'Zaveri Bazaar', 'Gold & Silver Jewellery', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE, '2024-04-05 14:00:00');

-- Universal Admin (username: Admin, password: tradetrust -> SHA-256: e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a)
DELETE FROM admins;
INSERT INTO admins (admin_id, username, password_hash)
VALUES (1, 'Admin', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a');

