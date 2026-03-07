/* ======================================================
   MAIN SERVER — Express.js Backend
   ======================================================
   Indian Ration Management System
   
   Starts the Express server on port 5000
   Connects to MySQL database
   Sets up JWT authentication middleware
   Mounts route files for auth, user, shopkeeper, admin
   ====================================================== */

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Enable CORS (allows frontend to call backend)
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5180", "http://localhost:3000"],
  credentials: true,
}));

// Serve uploaded files (ration card images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============ JWT AUTH MIDDLEWARE ============
// This function checks if the request has a valid JWT token
// and attaches the user info to req.user
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "ration_secret");
    req.user = decoded; // { id, username, role, name }
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
}

// ============ ROLE CHECK MIDDLEWARE ============
// This function checks if the logged-in user has the required role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}

// ============ ROUTES ============

// Auth routes (login, register) — NO authentication needed
app.use("/api/auth", require("./routes/auth"));

// User routes — requires 'user' role
app.use("/api/user", authenticateToken, requireRole("user"), require("./routes/user"));

// Shopkeeper routes — requires 'shopkeeper' role
app.use("/api/shopkeeper", authenticateToken, requireRole("shopkeeper"), require("./routes/shopkeeper"));

// Admin routes — requires 'admin' role
app.use("/api/admin", authenticateToken, requireRole("admin"), require("./routes/admin"));

// ============ HEALTH CHECK ============
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Ration Management API is running" });
});

// ============ CREATE UPLOADS FOLDER ============
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🇮🇳 Ration Management System Backend         ║
  ║   Server running on: http://localhost:${PORT} ║
  ║   API Base URL: http://localhost:${PORT}/api   ║
  ╚══════════════════════════════════════════════╝
  `);
});
