-- TradeTrust Unified Database Setup Script
-- Creates the database, all 7 tables, and inserts the 4 official merchants + Admin account.
-- Run this single command on MySQL:
--   Get-Content schema.sql | mysql -u root -p

DROP DATABASE IF EXISTS tradetrust_db;
CREATE DATABASE tradetrust_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tradetrust_db;

-- 1. Traders Table (Stores merchant cards, scores, and preferences)
CREATE TABLE traders (
    trader_id           INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(15)  NOT NULL UNIQUE,
    business_name       VARCHAR(150) NOT NULL,
    business_desc       TEXT,
    role                ENUM('WHOLESALER','RETAILER') NOT NULL,
    cluster             VARCHAR(100) NOT NULL,
    sector              VARCHAR(100) NOT NULL,
    photo_path          VARCHAR(255),
    password_hash       VARCHAR(255) NOT NULL,
    trust_score         DECIMAL(4,2) NOT NULL DEFAULT 10.00,
    score_frozen        BOOLEAN NOT NULL DEFAULT FALSE,
    score_before_freeze DECIMAL(4,2),
    is_verified_badge   BOOLEAN NOT NULL DEFAULT FALSE,
    accent_color        VARCHAR(10) NOT NULL DEFAULT '#1E6FFB',
    theme_mode          VARCHAR(10) NOT NULL DEFAULT 'light',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaints Table (Disputes, evidence paths, and retake withdrawal statuses)
CREATE TABLE complaints (
    complaint_id         INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id          INT NOT NULL,
    reported_id          INT NOT NULL,
    description          TEXT NOT NULL,
    amount_disputed      DECIMAL(12,2) NOT NULL DEFAULT 0,
    incident_date        DATE NOT NULL,
    proof_path           VARCHAR(255),
    proof_name           VARCHAR(255),
    status               ENUM('ESCALATED_TO_ADMIN','APPROVED','REJECTED','RETAKE_REQUESTED','RETAKE_APPROVED','RETAKE_REJECTED')
                         NOT NULL DEFAULT 'ESCALATED_TO_ADMIN',
    status_before_retake VARCHAR(30),
    score_deduction      DECIMAL(4,2) NOT NULL DEFAULT 0,
    resolved_at          DATETIME,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES traders(trader_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 3. Ledger Entries Table (Private merchant credit book)
CREATE TABLE ledger_entries (
    entry_id    INT AUTO_INCREMENT PRIMARY KEY,
    owner_id    INT NOT NULL,
    party_name  VARCHAR(150) NOT NULL,
    amount      DECIMAL(12,2) NOT NULL,
    entry_type  ENUM('CREDIT_GIVEN','CREDIT_RECEIVED') NOT NULL,
    entry_date  DATE NOT NULL,
    description TEXT,
    status      ENUM('PENDING','PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 4. Connections Table (Mutual bazaar relationships)
CREATE TABLE connections (
    connection_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id  INT NOT NULL,
    receiver_id   INT NOT NULL,
    status        ENUM('PENDING','ACCEPTED','DECLINED') NOT NULL DEFAULT 'PENDING',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (requester_id, receiver_id),
    FOREIGN KEY (requester_id) REFERENCES traders(trader_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id)  REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 5. Notifications Table (Private dispute and connection alerts)
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id    INT NOT NULL,
    type            VARCHAR(50) NOT NULL,
    message         TEXT NOT NULL,
    link_ref        VARCHAR(255),
    ref_id          INT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES traders(trader_id) ON DELETE CASCADE
);

-- 6. Admins Table
CREATE TABLE admins (
    admin_id      INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 7. Sessions Table
CREATE TABLE sessions (
    token      VARCHAR(64) PRIMARY KEY,
    user_id    INT NOT NULL,
    role       ENUM('TRADER','ADMIN') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- OFFICIAL SEED DATA: 4 TRADERS + 1 ADMIN
-- Password for all accounts is "tradetrust" (SHA-256 Hashed)
-- =========================================================================

INSERT INTO traders (trader_id, name, phone, business_name, business_desc, role, cluster, sector, password_hash, trust_score, is_verified_badge) VALUES
(1, 'Rajpurohit Bangles', '9820011111', 'Rajpurohit Bangles', 'Wholesale manufacturer and distributor of traditional bangles, bridal chudas, and ethnic ornaments.', 'WHOLESALER', 'Zaveri Bazaar',   'Ornaments & Jewellery', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE),
(2, 'Sharma Electronics',  '9820022222', 'Sharma Electronics',  'Retailer and distributor of commercial electronics, test meters, and hardware components.',      'RETAILER',   'Lamington Road', 'Electronics',           'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE),
(3, 'Seliya Stationary',   '9820033333', 'Seliya Stationary',   'Bulk paper supplier, commercial printing stationery, and office ledger materials.',              'WHOLESALER', 'Crawford Market','Stationery',            'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE),
(4, 'Sankhe Jwells',       '9820044444', 'Sankhe Jwells',       'Showroom specializing in hallmarked gold jewellery, silver ornaments, and custom designs.',     'RETAILER',   'Zaveri Bazaar',  'Gold & Silver Jewellery','e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a', 10.00, TRUE);

INSERT INTO admins (admin_id, username, password_hash) VALUES
(1, 'Admin', 'e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a');
