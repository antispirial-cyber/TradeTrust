# TradeTrust - Mumbai Bazaar B2B Trust & Reputation Platform

TradeTrust is a B2B commercial reputation, dispute arbitration, and informal credit ledger platform engineered for wholesale and retail bazaar merchants across Mumbai trade clusters (Zaveri Bazaar, Crawford Market, Lamington Road, Dadar Market, Mangaldas Market). It features dynamic trust scoring, evidence-backed commercial dispute handling, an administrative retake complaint withdrawal workflow, and a private trade ledger.

- **GitHub Repository:** https://github.com/antispirial-cyber/TradeTrust
- **Live Preview:** https://trade-trust-two.vercel.app
- **Target Demo Environment:** Localhost (MySQL on port 3306 + Embedded Tomcat on port 8080 + React 18 on port 3000)

---

## 1. Official Platform Accounts

The database contains zero dummy accounts. It is pre-seeded with exactly four official Mumbai merchants and the Market Association Administrator:

| Trader Card / Business | Contact Phone | Password | Initial Score | Market Cluster | Commodity Sector | Role |
|---|---|---|---|---|---|---|
| **Rajpurohit Bangles** | `9820011111` | `tradetrust` | 10.00 | Zaveri Bazaar | Ornaments & Jewellery | Wholesaler |
| **Sharma Electronics** | `9820022222` | `tradetrust` | 10.00 | Lamington Road | Electronics | Retailer |
| **Seliya Stationary** | `9820033333` | `tradetrust` | 10.00 | Crawford Market | Stationery | Wholesaler |
| **Sankhe Jwells** | `9820044444` | `tradetrust` | 10.00 | Zaveri Bazaar | Gold & Silver Jewellery | Retailer |
| **Market Association Admin** | Username: `Admin` | `tradetrust` | 10.00 | South Mumbai | Market Governance | Administrator |

*Note: All passwords are authenticated against MySQL using SHA-256 cryptographic hashes (`e041baff2d3294f61dcc6b8c265e26562bfd8b21c9400ee8dc6d7ab6e1e09e0a`).*

---

## 2. University Coursework Mapping & Architecture

Built strictly within the Semester-3 Full Stack Java Technologies syllabus:

### 1. Database Connectivity (Step-by-Step Raw JDBC)
- **File:** `backend/src/main/java/com/tradetrust/DBConnection.java`
- All database connection parameters are located in this single class (`URL`, `USER`, `PASSWORD`, `DRIVER`).
- **Database Password Configuration Note:** If your local MySQL `root` password is not `tradetrust`, change the `PASSWORD` constant in `backend/src/main/java/com/tradetrust/DBConnection.java` to match your local password.
- Follows the explicit 6-step JDBC workflow:
  1. Load Driver (`Class.forName("com.mysql.cj.jdbc.Driver")`)
  2. Establish Connection (`DriverManager.getConnection(...)`)
  3. Prepare Statement (`conn.prepareStatement(...)`)
  4. Set Typed Parameters (`ps.setString(...)`, `ps.setInt(...)`, etc.)
  5. Execute Query / Update (`ps.executeQuery()`, `ps.executeUpdate()`)
  6. Resource Management: Automatic closure of `ResultSet`, `Statement`, and `Connection` via Java `try-with-resources`.

### 2. Embedded Tomcat & Servlet Engine Configuration
- **File:** `backend/src/main/java/com/tradetrust/TradeTrustApplication.java`
- Spring Boot is used solely as an embedded Tomcat 10 container wrapper (without Spring Data JPA or Spring Web MVC controllers).
- All URL mappings are explicitly registered via standard `ServletRegistrationBean`:
  - `/api/ping` -> `PingServlet`
  - `/api/auth/*` -> `AuthServlet`
  - `/api/traders/*`, `/api/trader/*` -> `TraderServlet`
  - `/api/complaints/*`, `/api/complaint/*` -> `ComplaintServlet`
  - `/api/admin/*` -> `AdminServlet`
  - `/api/connect/*` -> `ConnectionServlet`
  - `/api/notifications/*` -> `NotificationServlet`
  - `/api/ledger/*` -> `LedgerServlet`
  - `/api/upload`, `/uploads/*` -> `UploadServlet` (with `MultipartConfigElement`)

### 3. Data Access Object (DAO) Layer
- **Package:** `backend/src/main/java/com/tradetrust/dao/`
  - `TraderDAO.java` - Merchant profiles, search filters, trust score updates, verification badges.
  - `ComplaintDAO.java` - Dispute filings, evidence tracking, atomic verdict resolution, retake reversals.
  - `ConnectionDAO.java` - Mutual bazaar connections, mutual count calculation, request statuses, notification cleanup.
  - `NotificationDAO.java` - Private notifications, unread counts, association circular broadcasts.
  - `LedgerDAO.java` - Private credits given/received and status tracking with full update support.
  - `AuthDAO.java` - Administrator credentials, session tokens with 7-day expiration and session invalidation on password change.
- **Pure Separation of Concerns:** Servlets contain zero SQL queries; DAOs contain zero HTTP servlet objects.

### 4. Client-Side Architecture (React 18 & Vite)
- **API Client:** `src/api/client.js` is the sole entry point for network `fetch()` requests and centralized file uploads (`uploadFile`).
- **401 Session Handling:** Unauthorized responses clear stored tokens and notify the authentication context.
- **Constants:** `src/constants.js` provides centralized definitions for bazaar clusters, sectors, and complaint statuses.
- **Route Proxy:** `vite.config.js` proxies `/api` and `/uploads` requests directly to `http://localhost:8080`.
- **Session Persistence:** Login tokens are stored in the MySQL `sessions` table and verified on page load.

---

## 3. Dispute Arbitration & Complaint Retake Rule

### The Complaint Retake Rule:
1. When a merchant lodges a formal commercial dispute against another trader, the reported trader's trust score is frozen, and the complaint enters the arbitration queue with status `ESCALATED_TO_ADMIN`.
2. The merchant who filed the complaint may at any time request a **Retake (withdrawal)** of the claim from their *Disputes Tab*.
3. The retake request does **not** take effect immediately. It is flagged to the Market Association Administrator with an alert banner in the admin queue (`RETAKE_REQUESTED`).
4. **Administrative Approval:** The withdrawal takes effect **only after the Administrator reviews and approves the retake**.
5. Upon administrative approval (`RETAKE_APPROVED`):
   - The complaint is officially withdrawn.
   - Any trust score deduction (-1.50) that was previously applied to the reported merchant is **fully reversed and restored back to their score**.
   - If the merchant has no other active disputes, their score freeze is automatically lifted.
6. Upon administrative rejection (`RETAKE_REJECTED`):
   - The dispute remains under active Association review.

---

## 4. Setup and Execution (Localhost)

### Step 1: Initialize Database in MySQL
Make sure MySQL 8.x is running on port 3306. Run the `backend/schema.sql` script:

```powershell
# In PowerShell:
Get-Content backend/schema.sql | mysql -u root -p

# Or in Command Prompt (cmd) / MySQL CLI:
mysql -u root -p < backend/schema.sql
```
*(This single file drops and creates `tradetrust_db`, creates all 7 tables, and seeds the 4 merchant accounts and Admin).*

### Step 2: Start Backend (Port 8080)
In a dedicated terminal:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
Backend initializes and verifies MySQL connectivity on `http://localhost:8080`.

### Step 3: Start Frontend (Port 3000)
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 5. Build Verification

To verify clean compilation and zero errors:

```bash
# Compile Java backend
cd backend
.\mvnw.cmd clean compile

# Production bundle build for React frontend
cd ../frontend
npm run build
```
