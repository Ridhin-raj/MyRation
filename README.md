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

## 🛠️ Detailed Registration Logic (For Demo)

### 🏪 Shopkeeper Registration Flow
1. **Apply**: Shopkeeper registers with license number and shop details.
2. **Pending State**: Account is created as `pending` and does NOT appear in the user registration list yet.
3. **Approval**: Admin logs in, reviews the license, and clicks **Approve**.
4. **Live**: Only after Admin approval is the shop searchable by citizens.

### 👤 User (Beneficiary) Registration Flow
1. **Personal Details**: User provides name, DOB, Aadhaar, and Mobile number.
2. **Card Info**: User selects Card Type (BPL/APL/AAY/PHH), family size, and uploads a scan of their Ration Card.
3. **Shop Selection**: User filters by District and Taluk to find and select their nearest **Approved** Fair Price Shop.
4. **Credential Generation**: Upon submission, the system generates a unique username (`user_<aadhaar>`) and an **Initial Password** (Aadhaar last 4 digits + `1234`).
    *   *Self-Correction*: Users are informed to note these down as they cannot log in until verified.

---

## 🔍 User Verification Workflow (Step-by-Step)

To maintain high security, every beneficiary must pass through a **Two-Tier Verification** process:

### 📥 Step 1: Beneficiary Submission
*   Status: `pending`
*   Profile Status: `verified_by_shopkeeper = FALSE`, `verified_by_admin = FALSE`

### 🏪 Step 2: Shopkeeper Level (Local Verification)
1. **Login**: Shopkeeper logs in to their dashboard.
2. **Review**: Navigates to the **"Pending Verifications"** tab.
3. **Action**: View's the user's uploaded Ration Card image and Aadhaar details. Clicking **"Approve"** marks the user as locally verified.
*   Status: Remains `pending`
*   Profile Status: `verified_by_shopkeeper = TRUE`

### 🏛️ Step 3: Admin Level (Final Approval)
1. **Login**: Admin logs in to the main dashboard.
2. **Review**: Navigates to **"Pending Approvals"** (This list only shows users already verified by their respective shopkeepers).
3. **Action**: Performs a cross-check with government records and clicks **"Approve"**.
*   Status: Updates to `approved`
*   Profile Status: `verified_by_admin = TRUE`

**✅ Access Granted**: The user can now log in using their username and initial password to access their quota and book slots.

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
*   **Frontend**: `cd rationexample && npm run dev` (Port 5173/5180)

---

## 📂 Project Structure
*   **/frontend (or rationexample)**: React 18 with Vite, Lucide Icons, and modular styling.
*   **/backend**: Express.js server, MySQL connection pool, and JWT auth middleware.
*   **schema.sql**: The complete database design for audits and presentation documentation.

---
**Developed for College Presentation — 2026**
