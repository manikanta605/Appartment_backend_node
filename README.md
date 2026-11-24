# Residex™ — Residential Management SaaS Backend

Production-ready Node.js & Express multi-tenant SaaS backend for residential societies and apartment complexes.

## 🚀 Key Features
- **Multi-Tenant SaaS Architecture**: Super Admin, Society Admin, Residents, Gatekeeper.
- **Dual Database Engine**: Native support for **SQLite** (self-contained local file) and **PostgreSQL**.
- **Automated Monthly Dues Engine**: Runs on the 1st of every month (`Current Month Maintenance + Unpaid Previous Dues = Total Payable`).
- **Visitor Security Pass**: 6-digit PIN pass generation for residents and instant gatekeeper verification terminal.
- **Security Patrol & QR Scanner Rounds**: Physical checkpoint scanning (Terrace, Basement, Generator Room, Gates) with live resident logs and alerts.
- **Payment Gateway**: Integrated Razorpay order creation and cryptographic signature verification.
- **Society Amenities & Bookings**: Facility management with admin approval workflows.
- **Complaints & Helpdesk**: Ticket lifecycle (`Open` ➔ `In Progress` ➔ `Resolved`).
- **Community Forum & Notices**: Announcements and resident notice boards.
- **Society Expenses & Treasury**: Category-based expense tracking and finance ledger.

---

## 🛠️ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
To run zero-setup with SQLite (default):
```properties
DB_DIALECT=sqlite
DB_STORAGE=./residex.sqlite
```

#### 🔥 Firebase Cloud Messaging (FCM) Push Notifications:
1. Create a Firebase project at https://console.firebase.google.com/
2. Go to **Project Settings** > **Service accounts**, click **Generate new private key**.
3. Save the downloaded JSON file as `backend/config/serviceAccountKey.json`. (On Render/cloud, paste the JSON content directly into the `FIREBASE_SERVICE_ACCOUNT` environment variable).
4. Add your Android app (`com.residex.app`) in Firebase, download `google-services.json`, and place it in `mobileapp/android/app/google-services.json`.
*(Note: If credentials are not yet supplied, the system operates seamlessly in smart simulation & Web Audio chime mode).*

### 3. Seed Database
Initializes Super Admin, Societies (`SNC`, `GVH`), initial flats, residents, and gatekeeper accounts:
```bash
node seed.js
```

### 4. Start Server
```bash
node server.js
```
The API server will run at `http://localhost:3000`.

---

## 🧪 Run Automated Test Suite
Includes 34 end-to-end integration test scenarios:
```bash
node test_suite.js
```

---

## 🔐 Default Seed Logins
- **Super Admin**: `superadmin` / `superadmin123`
- **SNC Society Admin**: `admin` / `admin123` (Code: `SNC`)
- **SNC Resident**: `9870543201` / `a101123` (Flat A-101)
- **SNC Gatekeeper**: `watchman` / `gatekeeper123` (Code: `SNC`)
- **GVH Society Admin**: `gvh_admin` / `gvh123` (Code: `GVH`)
- **GVH Resident**: `9880112233` / `b101123` (Flat B-101)

