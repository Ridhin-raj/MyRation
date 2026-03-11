import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, LogOut, LayoutDashboard, Clock, UserCheck, Package,
  CheckCircle, XCircle, Eye, Plus, Minus
} from "lucide-react";
import { getShopkeeperDashboard, getPendingVerifications, getVerifiedBeneficiaries, getShopkeeperStock, verifyUser, updateStock, toggleShopStatus, sellStock } from "@/data/api";

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");
  const [user] = useState(() => JSON.parse(localStorage.getItem("currentUser") || "{}"));
  const [loading, setLoading] = useState(true);

  // Shop status
  const [shopOpen, setShopOpen] = useState(true);
  const [stats, setStats] = useState({ pending: 0, verified: 0, stockItems: 0 });

  // Pending verifications
  const [pendingApps, setPendingApps] = useState([]);
  const [verifiedList, setVerifiedList] = useState([]);
  const [stock, setStock] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dash, pending, verified, stk] = await Promise.all([
          getShopkeeperDashboard(),
          getPendingVerifications(), 
          getVerifiedBeneficiaries(),
          getShopkeeperStock(),
        ]);

        setStats(dash.stats || { pending: 0, verified: 0, stockItems: 0 });
        setShopOpen(dash.shop?.is_open ?? true);
        setPendingApps(pending);
        setVerifiedList(verified);
        setStock(stk);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const [viewApp, setViewApp] = useState(null);
  const [addStockItem, setAddStockItem] = useState(null);
  const [sellStockItem, setSellStockItem] = useState(null);
  const [addQty, setAddQty] = useState("");
  const [sellQty, setSellQty] = useState("");

  const handleVerify = async (id, action) => {
    try { 
      await verifyUser(id, action); 
      setPendingApps((prev) => prev.filter((a) => a.id !== id));
      setViewApp(null);
    } catch { 
      alert("Action failed. Check backend.");
    }
  };

  const handleToggleShop = async () => {
    const newStatus = !shopOpen;
    try { 
      await toggleShopStatus(newStatus); 
      setShopOpen(newStatus);
    } catch { 
      alert("Failed to toggle shop status.");
    }
  };

  const handleUpdateStock = async (itemId) => {
    if (!addQty) return;
    const qty = parseInt(addQty, 10);
    try { 
      await updateStock(itemId, qty); 
      setStock((prev) =>
        prev.map((s) => s.id === itemId ? { ...s, allocated: Number(s.allocated) + qty } : s)
      );
      setAddStockItem(null);
      setAddQty("");
    } catch {
      alert("Failed to update stock.");
    }
  };

  const handleSellStock = async (itemId) => {
    if (!sellQty) return;
    const qty = parseInt(sellQty, 10);
    try { 
      await sellStock(itemId, qty); 
      setStock((prev) =>
        prev.map((s) => s.id === itemId ? { ...s, distributed: Number(s.distributed) + qty } : s)
      );
      setSellStockItem(null);
      setSellQty("");
    } catch (err) {
      alert(err.message || "Failed to record sale.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { title: "Overview", icon: LayoutDashboard, key: "overview" },
    { title: "Pending Verifications", icon: Clock, key: "pending" },
    { title: "Verified Beneficiaries", icon: UserCheck, key: "verified" },
    { title: "Stock / Inventory", icon: Package, key: "inventory" },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><ShieldCheck size={14} /></div>
          <span>Shopkeeper</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-link ${section === item.key ? "active" : ""}`}
              onClick={() => setSection(item.key)}
            >
              <item.icon size={16} />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout}><LogOut size={16} /><span>Logout</span></button>
        </div>
      </aside>

      {/* Main */}
      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-title">Shopkeeper Dashboard</div>
          <div className="topbar-right">
            <span className="badge badge-primary" style={{ marginRight: "0.5rem" }}>{user.name || "Ramesh Kumar"}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="dashboard-content animate-in">
          {/* OVERVIEW */}
          {section === "overview" && (
            <>
              {/* Shop Status Toggle */}
              <div className="shop-status">
                <span className={`status-dot ${shopOpen ? "open" : "closed"}`} />
                <span style={{ fontWeight: 700, flex: 1 }}>Shop is {shopOpen ? "Open" : "Closed"}</span>
                <input type="checkbox" className="toggle-switch" checked={shopOpen} onChange={handleToggleShop} />
              </div>

              <div className="grid-3">
                {[
                  { label: "Total Beneficiaries", value: verifiedList.length + pendingApps.length, icon: UserCheck, color: "blue" },
                  { label: "Pending Verifications", value: pendingApps.length, icon: Clock, color: "orange" },
                  { label: "Stock Items", value: stock.length, icon: Package, color: "green" },
                ].map((card) => (
                  <div key={card.label} className="card">
                    <div className="stat-card">
                      <div className={`stat-icon ${card.color}`}><card.icon size={22} /></div>
                      <div>
                        <div className="stat-value">{card.value}</div>
                        <div className="stat-label">{card.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PENDING VERIFICATIONS */}
          {section === "pending" && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Pending User Verifications</h2>
                <p className="card-subtitle">Verify user documents and forward to admin for final approval</p>
              </div>
              <div className="card-body">
                {pendingApps.length === 0 ? (
                  <div className="empty-state"><Clock size={40} /><p>No pending verifications</p></div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr><th>ID</th><th>Name</th><th>Card Type</th><th>Members</th><th>Date</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {pendingApps.map((app) => (
                          <tr key={app.id}>
                            <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{app.id}</td>
                            <td style={{ fontWeight: 600 }}>{app.name}</td>
                            <td><span className="badge badge-outline">{app.cardType}</span></td>
                            <td>{app.members}</td>
                            <td className="text-muted">{app.date}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-ghost btn-sm" onClick={() => setViewApp(app)} title="View"><Eye size={14} /></button>
                                <button className="btn btn-success btn-sm" onClick={() => handleVerify(app.id, "approve")} title="Approve"><CheckCircle size={14} /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleVerify(app.id, "reject")} title="Reject"><XCircle size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VERIFIED BENEFICIARIES */}
          {section === "verified" && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Verified Beneficiaries</h2></div>
              <div className="card-body">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>ID</th><th>Name</th><th>Card Type</th><th>Members</th><th>Status</th></tr></thead>
                    <tbody>
                      {verifiedList.map((v) => (
                        <tr key={v.id}>
                          <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{v.id}</td>
                          <td style={{ fontWeight: 600 }}>{v.name}</td>
                          <td><span className="badge badge-outline">{v.cardType}</span></td>
                          <td>{v.members}</td>
                          <td><span className="badge badge-success">{v.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STOCK / INVENTORY */}
          {section === "inventory" && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Stock / Inventory Management</h2>
                <p className="card-subtitle">Update stock when new supply arrives</p>
              </div>
              <div className="card-body">
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Item</th><th>Allocated</th><th>Distributed</th><th>Remaining</th><th>Stock Level</th><th>Action</th></tr></thead>
                    <tbody>
                      {stock.map((s) => {
                        const remaining = s.allocated - s.distributed;
                        const pct = Math.round((remaining / s.allocated) * 100);
                        const level = pct > 50 ? "good" : pct > 20 ? "low" : "critical";
                        return (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 700 }}>{s.item}</td>
                            <td>{s.allocated} {s.unit}</td>
                            <td>{s.distributed} {s.unit}</td>
                            <td style={{ fontWeight: 700 }}>{remaining} {s.unit}</td>
                            <td>
                              <div className="flex items-center gap-1">
                                <div className="stock-bar-track">
                                  <div className={`stock-bar-fill ${level}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className={`badge badge-${level === "good" ? "success" : level === "low" ? "warning" : "danger"}`}>{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex gap-1" style={{ flexWrap: "wrap" }}>
                                {addStockItem === s.id ? (
                                  <div className="flex items-center gap-1">
                                    <input className="form-input" type="number" placeholder="Add Qty" value={addQty} onChange={(e) => setAddQty(e.target.value)} style={{ width: "5rem", height: "2rem", fontSize: "0.75rem" }} />
                                    <button className="btn btn-success btn-sm" onClick={() => handleUpdateStock(s.id)} title="Confirm Add"><Plus size={12} /></button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddStockItem(null); setAddQty(""); }}><XCircle size={12} /></button>
                                  </div>
                                ) : sellStockItem === s.id ? (
                                  <div className="flex items-center gap-1">
                                    <input className="form-input" type="number" placeholder="Sell Qty" value={sellQty} onChange={(e) => setSellQty(e.target.value)} style={{ width: "5rem", height: "2rem", fontSize: "0.75rem" }} />
                                    <button className="btn btn-primary btn-sm" onClick={() => handleSellStock(s.id)} title="Confirm Sale"><Minus size={12} /></button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setSellStockItem(null); setSellQty(""); }}><XCircle size={12} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <button className="btn btn-outline btn-sm" onClick={() => { setAddStockItem(s.id); setSellStockItem(null); }}>
                                      <Plus size={12} /> Add
                                    </button>
                                    <button className="btn btn-outline btn-sm" onClick={() => { setSellStockItem(s.id); setAddStockItem(null); }} style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                                      <Minus size={12} /> Sell
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Application Modal */}
      {viewApp && (
        <div className="modal-overlay" onClick={() => setViewApp(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Application {viewApp.id}</h3>
            {[["Name", viewApp.name], ["Aadhaar", viewApp.aadhaar], ["Card Type", viewApp.cardType], ["Family Members", viewApp.members], ["Village", viewApp.village], ["Applied", viewApp.date], ["Ration Card Image", "✅ Uploaded"]].map(([l, v]) => (
              <div key={l} className="data-row"><dt>{l}</dt><dd>{String(v)}</dd></div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => handleVerify(viewApp.id, "reject")}>Reject</button>
              <button className="btn btn-success" onClick={() => handleVerify(viewApp.id, "approve")}>Approve & Forward to Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperDashboard;
