-- ======================================================
-- INDIAN RATION MANAGEMENT SYSTEM — DATABASE SCHEMA
-- ======================================================
-- Run this file in MySQL to create the database and tables:
--   mysql -u root -p < schema.sql
-- ======================================================

CREATE DATABASE IF NOT EXISTS ration_db;
USE ration_db;

-- ============================
-- TABLE 1: users (all roles)
-- ============================
-- Stores login credentials and role information
-- role can be: 'user', 'shopkeeper', 'admin'
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- bcrypt hashed
    role ENUM('user', 'shopkeeper', 'admin') NOT NULL,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15),
    aadhaar VARCHAR(12),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- TABLE 2: shops (ration shops) — Created BEFORE user_profiles
-- ============================
-- Fair Price Shop details
CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,                    -- links to users table (shopkeeper)
    shop_name VARCHAR(100) NOT NULL,
    license_no VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 500,
    state VARCHAR(50),
    district VARCHAR(50),
    taluk VARCHAR(50),
    village VARCHAR(100),
    pincode VARCHAR(6),
    is_open BOOLEAN DEFAULT TRUE,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- TABLE 3: user_profiles (beneficiary details)
-- ============================
-- Additional details for end users (beneficiaries)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    ration_card_no VARCHAR(50),
    card_type ENUM('APL', 'BPL', 'AAY', 'PHH') NOT NULL,
    family_members INT DEFAULT 1,
    ration_card_image VARCHAR(255),           -- file path of uploaded image
    state VARCHAR(50),
    district VARCHAR(50),
    taluk VARCHAR(50),
    village VARCHAR(100),
    pincode VARCHAR(6),
    assigned_shop_id INT,
    verified_by_shopkeeper BOOLEAN DEFAULT FALSE,
    verified_by_admin BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_shop_id) REFERENCES shops(id) ON DELETE SET NULL
);

-- ============================
-- TABLE 4: stock (shop inventory)
-- ============================
-- Tracks how much ration each shop has
CREATE TABLE IF NOT EXISTS stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    item_name VARCHAR(50) NOT NULL,           -- Rice, Wheat, Sugar, etc.
    allocated_qty DECIMAL(10,2) DEFAULT 0,    -- total allocated this month
    distributed_qty DECIMAL(10,2) DEFAULT 0,  -- already distributed
    unit VARCHAR(10) DEFAULT 'kg',            -- kg, L, etc.
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- ============================
-- TABLE 5: quota (ration quota per card type)
-- ============================
-- Admin sets how much ration each card type gets monthly
CREATE TABLE IF NOT EXISTS quota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_type ENUM('APL', 'BPL', 'AAY', 'PHH') NOT NULL,
    item_name VARCHAR(50) NOT NULL,
    quantity VARCHAR(20) NOT NULL,             -- e.g., "10 kg"
    price VARCHAR(20) NOT NULL,               -- e.g., "₹3/kg"
    UNIQUE KEY unique_quota (card_type, item_name)
);

-- ============================
-- TABLE 6: ration_history (collection log)
-- ============================
-- Tracks when a user collected their ration
CREATE TABLE IF NOT EXISTS ration_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shop_id INT NOT NULL,
    month_year VARCHAR(20) NOT NULL,          -- e.g., "March 2026"
    item_name VARCHAR(50),
    quantity VARCHAR(20),
    price VARCHAR(20),
    collected BOOLEAN DEFAULT FALSE,
    collected_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- ============================
-- TABLE 7: slot_bookings
-- ============================
-- Users book time slots to collect ration
CREATE TABLE IF NOT EXISTS slot_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shop_id INT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,           -- e.g., "10:00 AM"
    status ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- ============================
-- TABLE 8: complaints
-- ============================
-- Users file complaints about shops/shopkeepers
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shop_id INT NOT NULL,
    complaint_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'warning_issued', 'dismissed') DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- ============================
-- TABLE 9: alerts (notifications for users)
-- ============================
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,                              -- NULL = broadcast to all
    shop_id INT,
    message VARCHAR(255) NOT NULL,
    alert_type ENUM('info', 'success', 'warning') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);


-- ======================================================
-- SEED DATA — Insert sample data for testing
-- ======================================================

-- Admin user (password: admin123)
INSERT INTO users (username, password, role, name, mobile, status) VALUES
('admin1', '$2a$10$8K1p/a0dL4Ib1NvVN5Z3CeW.OYMX5q5yP6C3/0YJW3z6o9q3kJ6S', 'admin', 'Anita Sharma', '9999900000', 'approved');

