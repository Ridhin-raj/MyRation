/* ======================================================
   SHOPKEEPER ROUTES
   ======================================================
   All routes require JWT authentication with role='shopkeeper'
   
   GET  /api/shopkeeper/dashboard  → Overview stats
   GET  /api/shopkeeper/pending    → Pending user verifications
   POST /api/shopkeeper/verify/:id → Approve/reject user registration
   GET  /api/shopkeeper/stock      → Get shop stock
   PUT  /api/shopkeeper/stock/:id  → Update stock quantity
   PUT  /api/shopkeeper/shop-status → Toggle shop open/closed
   ====================================================== */

const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/shopkeeper/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // Get shopkeeper's shop
    const [shops] = await db.query("SELECT id, shop_name, is_open FROM shops WHERE owner_id = ?", [req.user.id]);
    
    if (shops.length === 0) {
      return res.status(404).json({ message: "No shop found for this shopkeeper or shop not yet approved" });
    }
    
    const shop = shops[0];

    // Count pending verifications
    const [pending] = await db.query(
      "SELECT COUNT(*) as count FROM user_profiles WHERE assigned_shop_id = ? AND verified_by_shopkeeper = FALSE",
      [shop.id]
    );

    // Count verified beneficiaries
    const [verified] = await db.query(
      "SELECT COUNT(*) as count FROM user_profiles WHERE assigned_shop_id = ? AND verified_by_shopkeeper = TRUE",
      [shop.id]
    );

    // Count stock items
    const [stockCount] = await db.query("SELECT COUNT(*) as count FROM stock WHERE shop_id = ?", [shop.id]);

    res.json({
      shop,
      stats: {
        pending: pending[0].count,
        verified: verified[0].count,
        stockItems: stockCount[0].count,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shopkeeper/pending
router.get("/pending", async (req, res) => {
  try {
    const [shops] = await db.query("SELECT id FROM shops WHERE owner_id = ?", [req.user.id]);
    
    if (shops.length === 0) {
      return res.status(404).json({ message: "No shop found for this shopkeeper" });
    }
    
    const shopId = shops[0].id;

    const [rows] = await db.query(
      `SELECT u.id, u.name, u.aadhaar, u.created_at,
              p.card_type, p.family_members, p.village, p.ration_card_image
       FROM user_profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.assigned_shop_id = ? AND p.verified_by_shopkeeper = FALSE AND u.status = 'pending'`,
      [shopId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get pending error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shopkeeper/verified
router.get("/verified", async (req, res) => {
  try {
    const [shops] = await db.query("SELECT id FROM shops WHERE owner_id = ?", [req.user.id]);
    if (shops.length === 0) return res.status(404).json({ message: "No shop found" });
    
    const shopId = shops[0].id;
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.mobile, p.card_type, p.family_members, u.status
       FROM user_profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.assigned_shop_id = ? AND p.verified_by_shopkeeper = TRUE`,
      [shopId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get verified error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/shopkeeper/verify/:id  (user_id)
router.post("/verify/:id", async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const userId = req.params.id;

    // Security: Check if this user is assigned to the shopkeeper's shop
    const [shops] = await db.query("SELECT id FROM shops WHERE owner_id = ?", [req.user.id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: "No shop found for this shopkeeper" });
    }
    const shopId = shops[0].id;

    const [userProfile] = await db.query(
      "SELECT user_id FROM user_profiles WHERE user_id = ? AND assigned_shop_id = ?",
      [userId, shopId]
    );

    if (userProfile.length === 0) {
      return res.status(403).json({ message: "Access denied. User does not belong to your shop." });
    }

    if (action === "approve") {
      // Mark as verified by shopkeeper (still needs admin approval)
      await db.query("UPDATE user_profiles SET verified_by_shopkeeper = TRUE WHERE user_id = ?", [userId]);
      res.json({ message: "User verified. Forwarded to admin for final approval." });
    } else {
      // Reject - update user status
      await db.query("UPDATE users SET status = 'rejected' WHERE id = ?", [userId]);
      res.json({ message: "User registration rejected." });
    }
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/shopkeeper/stock
router.get("/stock", async (req, res) => {
  try {
    const [shops] = await db.query("SELECT id FROM shops WHERE owner_id = ?", [req.user.id]);
    
    if (shops.length === 0) {
      return res.status(404).json({ message: "No shop found for this shopkeeper" });
    }
    
    const shopId = shops[0].id;

    const [rows] = await db.query(
      "SELECT id, item_name, allocated_qty, distributed_qty, unit, last_updated FROM stock WHERE shop_id = ?",
      [shopId]
    );

    const formattedStock = rows.map(r => ({
      id: r.id,
      item: r.item_name,
      allocated: parseFloat(r.allocated_qty) || 0,
      distributed: parseFloat(r.distributed_qty) || 0,
      unit: r.unit,
      last_updated: r.last_updated
    }));

    res.json(formattedStock);
  } catch (error) {
    console.error("Get stock error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/shopkeeper/stock/:id  (stock item id)
router.put("/stock/:id", async (req, res) => {
  try {
    const { quantity } = req.body;
    const stockId = req.params.id;

    // Security: Check if this stock item belongs to the shopkeeper's shop
    const [shops] = await db.query("SELECT id FROM shops WHERE owner_id = ?", [req.user.id]);
    if (shops.length === 0) {
        return res.status(404).json({ message: "No shop found for this shopkeeper" });
    }
    const shopId = shops[0].id;

    const [stockCheck] = await db.query("SELECT id FROM stock WHERE id = ? AND shop_id = ?", [stockId, shopId]);
    if (stockCheck.length === 0) {
        return res.status(403).json({ message: "Access denied. Stock item does not belong to your shop." });
    }

    // Add new stock (increase allocated quantity)
    await db.query(
      "UPDATE stock SET allocated_qty = allocated_qty + ? WHERE id = ?",
      [quantity, stockId]
    );

    // Create alert for users of this shop
    const [stockItem] = await db.query("SELECT shop_id, item_name FROM stock WHERE id = ?", [stockId]);
    if (stockItem[0]) {
      await db.query(
        "INSERT INTO alerts (shop_id, message, alert_type) VALUES (?, ?, 'success')",
        [stockItem[0].shop_id, `New stock of ${stockItem[0].item_name} arrived at your shop!`]
      );
    }

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/shopkeeper/shop-status
router.put("/shop-status", async (req, res) => {
  try {
    const { is_open } = req.body;

    await db.query("UPDATE shops SET is_open = ? WHERE owner_id = ?", [is_open, req.user.id]);

    res.json({ message: `Shop is now ${is_open ? "open" : "closed"}` });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
