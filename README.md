# 🇮🇳 Smart Ration Management System (SRMS)

[![React](https://img.shields.io/badge/Frontend-React.js-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Security-JWT-purple?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)

A state-of-the-art Digital Public Distribution System (PDS) designed to streamline the distribution of essential commodities. This platform provides transparency, accountability, and convenience for both administrators and citizens.

---

## 📽️ Presentation Highlight: Why this Project?

*   **Transparency**: Digital tracking prevents "leakage" of ration commodities.
*   **Convenience**: Citizens avoid long queues via a built-in **Slot Booking System**.
*   **Accountability**: Every collection is logged with date, time, and shop details.
*   **Alert System**: Automated notifications keep users informed about stock and announcements.

---

## 🔑 Demo & Testing Credentials

Use these pre-seeded accounts to experience all roles. **Note: All passwords are provided below.**

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin1` | `admin123` | System oversight & final approvals |
| **Shopkeeper** | `shop1` | `shop123` | Local stock management & user verification |
| **Beneficiary** | `user1` | `user123` | Checking quota & booking slots |

---


## 🏗️ Technical Features
*   **Role-Based Access Control (RBAC)**: Secure routes using JWT tokens stored in LocalStorage.
*   **Dynamic Quota Management**: Admin can change the price or quantity of items per card type globally. The system now fully supports **APL, BPL, AAY, and PHH** card types with pre-configured monthly quotas.
*   **Responsive UI**: Modern dashboard layouts using Vanilla CSS Flexbox and Grid.
*   **Audit Log**: Complete history of every transaction and complaint.

---

## 🚀 Quick Setup Instructions

### 1. Database (MySQL)
1. Ensure MySQL is running (XAMPP/MySQL).
2. Configure `backend/.env` with your DB credentials.
3. Run Setup:
   ```bash
   cd backend
   npm install
   node setup.js
   ```

### 2. Run Applications
*   **Backend**: `cd backend && npm start` (Port 5000)
*   **Frontend**: `cd frontend && npm run dev` (Port 5173/5180)

---

## 📂 Project Structure
*   **/frontend**: React 18 with Vite, Lucide Icons, and modular styling.
*   **/backend**: Express.js server, MySQL connection pool, and JWT auth middleware.
*   **schema.sql**: The complete database design for audits and presentation documentation.

---
**Developed for College Presentation — 2026**
