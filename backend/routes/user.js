/* ======================================================
   USER (BENEFICIARY) ROUTES
   ======================================================
   All routes require JWT authentication with role='user'
   
   GET  /api/user/profile       → Get user profile
   GET  /api/user/quota         → Get monthly ration quota
   GET  /api/user/history       → Get ration collection history
   GET  /api/user/shop          → Get assigned shop details
   GET  /api/user/shop/:id/stock → Get shop stock levels
   POST /api/user/book-slot     → Book collection slot
   GET  /api/user/slots         → Get user's booked slots
   POST /api/user/complaint     → File a complaint
   GET  /api/user/alerts        → Get notifications
   ====================================================== */

const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/user/profile
router.get("/profile", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.mobile, u.aadhaar, u.status,
              p.dob, p.gender, p.ration_card_no, p.card_type, p.family_members,
              p.state, p.district, p.taluk, p.village, p.pincode,
              p.verified_by_shopkeeper, p.verified_by_admin
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/quota
router.get("/quota", async (req, res) => {
  try {
    // Get user's card type
    const [profiles] = await db.query("SELECT card_type FROM user_profiles WHERE user_id = ?", [req.user.id]);
    const cardType = profiles[0]?.card_type || "BPL";

    // Get quota for that card type
    const [dbQuota] = await db.query("SELECT item_name, quantity, price FROM quota WHERE card_type = ?", [cardType]);

    // Format to match frontend expectations
    const quota = dbQuota.map(q => ({
      item: q.item_name,
      qty: q.quantity,
      price: q.price
    }));

    res.json({ cardType, quota });
  } catch (error) {
    console.error("Get quota error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/history
router.get("/history", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT month_year, item_name, quantity, price, collected, collected_at
       FROM ration_history
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    // Group by month
    const grouped = {};
    rows.forEach((r) => {
      if (!grouped[r.month_year]) {
        grouped[r.month_year] = { month: r.month_year, items: [], collected: r.collected };
      }
      grouped[r.month_year].items.push({
        item: r.item_name,
        qty: r.quantity,
        price: r.price,
      });
    });

    res.json(Object.values(grouped));
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/shop
router.get("/shop", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.shop_name, s.license_no, s.village, s.district, s.is_open,
              u.name as owner_name
       FROM user_profiles p
       JOIN shops s ON p.assigned_shop_id = s.id
       JOIN users u ON s.owner_id = u.id
       WHERE p.user_id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No shop assigned yet" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/shop/:id/stock
router.get("/shop/:id/stock", async (req, res) => {
  try {
    const shopId = req.params.id;

    // Security: Check if this shop is assigned to the user
    const [profiles] = await db.query("SELECT assigned_shop_id FROM user_profiles WHERE user_id = ?", [req.user.id]);
    const assignedShopId = profiles[0]?.assigned_shop_id;

    if (parseInt(shopId) !== assignedShopId) {
      return res.status(403).json({ message: "Access denied. You can only view stock of your assigned shop." });
    }

    const [rows] = await db.query(
      "SELECT item_name, allocated_qty, distributed_qty, unit FROM stock WHERE shop_id = ?",
      [shopId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get stock error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/user/book-slot
router.post("/book-slot", async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: "Date and time are required" });
    }

    // Get assigned shop
    const [profiles] = await db.query("SELECT assigned_shop_id FROM user_profiles WHERE user_id = ?", [req.user.id]);
    const shopId = profiles[0]?.assigned_shop_id;

    if (!shopId) {
      return res.status(400).json({ message: "No shop assigned to you" });
    }

    // Check if slot already booked
    const [existing] = await db.query(
      "SELECT id FROM slot_bookings WHERE user_id = ? AND booking_date = ? AND status = 'booked'",
      [req.user.id, date]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "You already have a booking for this date" });
    }

    // Check if date is in the future
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        return res.status(400).json({ message: "Cannot book a slot for a past date" });
    }

    await db.query(
      "INSERT INTO slot_bookings (user_id, shop_id, booking_date, time_slot) VALUES (?, ?, ?, ?)",
      [req.user.id, shopId, date, time]
    );

    res.status(201).json({ message: "Slot booked successfully", date, time });
  } catch (error) {
    console.error("Book slot error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/slots
router.get("/slots", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT booking_date, time_slot, status FROM slot_bookings WHERE user_id = ? ORDER BY booking_date DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/user/complaint
router.post("/complaint", async (req, res) => {
  try {
    const { type, message, shopId } = req.body;

    if (!type || !message) {
      return res.status(400).json({ message: "Complaint type and message are required" });
    }

    // Get assigned shop if not provided
    let shop = shopId;
    if (!shop) {
      const [profiles] = await db.query("SELECT assigned_shop_id FROM user_profiles WHERE user_id = ?", [req.user.id]);
      shop = profiles[0]?.assigned_shop_id;
    }

    if (!shop) {
        return res.status(400).json({ message: "No shop assigned/found to file complaint against" });
    }

    // Verify shop exists
    const [shopExists] = await db.query("SELECT id FROM shops WHERE id = ?", [shop]);
    if (shopExists.length === 0) {
        return res.status(404).json({ message: "Invalid shop ID" });
    }

    await db.query(
      "INSERT INTO complaints (user_id, shop_id, complaint_type, message) VALUES (?, ?, ?, ?)",
      [req.user.id, shop, type, message]
    );

    res.status(201).json({ message: "Complaint submitted successfully" });
  } catch (error) {
    console.error("Submit complaint error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/alerts
router.get("/alerts", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, message, alert_type, is_read, created_at
       FROM alerts
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Get alerts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
