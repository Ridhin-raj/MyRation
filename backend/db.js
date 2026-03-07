/* ======================================================
   DATABASE CONNECTION — MySQL using mysql2
   ======================================================
   This file creates a connection pool to the MySQL database.
   Pool is used instead of single connection for better performance.
   ====================================================== */

const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ration_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,        // max 10 connections at a time
  queueLimit: 0,
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL connected successfully to:", process.env.DB_NAME || "ration_db");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.log("   Make sure MySQL is running and the database exists.");
    console.log("   Run: mysql -u root -p < schema.sql");
  }
}

testConnection();

module.exports = pool;
