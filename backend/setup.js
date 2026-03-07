/* ======================================================
   SETUP SCRIPT — Initialize MySQL Database
   ======================================================
   Run this once to create the database and tables:
   node setup.js
   ====================================================== */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function setup() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 3306,
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log("Connected to MySQL server...");

    // 1. Create Database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "ration_db"}\``);
    console.log(`Database "${process.env.DB_NAME || "ration_db"}" created or already exists.`);
    
    await connection.query(`USE \`${process.env.DB_NAME || "ration_db"}\``);

    // 2. Create Tables
    console.log("Creating tables...");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'shopkeeper', 'admin') NOT NULL,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15),
        aadhaar VARCHAR(12),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
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
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        dob DATE,
        gender ENUM('Male', 'Female', 'Other'),
        ration_card_no VARCHAR(50),
        card_type ENUM('APL', 'BPL', 'AAY', 'PHH') NOT NULL,
        family_members INT DEFAULT 1,
        ration_card_image VARCHAR(255),
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
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id INT NOT NULL,
        item_name VARCHAR(50) NOT NULL,
        allocated_qty DECIMAL(10,2) DEFAULT 0,
        distributed_qty DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(10) DEFAULT 'kg',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quota (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_type ENUM('APL', 'BPL', 'AAY', 'PHH') NOT NULL,
        item_name VARCHAR(50) NOT NULL,
        quantity VARCHAR(20) NOT NULL,
        price VARCHAR(20) NOT NULL,
        UNIQUE KEY unique_quota (card_type, item_name)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ration_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        shop_id INT NOT NULL,
        month_year VARCHAR(20) NOT NULL,
        item_name VARCHAR(50),
        quantity VARCHAR(20),
        price VARCHAR(20),
        collected BOOLEAN DEFAULT FALSE,
        collected_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
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
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        shop_id INT,
        message VARCHAR(255) NOT NULL,
        alert_type ENUM('info', 'success', 'warning') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);

    // 3. Seed Users
    console.log("Seeding data...");
    const adminPass = await bcrypt.hash("admin123", 10);
    const shopPass = await bcrypt.hash("shop123", 10);
    const userPass = await bcrypt.hash("user123", 10);

    // Insert Admin
    await connection.query(`
      INSERT IGNORE INTO users (username, password, role, name, mobile, status) 
      VALUES ('admin1', ?, 'admin', 'Anita Sharma', '9999900000', 'approved')
    `, [adminPass]);

    // Insert Shopkeeper
    await connection.query(`
      INSERT IGNORE INTO users (username, password, role, name, mobile, aadhaar, status) 
      VALUES ('shop1', ?, 'shopkeeper', 'Ramesh Kumar', '9876543210', '123456789012', 'approved')
    `, [shopPass]);

    // Insert User
    await connection.query(`
      INSERT IGNORE INTO users (username, password, role, name, mobile, aadhaar, status) 
      VALUES ('user1', ?, 'user', 'Venkatesh Rao', '9876543211', '123456789013', 'approved')
    `, [userPass]);

    // 4. Seed Shops
    await connection.query(`
      INSERT IGNORE INTO shops (owner_id, shop_name, license_no, capacity, state, district, taluk, village, pincode, is_open, status) 
      VALUES (2, 'Janata Fair Price Shop', 'LIC-2024-001', 500, 'Karnataka', 'Bengaluru Urban', 'Bengaluru North', 'MG Road', '560001', TRUE, 'approved')
    `);

    // 5. Seed User Profile
    await connection.query(`
      INSERT IGNORE INTO user_profiles (user_id, dob, gender, ration_card_no, card_type, family_members, state, district, taluk, village, pincode, assigned_shop_id, verified_by_shopkeeper, verified_by_admin)
      VALUES (3, '1985-05-15', 'Male', 'RC-KA-100', 'BPL', 4, 'Karnataka', 'Bengaluru Urban', 'Bengaluru North', 'MG Road', '560001', 1, TRUE, TRUE)
    `);

    // Insert Quota
    const quotas = [
      ['BPL', 'Rice', '10 kg', '₹3/kg'],
      ['BPL', 'Wheat', '10 kg', '₹2/kg'],
      ['BPL', 'Sugar', '1 kg', '₹13/kg']
    ];
    for (const q of quotas) {
      await connection.query(`INSERT IGNORE INTO quota (card_type, item_name, quantity, price) VALUES (?, ?, ?, ?)`, q);
    }

    console.log("✅ Database setup and seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setup();
