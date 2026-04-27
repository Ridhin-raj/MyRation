# 🇮🇳 Smart Ration Management System (SRMS)

[![React](https://img.shields.io/badge/Frontend-React.js-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Security-JWT-purple?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)

A state-of-the-art Digital Public Distribution System (PDS) designed to streamline the distribution of essential commodities. This platform provides transparency, accountability, and convenience for both administrators and citizens.

> 📄 **Documentation Highlight**: The system features an advanced **Demand-Driven Supply Chain** with algorithmic resource allocation, strict `UPSERT` inventory syncing, precise end-of-month expiration limits, and surplus-aware distribution dynamics. Refer to the **Detailed Project Report** for an exhaustive review of the logic, schemas, and security guardrails governing the monthly iteration cycles.

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

## 📋 Requirement Analysis

### 1. Functional Requirements

#### R.1 LOGIN

**R.1.1 User Login**

**I. Login Selection**
* **Description:** Selection of “Login” option.
* **Input:** User selects the Login option.
* **Output:** Prompted to enter Username and Password.

**II. Login Verification**
* **Description:** Verifies the entered Username and Password. If valid, the system checks the user role and approval status.
* **Input:** Username and Password entered.
* **Output:**
  * If Admin, redirects to Admin Dashboard.
  * If Shopkeeper, redirects to Shopkeeper Dashboard after approval verification.
  * If Beneficiary/User, redirects to User Dashboard after approval verification.

**III. Invalid Login Handling**
* **Description:** Displays error message for incorrect credentials or pending approval.
* **Input:** Wrong Username/Password or unapproved account.
* **Output:** Error message such as “Invalid Username or Password” or “Account Pending Approval”.

---

#### R.2 REGISTRATION

**R.2.1 Beneficiary Registration**

**I. Selection of “Register” Option**
* **Description:** Starts beneficiary registration process.
* **Input:** User selects registration option.
* **Output:** Prompted to enter personal and ration details.

**II. Registration**
* **Description:** Registers beneficiary by entering required details.
* **Input:** Name, Aadhaar, mobile, ration card number, card type, address, selected shop, password, username.
* **Output:** Confirmation message “Registration Submitted Successfully”.
* **Process:** Details stored in database with pending approval status.

**R.2.2 Shopkeeper Registration**

**I. Selection of “Register as Shopkeeper” Option**
* **Description:** Starts shopkeeper registration process.
* **Input:** User selects shopkeeper registration.
* **Output:** Prompted to enter owner and shop details.

**II. Registration**
* **Description:** Registers shopkeeper and shop information.
* **Input:** Owner name, mobile, Aadhaar, shop name, license number, location, password, username.
* **Output:** Confirmation message “Shop Registration Submitted”.
* **Process:** Shopkeeper details stored with pending admin approval.

---

#### R.3 BENEFICIARY SERVICES

**R.3.1 View Profile**
* **Description:** Displays beneficiary profile details.
* **Input:** Select Profile option.
* **Output:** Name, ration card type, address, assigned shop details displayed.

**R.3.2 View Monthly Quota** 
* **Description:** Displays allocated monthly ration items.
* **Input:** Select Quota option.
* **Output:** Rice, wheat, sugar, kerosene and quantity displayed based on card type.

**R.3.3 View Distribution History**
* **Description:** Displays ration collection history.
* **Input:** Select History option.
* **Output:** List of previous ration transactions.

**R.3.4 View Alerts/Notifications**
* **Description:** Displays stock arrival and notification alerts.
* **Input:** Select Alerts option.
* **Output:** New stock and announcements displayed.

---

#### R.4 SHOPKEEPER SERVICE

**R.4.1 View Shop Stock**
* **Description:** Displays available stock in ration shop.
* **Input:** Select Stock option.
* **Output:** Item name, allocated quantity, distributed quantity, available balance.

**R.4.2 Update Stock**
* **Description:** Adds new stock to ration shop inventory.
* **Input:** Item selected and quantity entered.
* **Output:** Stock updated successfully.

**R.4.3 Distribute Ration**
* **Description:** Records ration issued to beneficiaries.
* **Input:** Select item and quantity sold.
* **Output:** Distribution recorded and stock updated.

---

#### R.5 ADMIN SERVICE

**R.5.1 Dashboard Management**
* **Description:** Displays overall system statistics.
* **Input:** Open dashboard.
* **Output:** Total users, pending approvals, pending complaints displayed.

**R.5.2 Approve Registrations**
* **Description:** Admin verifies pending beneficiary and shopkeeper accounts.
* **Input:** Select pending request and approve/reject.
* **Output:** Registration status updated.

**R.5.3 Manage Quota**
* **Description:** Admin sets ration quantity and price for card types.
* **Input:** Card type, item name, quantity, price.
* **Output:** Quota updated successfully.

**R.5.4 Add New Item**
* **Description:** Adds new ration item to all card categories and shop stocks.
* **Input:** Item name, quantity, price, unit.
* **Output:** New item added successfully.

**R.5.5 Complaint Management**
* **Description:** Admin reviews and resolves complaints.
* **Input:** Complaint ID and action (resolve/warn/dismiss).
* **Output:** Complaint status updated.

---

#### R.6 COMPLAINT MANAGEMENT

**R.6.1 File Complaint**
* **Description:** Beneficiary can submit complaint against ration shop.
* **Input:** Shop details, complaint description.
* **Output:** Complaint registered successfully.

**R.6.2 Warning Alert**
* **Description:** Sends warning notification to shopkeeper if complaint verified.
* **Input:** Admin selects warning action.
* **Output:** Warning alert sent to shopkeeper.

---

## 📊 System Architecture & Data Flow

### 1. Entity-Relationship (ER) Diagram
Maps the relational dependencies tying identity models (`users`, `shops`) to strictly audited monthly supply ledgers.
```mermaid
erDiagram
    USERS {
        int id PK
        string username "UNIQUE"
        string password "Hashed"
        enum role "user, shopkeeper, admin"
        string name
        string mobile
        string aadhaar
        enum status "pending, approved, rejected"
        timestamp created_at
    }

    SHOPS {
        int id PK
        int owner_id FK "References USERS(id)"
        string shop_name
        string license_no
        int capacity
        string state
        string district
        string taluk
        string village
        string pincode
        boolean is_open
        enum status "pending, approved"
    }

    USER_PROFILES {
        int id PK
        int user_id FK
        date dob
        enum gender "Male, Female, Other"
        string ration_card_no "UNIQUE"
        enum card_type "APL, BPL, AAY, PHH"
        int family_members
        string ration_card_image
        string state
        string pincode
        int assigned_shop_id FK
        boolean verified_by_shopkeeper
        boolean verified_by_admin
    }

    STOCK {
        int id PK
        int shop_id FK
        string item_name
        decimal allocated_qty
        decimal distributed_qty
        string unit "kg/ltr"
        string month_year "e.g., 4-2026"
        timestamp last_updated
    }

    ASSIGNED_STOCK {
        int id PK
        int shop_id FK
        string item_name
        decimal quantity
        enum status "PENDING, VERIFIED"
        string month_year
        timestamp created_at
    }

    QUOTA {
        int id PK
        enum card_type "APL/BPL/AAY/PHH"
        string item_name "Rice/Dal/Sugar"
        string quantity
        string price
    }

    USER_BALANCES {
        int id PK
        int user_id FK
        string item_name
        decimal total_quota
        decimal remaining_quota
        string month_year "Month binding"
    }

    QUOTA_HISTORY {
        int id PK
        int user_id FK
        int shop_id FK
        enum action_type "COLLECTED"
        string item_name
        decimal amount
        decimal remaining_quota
        decimal total_quota
        timestamp timestamp
    }

    STOCK_HISTORY {
        int id PK
        int shop_id FK
        string item_name
        enum action_type "ADDED, DISTRIBUTED"
        decimal quantity
        int user_id FK "Nullable"
        timestamp timestamp
    }

    COMPLAINTS {
        int id PK
        int user_id FK
        int shop_id FK
        string complaint_type
        text message
        enum status "pending, resolved"
        text admin_response
    }

    ALERTS {
        int id PK
        int user_id FK
        int shop_id FK
        string message
        enum alert_type
        boolean is_read
    }

    USERS ||--o| USER_PROFILES : "Extends Profile"
    USERS ||--o{ SHOPS : "Manages (owner_id)"
    SHOPS ||--o{ USER_PROFILES : "Serves Beneficiaries"
    SHOPS ||--o{ STOCK : "Inventory per month"
    SHOPS ||--o{ ASSIGNED_STOCK : "Receives shipments"
    USERS ||--o{ USER_BALANCES : "Holds monthly quota"
    USERS ||--o{ QUOTA_HISTORY : "Collection audit"
    SHOPS ||--o{ QUOTA_HISTORY : "Origin of collection"
    SHOPS ||--o{ STOCK_HISTORY : "Inventory audit"
    USERS ||--o{ COMPLAINTS : "Lodges"
    SHOPS ||--o{ COMPLAINTS : "Target of"
```

### 2. Level 0 DFD (Context Diagram)
Maps the holistic interactions between external actors and the bounds of the System.
```mermaid
flowchart TD
    Admin([District Admin])
    Shopkeeper([Shopkeeper / FPS])
    Citizen([Beneficiary Citizen])
    
    System((Smart Ration\nManagement System))
    
    Admin -->|Approve/Query/Ship| System
    System -->|Analytics/Alerts| Admin
    
    Shopkeeper -->|Register/Verify/Receive/Sell| System
    System -->|Pending Ship/Inventory Node| Shopkeeper
    
    Citizen -->|Register/Book Slot/Collect| System
    System -->|Alerts/Quota Status| Citizen
```

### 3. Level 1 DFD (Subsystem Modules)
Breaks the main processes into Registration, Algorithmic Allocation, Inventory Sync, and the Atomic Sale Node.
```mermaid
flowchart TD
    E1([District Admin])
    E2([Shopkeeper])
    E3([Beneficiary])

    P1((1.0\nAuth & Registration))
    P2((2.0\nAlgorithmic Supply Push))
    P3((3.0\nInventory Sync & Verification))
    P4((4.0\nRation Distribution Loop))

    D1[(System Entities DB)]
    D2[(Logistics & Stock DB)]

    E3 & E2 & E1 --> P1 --> D1
    E1 --> P2 <--> D1
    P2 <--> D2
    E2 --> P3 <--> D2
    E3 & E2 --> P4 <--> D2
```

### 4. Level 2 DFDs (Atomic Processes)
Microscopic views detailing the internal architecture of each isolated subsystem module.

#### 4.1. Process 1.0: Auth & Registration
```mermaid
flowchart TD
    Beneficiary([Beneficiary])
    Shopkeeper([Shopkeeper])
    Admin([District Admin])

    P11["1.1 Submit Beneficiary Profile"]
    P12["1.2 Submit Shopkeeper Registration"]
    P13["1.3 Hash Password & Store Data"]
    P14["1.4 Shopkeeper Local Verification"]
    P15["1.5 Admin Final Approval"]

    D_Users[("DB: users & user_profiles")]
    D_Shops[("DB: shops")]

    Beneficiary -->|Details & Aadhaar| P11
    Shopkeeper -->|Shop Details & License| P12

    P11 --> P13
    P12 --> P13
    
    P13 -->|INSERT User Status: Pending| D_Users
    P13 -->|INSERT Shop Status: Pending| D_Shops

    Shopkeeper -->|Verify Assigned Users| P14
    P14 -->|UPDATE verified_by_sk=TRUE| D_Users

    Admin -->|Review Pending List| P15
    P15 -->|UPDATE User Status=Approved| D_Users
    P15 -->|UPDATE Shop Status=Approved| D_Shops
```

#### 4.2. Process 2.0: Algorithmic Supply Push
```mermaid
flowchart TD
    Admin([District Admin])

    P21["2.1 Query Active Users mapped to Shop"]
    P22["2.2 Multiply by Card Type Quotas"]
    P23["2.3 Query Previous Month Surplus"]
    P24["2.4 Calculate Net Shipment Suggestion"]
    P25["2.5 Execute Stock Assignment"]

    D_Users[("DB: user_profiles")]
    D_Stock[("DB: stock (prev month)")]
    D_Quota[("DB: quota logic")]
    D_Transit[("DB: assigned_stock")]

    Admin -->|"Request Demand"| P21
    P21 <-->|"Fetch 'Approved' Cards"| D_Users
    P21 --> P22 <-->|"Fetch Multipliers"| D_Quota
    P22 -->|"Gross Demand"| P23
    P23 <-->|"Fetch (Allocated-Distributed)"| D_Stock
    P23 --> P24
    P24 -->|"Net Suggested Shipment"| Admin

    Admin -->|"Confirm Allocation"| P25
    P25 -->|"INSERT Status='PENDING' + MM-YYYY"| D_Transit
```

#### 4.3. Process 3.0: Inventory Sync & Verification
```mermaid
flowchart TD
    Shopkeeper([Shopkeeper])

    P31["3.1 Fetch 'PENDING' Shipments"]
    P32["3.2 Physical Intake & Verification"]
    P33["3.3 Atomic UPSERT to Shop Ledger"]
    P34["3.4 Generate Inventory Audit Log"]

    D_Transit[("DB: assigned_stock")]
    D_Stock[("DB: stock (current month)")]
    D_Hist[("DB: stock_history")]

    Shopkeeper -->|View Dashboard| P31
    P31 <-->|Filter by MonthYear| D_Transit
    
    P31 -->|Pending List| Shopkeeper
    Shopkeeper -->|Click Verify and Receive| P32
    
    P32 -->|UPDATE Status VERIFIED| D_Transit
    P32 --> P33
    P33 -->|INSERT or UPDATE allocated qty| D_Stock
    P33 --> P34
    P34 -->|INSERT ADDED Event| D_Hist
```

#### 4.4. Process 4.0: Ration Distribution Loop
```mermaid
flowchart TD
    Input(["API: /collect-ration [UserID, Item, Amount]"])
    Beneficiary([Beneficiary Citizen])
    Shopkeeper([Shopkeeper / FPS])
    
    Beneficiary -->|Presents ID & Requests Ration| Shopkeeper
    Shopkeeper -->|Authorizes & Submits| Input
    
    P41["4.1 Validate Identity Binding"]
    P42["4.2 Interrogate 'user_balances' MM-YYYY"]
    P43["4.3 Interrogate 'stock' capacity"]
    P44["4.4 Execute Atomic SQL Updates"]
    P45["4.5 Push Immutable Audit Logs"]
    
    D_Users[("DB: user_profiles")]
    D_Bal[("DB: user_balances")]
    D_Stock[("DB: stock")]
    D_Hist[("DB: audit_logs")]

    Input --> P41 <--> D_Users
    P41 -->|Authorized | P42 <--> D_Bal
    P42 -->|Quota Valid| P43 <--> D_Stock
    P43 -->|Stock Valid| P44 -->|Subtract and UPDATE| D_Bal & D_Stock
    P44 --> P45 -->|INSERT| D_Hist
    P45 --> Output(["Output: Ration Disbursed"])
    
    Output -->|Updates Balance & Hands over Goods| Beneficiary
    
    P41 -.->|Fails| Reject1(["Abort: 403 Security"])
    P42 -.->|Fails| Reject2(["Abort: 400 Quota"])
    P43 -.->|Fails| Reject3(["Abort: 400 Stock"])
```

---
**Developed for College Presentation — 2026**
