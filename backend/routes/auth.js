/* ======================================================
   AUTH ROUTES — Login & Registration
   ======================================================
   POST /api/auth/login          → Login (returns JWT token)
   POST /api/auth/register/user  → Register end user (with file upload)
   POST /api/auth/register/shopkeeper → Register shopkeeper
   ====================================================== */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const db = require("../db");

const router = express.Router();

// ---- File upload config (for ration card images) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// ---- Helper: Generate JWT Token ----
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET || "ration_secret",
    { expiresIn: "24h" }
  );
}

// ===============================
// POST /api/auth/login
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user in database
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];

    // Check if account is approved
    if (user.status !== "approved") {
      return res.status(403).json({ message: "Your account is not yet approved. Please wait for admin approval." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // If shopkeeper, check if shop is also approved
    if (user.role === "shopkeeper") {
      const [shops] = await db.query("SELECT status FROM shops WHERE owner_id = ?", [user.id]);
      if (shops.length === 0 || shops[0].status !== "approved") {
        return res.status(403).json({ message: "Your shop registration is still pending admin approval." });
      }
    }

    // Generate JWT token with role info
    const token = generateToken(user);

    // Get additional profile info based on role
    let profile = null;
    if (user.role === "user") {
      const [profiles] = await db.query("SELECT * FROM user_profiles WHERE user_id = ?", [user.id]);
      profile = profiles[0] || null;
    }

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        cardType: profile?.card_type || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ===============================
// POST /api/auth/register/user
// ===============================
router.post("/register/user", upload.single("rationCardImage"), async (req, res) => {
  try {
    const {
      name, dob, gender, mobile, aadhaar,
      rationCardNo, cardType, familyMembers,
      state, district, taluk, village, pincode,
      selectedShop, password, username
    } = req.body;

    // Validation
    if (!name || !mobile || !aadhaar || !rationCardNo || !cardType || !password || !username) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if username already exists
    const [existingUser] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already taken. Please choose another one." });
    }

    // Check if Aadhaar already exists
    const [existingAadhaar] = await db.query("SELECT id FROM users WHERE aadhaar = ?", [aadhaar]);
    if (existingAadhaar.length > 0) {
      return res.status(400).json({ message: "A user with this Aadhaar number is already registered." });
    }

    // Check if Ration Card already exists
    const [existingCard] = await db.query("SELECT id FROM user_profiles WHERE ration_card_no = ?", [rationCardNo]);
    if (existingCard.length > 0) {
      return res.status(400).json({ message: "This Ration Card number is already registered." });
    }

    // Hash the user-provided password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into users table
    const [userResult] = await db.query(
      "INSERT INTO users (username, password, role, name, mobile, aadhaar, status) VALUES (?, ?, 'user', ?, ?, ?, 'pending')",
      [username, hashedPassword, name, mobile, aadhaar]
    );

    const userId = userResult.insertId;

    // Get image path
    const imagePath = req.file ? req.file.filename : null;

    // Sanitize selectedShop (ensure it is a number or null)
    const validShopId = (selectedShop && !isNaN(selectedShop)) ? parseInt(selectedShop) : null;

    // Insert into user_profiles table
    await db.query(
      `INSERT INTO user_profiles 
       (user_id, dob, gender, ration_card_no, card_type, family_members, ration_card_image, state, district, taluk, village, pincode, assigned_shop_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, dob, gender, rationCardNo, cardType, familyMembers || 1, imagePath, state, district, taluk, village, pincode, validShopId]
    );

    res.status(201).json({
      message: "Registration submitted successfully. Pending shopkeeper verification.",
      userId,
      username,
    });
  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ===============================
// POST /api/auth/register/shopkeeper
// ===============================
router.post("/register/shopkeeper", async (req, res) => {
  try {
    const { ownerName, mobile, aadhaar, shopName, licenseNo, capacity, state, district, taluk, village, pincode, password, username } = req.body;

    if (!ownerName || !mobile || !shopName || !licenseNo || !password || !username) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if username already exists
    const [existingUser] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already taken. Please choose another one." });
    }

    // Check if Aadhaar already exists
    const [existingAadhaar] = await db.query("SELECT id FROM users WHERE aadhaar = ?", [aadhaar]);
    if (existingAadhaar.length > 0) {
      return res.status(400).json({ message: "A shopkeeper with this Aadhaar number is already registered." });
    }

    // Hash user-provided password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await db.query(
      "INSERT INTO users (username, password, role, name, mobile, aadhaar, status) VALUES (?, ?, 'shopkeeper', ?, ?, ?, 'pending')",
      [username, hashedPassword, ownerName, mobile, aadhaar]
    );

    const userId = userResult.insertId;

    // Insert shop
    await db.query(
      `INSERT INTO shops (owner_id, shop_name, license_no, capacity, state, district, taluk, village, pincode, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, shopName, licenseNo, capacity || 500, state, district, taluk, village, pincode]
    );

    res.status(201).json({
      message: "Shop registration submitted. Pending admin approval.",
      username,
    });
  } catch (error) {
    console.error("Shopkeeper registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ===============================
// GET /api/auth/shops (Public)
// ===============================
router.get("/shops", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, shop_name as name, village as address, district, taluk FROM shops WHERE status = 'approved'"
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch shops error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// GET /api/auth/check-username/:username
// ===============================
router.get("/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    
    if (rows.length > 0) {
      return res.json({ available: false, message: "Username is already taken" });
    }
    
    res.json({ available: true, message: "Username is available" });
  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