-- Shopkeeper (password: shop123)
INSERT INTO users (username, password, role, name, mobile, aadhaar, status) VALUES
('shop1', '$2a$10$VQ5HgWm2Z1LW6f7u5Y6z3.WK3EqSqGv8C5z1Z2dN3c4B5a6D7e8F', 'shopkeeper', 'Ramesh Kumar', '9876543210', '123456789012', 'approved');

-- End user (password: user123)
INSERT INTO users (username, password, role, name, mobile, aadhaar, status) VALUES
('user1', '$2a$10$rK5HgWm2Z1LW6f7u5Y6z3.WK3EqSqGv8C5z1Z2dN3c4B5a6D7e8G', 'user', 'Venkatesh Rao', '9876543211', '987654321098', 'approved');

-- Shop
INSERT INTO shops (owner_id, shop_name, license_no, capacity, state, district, taluk, village, pincode, is_open, status) VALUES
(2, 'Janata Fair Price Shop', 'LIC-2024-001', 500, 'Karnataka', 'Bengaluru Urban', 'Bengaluru North', 'MG Road', '560001', TRUE, 'approved');

-- User profile
INSERT INTO user_profiles (user_id, dob, gender, ration_card_no, card_type, family_members, state, district, taluk, village, pincode, assigned_shop_id, verified_by_shopkeeper, verified_by_admin) VALUES
(3, '1990-05-15', 'Male', 'RC-KA-2024-00145', 'BPL', 4, 'Karnataka', 'Bengaluru Urban', 'Bengaluru North', 'MG Road', '560001', 1, TRUE, TRUE);

-- Default Quota
INSERT INTO quota (card_type, item_name, quantity, price) VALUES
('APL', 'Rice', '5 kg', '₹15/kg'),
('APL', 'Wheat', '5 kg', '₹10/kg'),
('APL', 'Sugar', '1 kg', '₹13/kg'),
('APL', 'Kerosene', '3 L', '₹20/L'),
('BPL', 'Rice', '10 kg', '₹3/kg'),
('BPL', 'Wheat', '10 kg', '₹2/kg'),
('BPL', 'Sugar', '1 kg', '₹13/kg'),
('BPL', 'Kerosene', '5 L', '₹15/L'),
('BPL', 'Dal', '1 kg', '₹15/kg'),
('AAY', 'Rice', '15 kg', '₹2/kg'),
('AAY', 'Wheat', '20 kg', '₹1/kg'),
('AAY', 'Sugar', '1 kg', '₹13/kg'),
('AAY', 'Kerosene', '5 L', '₹15/L'),
('AAY', 'Dal', '2 kg', '₹10/kg'),
('PHH', 'Rice', '5 kg', '₹1/kg'),
('PHH', 'Wheat', '5 kg', '₹2/kg'),
('PHH', 'Sugar', '1 kg', '₹13/kg'),
('PHH', 'Kerosene', '4 L', '₹15/L');

-- Stock for the shop
INSERT INTO stock (shop_id, item_name, allocated_qty, distributed_qty, unit) VALUES
(1, 'Rice', 500, 320, 'kg'),
(1, 'Wheat', 300, 200, 'kg'),
(1, 'Sugar', 100, 65, 'kg'),
(1, 'Kerosene', 200, 140, 'L'),
(1, 'Dal', 80, 30, 'kg');

-- Sample ration history
INSERT INTO ration_history (user_id, shop_id, month_year, item_name, quantity, price, collected) VALUES
(3, 1, 'February 2026', 'Rice', '10 kg', '₹30', TRUE),
(3, 1, 'February 2026', 'Wheat', '10 kg', '₹20', TRUE),
(3, 1, 'January 2026', 'Rice', '10 kg', '₹30', TRUE),
(3, 1, 'January 2026', 'Sugar', '1 kg', '₹13', TRUE);

-- Sample complaint
INSERT INTO complaints (user_id, shop_id, complaint_type, message, status) VALUES
(3, 1, 'Quality Issue', 'Rice quality is very poor this month. Many grains are broken.', 'pending');

-- Sample alerts
INSERT INTO alerts (user_id, shop_id, message, alert_type) VALUES
(3, 1, 'New stock of Rice arrived at your shop!', 'success'),
(3, 1, 'Sugar stock is running low at your assigned shop.', 'warning'),
(3, NULL, 'Your March 2026 ration quota is ready for collection.', 'info');

SELECT 'Database created and seeded successfully!' AS status;
