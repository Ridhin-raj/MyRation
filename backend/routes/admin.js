/* ======================================================
   ADMIN ROUTES
   ======================================================
   All routes require JWT authentication with role='admin'
   
   GET  /api/admin/dashboard      → Overview stats
   GET  /api/admin/pending        → Pending approvals (users + shops)
   POST /api/admin/approve/:id    → Approve/reject registration
   GET  /api/admin/quota          → Get all quota settings
   PUT  /api/admin/quota          → Update quota for a card type
   GET  /api/admin/complaints     → Get all complaints
   PUT  /api/admin/complaints/:id → Resolve/warn/dismiss complaint
   GET  /api/admin/users          → Get all users
   ====================================================== */

const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [users] = await db.query("SELECT COUNT(*) as count FROM users");
    const [pendingUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
    const [pendingShops] = await db.query("SELECT COUNT(*) as count FROM shops WHERE status = 'pending'");
    const [complaints] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'");

    res.json({
      totalUsers: users[0].count,
      pendingApprovals: pendingUsers[0].count + pendingShops[0].count,
      openComplaints: complaints[0].count,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/pending
router.get("/pending", async (req, res) => {
  try {
    // Pending users (verified by shopkeeper, waiting for admin)
    const [pendingUsers] = await db.query(
      `SELECT u.id, u.name, u.created_at, 'User' as type,
              p.card_type, p.family_members
       FROM users u
       JOIN user_profiles p ON u.id = p.user_id
       WHERE u.status = 'pending' AND p.verified_by_shopkeeper = TRUE AND p.verified_by_admin = FALSE`
    );

    // Pending shops
    const [pendingShops] = await db.query(
      `SELECT s.id, u.name, s.shop_name, s.license_no, s.created_at, 'Shopkeeper' as type
       FROM shops s
       JOIN users u ON s.owner_id = u.id
       WHERE s.status = 'pending'`
    );

    // Combine and format
    const all = [
      ...pendingUsers.map((u) => ({
        id: u.id,
        name: u.name,
        type: "User",
        details: `${u.card_type} Card — ${u.family_members} members`,
        date: u.created_at,
      })),
      ...pendingShops.map((s) => ({
        id: s.id,
        name: s.name,
        type: "Shopkeeper",
        details: `${s.shop_name} — License: ${s.license_no}`,
        date: s.created_at,
      })),
    ];

    res.json(all);
  } catch (error) {
    console.error("Get pending error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/approve/:id
router.post("/approve/:id", async (req, res) => {
  try {
    const { type, action } = req.body; // type: "user"/"shopkeeper", action: "approve"/"reject"
    const id = req.params.id;

    if (type === "user") {
      if (action === "approve") {
        await db.query("UPDATE users SET status = 'approved' WHERE id = ?", [id]);
        await db.query("UPDATE user_profiles SET verified_by_admin = TRUE WHERE user_id = ?", [id]);
      } else {
        await db.query("UPDATE users SET status = 'rejected' WHERE id = ?", [id]);
      }
    } else if (type === "shopkeeper") {
      if (action === "approve") {
        // Approve both shop and shopkeeper user account
        await db.query("UPDATE shops SET status = 'approved' WHERE id = ?", [id]);
        const [shop] = await db.query("SELECT owner_id FROM shops WHERE id = ?", [id]);
        if (shop[0]) {
          await db.query("UPDATE users SET status = 'approved' WHERE id = ?", [shop[0].owner_id]);
        }
      } else {
        await db.query("UPDATE shops SET status = 'rejected' WHERE id = ?", [id]);
        const [shop] = await db.query("SELECT owner_id FROM shops WHERE id = ?", [id]);
        if (shop[0]) {
          await db.query("UPDATE users SET status = 'rejected' WHERE id = ?", [shop[0].owner_id]);
        }
      }
    }

    res.json({ message: `Registration ${action}d successfully` });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/quota
router.get("/quota", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM quota ORDER BY card_type, item_name");

    // Group by card type
    const grouped = {};
    rows.forEach((r) => {
      if (!grouped[r.card_type]) grouped[r.card_type] = [];
      grouped[r.card_type].push({
        item: r.item_name,
        qty: r.quantity,
        price: r.price,
      });
    });

    res.json(grouped);
  } catch (error) {
    console.error("Get quota error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/quota
router.put("/quota", async (req, res) => {
  try {
    const { card_type, items } = req.body;

    if (!card_type || !items) {
      return res.status(400).json({ message: "Card type and items are required" });
    }

    // Update each item using INSERT ... ON DUPLICATE KEY UPDATE
    for (const item of items) {
      await db.query(
        `INSERT INTO quota (card_type, item_name, quantity, price)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = ?, price = ?`,
        [card_type, item.item, item.qty, item.price, item.qty, item.price]
      );
    }

    res.json({ message: `Quota for ${card_type} updated successfully` });
  } catch (error) {
    console.error("Update quota error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/quota/new-item
router.post("/quota/new-item", async (req, res) => {
  try {
    const { itemName, quantity, price, unit } = req.body;

    if (!itemName || !quantity || !price) {
      return res.status(400).json({ message: "Item name, quantity, and price are required." });
    }

    const cardTypes = ['APL', 'BPL', 'AAY', 'PHH'];
    
    // Add to quota table for all card types
    for (const type of cardTypes) {
      await db.query(
        `INSERT INTO quota (card_type, item_name, quantity, price)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = ?, price = ?`,
        [type, itemName, quantity, price, quantity, price]
      );
    }

    // Add to stock table for all existing shops automatically
    const [shops] = await db.query("SELECT id FROM shops");
    for (const shop of shops) {
      await db.query(
        `INSERT INTO stock (shop_id, item_name, unit, allocated_qty, distributed_qty)
         SELECT ?, ?, ?, 0, 0
         FROM DUAL
         WHERE NOT EXISTS (
            SELECT 1 FROM stock WHERE shop_id = ? AND item_name = ?
         )`,
        [shop.id, itemName, unit || 'kg', shop.id, itemName]
      );
    }

    res.json({ message: `Item '${itemName}' successfully added to all card types and shops.` });
  } catch (error) {
    console.error("Add new item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/complaints
router.get("/complaints", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.complaint_type, c.message, c.status, c.created_at, c.admin_response,
              u.name as user_name,
              s.shop_name
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       JOIN shops s ON c.shop_id = s.id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/complaints/:id
router.put("/complaints/:id", async (req, res) => {
  try {
    const { action, warning } = req.body;
    const id = req.params.id;

    let status = "pending";
    if (action === "resolve") status = "resolved";
    else if (action === "warn") status = "warning_issued";
    else if (action === "dismiss") status = "dismissed";

    await db.query("UPDATE complaints SET status = ? WHERE id = ?", [status, id]);

    // If warning, create alert for shopkeeper
    if (warning) {
      const [complaint] = await db.query(
        "SELECT shop_id FROM complaints WHERE id = ?",
        [id]
      );
      if (complaint[0]) {
        const [shop] = await db.query("SELECT owner_id FROM shops WHERE id = ?", [complaint[0].shop_id]);
        if (shop[0]) {
          await db.query(
            "INSERT INTO alerts (user_id, message, alert_type) VALUES (?, ?, 'warning')",
            [shop[0].owner_id, "⚠️ Warning: A complaint has been filed against your shop. Please improve service quality."]
          );
        }
      }
    }

    res.json({ message: `Complaint ${status}` });
  } catch (error) {
    console.error("Resolve complaint error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.name, u.role, u.status, u.created_at,
              p.card_type
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
