# TRADETRUST — PROJECT DOCUMENTATION & SYSTEM ARCHITECTURE
**Academic Project:** Mumbai University, Semester 3
**Target Environment:** Localhost (MySQL 8 on port 3306 + Tomcat on port 8080 + React on port 3000)
**Repository:** https://github.com/antispirial-cyber/TradeTrust.git

---

## TABLE OF CONTENTS
1. [Executive Summary & Academic Context](#1-executive-summary--academic-context)
2. [Project Genesis, Business Problem & Domain Logic](#2-project-genesis-business-problem--domain-logic)
3. [Technology Stack & Syllabus Constraints](#3-technology-stack--syllabus-constraints)
4. [Official Accounts & Purged Dummy Data](#4-official-accounts--purged-dummy-data)
5. [Dual-Mode Operating Architecture & Localhost Persistence](#5-dual-mode-operating-architecture--localhost-persistence)
6. [Database Schema & JDBC Layer](#6-database-schema--jdbc-layer)
7. [Admin Features: Score Control, Complaint Visibility & Retake Flow](#7-admin-features-score-control-complaint-visibility--retake-flow)
8. [File Upload Pipeline (PDFs and Images)](#8-file-upload-pipeline-pdfs-and-images)
9. [Trust Score Mathematical Algorithm & ScoreRing Dynamics](#9-trust-score-mathematical-algorithm--scorering-dynamics)
10. [Frontend Structure, Routing & Component Hierarchy](#10-frontend-structure-routing--component-hierarchy)
11. [Design System, Theme Tokens & Emoji-Free Standards](#11-design-system-theme-tokens--emoji-free-standards)
12. [State Management, Cross-Tab Synchronization & Event Flow](#12-state-management-cross-tab-synchronization--event-flow)
13. [How to Run, Test, and Verify the Project](#13-how-to-run-test-and-verify-the-project)
14. [Viva & Academic Presentation Key Concepts](#14-viva--academic-presentation-key-concepts)

---

## 1. EXECUTIVE SUMMARY & ACADEMIC CONTEXT

- **Project Title:** TradeTrust (Bazaar Merchant Credit Reputation & Arbitration Registry)
- **Institution / Program:** Mumbai University, NEP 2020 Curriculum, Semester 3 (Final Year).
- **Core Courses Evaluated:**
  1. **Full Stack Java Technologies (FSJT)**: Multi-tier Client-Server Architecture, Jakarta Servlets (`HttpServlet`, `init`, `doGet`, `doPost`, `destroy`), raw 7-step JDBC, MySQL relational modeling, RESTful JSON communication.
  2. **Entrepreneurship Development**: Market validation, trade credit risk mitigation, bazaar cluster dynamics, platform trust incentives.
- **Academic Mentor Guidance:** For project grading, the professor specified: *"Database and Program are on the same machine for this semester"*.
- **Operating Modes:** The platform is engineered to function in **Full-Stack Mode** (Java 17 + Tomcat + MySQL on localhost) as well as **Zero-Configuration Client Mode** (Vite + React + Local Storage mock engine) to guarantee 100% testability on static hosts like Vercel or machines without MySQL installed.

---

## 2. PROJECT GENESIS, BUSINESS PROBLEM & DOMAIN LOGIC

### The Problem in Mumbai Wholesale Bazaars
- In traditional physical trade clusters across Mumbai (Zaveri Bazaar, Dadar Market, Mangaldas Market, Lamington Road, Crawford Market), wholesalers deliver consignments to retailers on informal credit (*chitti* / verbal agreement), expecting settlement in 15-30 days.
- **The Gap:** India's formal credit rating agencies (CIBIL, Experian, CRIF) exclusively track formal bank loans, credit cards, and NBFC lines. They have zero visibility into multi-crore daily bazaar trade credit.
- **The Pain:** When an unscrupulous merchant defaults or stalls payment indefinitely, that financial loss remains isolated to the victim. The defaulter easily moves two lanes over and takes fresh credit from another unsuspecting merchant.

### The Solution: TradeTrust
- TradeTrust functions as a specialized hybrid of **LinkedIn + Private Credit Bureau** tailored to Indian bazaar merchants:
  1. **Public Registry:** Searchable directory of wholesale and retail merchants categorized by Cluster and Sector.
  2. **Dynamic Trust Score (0.00 - 10.00):** Reputation score that increases with clean trade history and drops upon arbitrated payment defaults.
  3. **Admin Score Control:** Market Association Administrator can directly adjust any trader's score.
  4. **Structured Arbitration Queue & Retake Flow:** Enables victims to file claims with invoice evidence (PDF/JPG), while providing a complete "Retake Complaint" withdrawal workflow subject to Admin approval.
  5. **Confidential Private Ledger:** An offline-first personal accounting tool for credit given and received.
  6. **Bazaar Connect Network:** Allows merchants to establish mutual connections for collaborative credit trust.

---

## 3. TECHNOLOGY STACK & SYLLABUS CONSTRAINTS

The technology stack is locked to the university curriculum requirements:

| Component | Technology | Strict Constraint / Requirement |
|---|---|---|
| **Frontend** | React 18, Vite 5, React Router v6 | Pure functional components, hooks only (`useState`, `useEffect`, `useContext`, `useRef`). No class components. No server-side templates (No JSP, No Thymeleaf). |
| **Styling** | Vanilla CSS + CSS Custom Properties | No CSS frameworks (No Tailwind, No Bootstrap, No Material UI). Fully responsive down to 375px mobile screens. Dynamic runtime token injection. |
| **Backend** | Java 17, Spring Boot 3 (wrapper) | **Explicit Servlet classes** extending `HttpServlet`. Mandatory `doGet()`, `doPost()`, `init()`, and `destroy()` lifecycle implementations. |
| **Database Access** | Raw JDBC (`java.sql.*`) | **Zero ORM / Zero JPA / Zero Hibernate / Zero Spring Data**. Every SQL statement is handwritten with `PreparedStatement`. |
| **Database** | MySQL 8.x | Default port **3306** (explicitly NOT 3036, which was a typo in legacy notes). Database: `tradetrust_db`. |
| **Server / Proxy** | Embedded Tomcat (Port 8080) | Vite dev server on port 3000 proxies `/api` and `/uploads` to `http://localhost:8080`. |
| **Build Tools** | Maven (`pom.xml`) + npm (`package.json`) | Standalone buildable both via `mvn clean compile` and `npm run build`. |

---

## 4. OFFICIAL ACCOUNTS & PURGED DUMMY DATA

All legacy dummy accounts, dummy trader cards, and dummy complaints have been purged from the database seed script, backend authentication, and frontend mock data.

The system strictly contains **four official trader accounts** plus the **universal admin account**:

| Trader Card / Business Name | Contact Phone | Password | Initial Score | Cluster | Role |
|---|---|---|---|---|---|
| **Rajpurohit Bangles** | `9820111111` | `tradetrust` | 10.00 | Zaveri Bazaar | Wholesaler |
| **Sharma Electronics** | `9820222222` | `tradetrust` | 10.00 | Lamington Road | Wholesaler |
| **Seliya Stationary** | `9820333333` | `tradetrust` | 10.00 | Crawford Market | Retailer |
| **Sankhe Jwells** | `9820444444` | `tradetrust` | 10.00 | Zaveri Bazaar | Wholesaler |
| **Market Association Admin** | `admin` / `9999999999` | `tradetrust` | N/A | Central Desk | Platform Admin |

- **Login Flexibility:** Traders can log in using either their registered phone number or their exact business name / trader card.
- **Admin Access:** Accessible at `/admin` using username `Admin` and password `tradetrust`.

---

## 5. DUAL-MODE OPERATING ARCHITECTURE & LOCALHOST PERSISTENCE

```
                                  +---------------------------------------+
                                  |         Browser (Port 3000)          |
                                  |    React 18 + React Router DOM v6     |
                                  +---------------------------------------+
                                                      |
                                                      v
                                        +---------------------------+
                                        |  apiClient (client.js)    |
                                        +---------------------------+
                                          /                       \
                      [Backend Available] /                         \ [Backend Offline / Static Vercel]
                                         v                           v
             +---------------------------------------+   +---------------------------------------+
             |    Tomcat HTTP Server (Port 8080)     |   |       Client LocalStorage Engine      |
             |   Jakarta Servlets (HttpServlet)      |   |---------------------------------------|
             |  - AuthServlet        - ComplaintServlet|   | - tradetrust_traders                  |
             |  - TraderServlet      - LedgerServlet |   | - tradetrust_complaints               |
             |  - BrowseServlet      - ConnectionServlet| | - tradetrust_current_user            |
             |  - ScoreServlet       - AdminServlet  |   | - tradetrust_notifications            |
             |  - UploadServlet                      |   | - tradetrust_ledger                   |
             +---------------------------------------+   +---------------------------------------+
                                 |
                                 v
             +---------------------------------------+
             |            DAO Layer (JDBC)           |
             |  - TraderDAO          - ComplaintDAO  |
             |  - LedgerDAO          - AdminDAO      |
             +---------------------------------------+
                                 |
                                 v
             +---------------------------------------+
             |         MySQL 8 (Port 3306)           |
             |           tradetrust_db               |
             +---------------------------------------+
```

### Localhost Persistence Requirement
- When a user signs up on localhost, the registration is stored permanently in the MySQL database (`tradetrust_db`) via `TraderDAO.insertTrader()`.
- The user session is persisted in browser local storage and tied to their registered phone number and credentials, allowing seamless repeat logins from the same device across browser restarts and server restarts without re-registering.

---

## 6. DATABASE SCHEMA & JDBC LAYER

Located at: `backend/src/main/resources/schema.sql`

### Tables Summary
1. **`traders`**:
   - `trader_id` INT AUTO_INCREMENT PRIMARY KEY
   - `name` VARCHAR(100) NOT NULL
   - `phone` VARCHAR(15) NOT NULL UNIQUE
   - `business_name` VARCHAR(150) NOT NULL
   - `business_desc` TEXT
   - `role` ENUM('WHOLESALER','RETAILER') NOT NULL
   - `cluster` VARCHAR(100) NOT NULL
   - `sector` VARCHAR(100) NOT NULL
   - `photo_path` VARCHAR(255)
   - `password_hash` VARCHAR(255) NOT NULL (SHA-256)
   - `trust_score` DECIMAL(4,2) DEFAULT 10.00
   - `score_frozen` BOOLEAN DEFAULT FALSE
   - `score_before_freeze` DECIMAL(4,2)
   - `is_verified_badge` BOOLEAN DEFAULT FALSE
   - `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP

2. **`complaints`**:
   - `complaint_id` INT AUTO_INCREMENT PRIMARY KEY
   - `reporter_id` INT NOT NULL (FK -> `traders`)
   - `reported_id` INT NOT NULL (FK -> `traders`)
   - `description` TEXT NOT NULL
   - `amount_disputed` DECIMAL(12,2)
   - `incident_date` DATE NOT NULL
   - `proof_path` VARCHAR(255)
   - `status` ENUM('PENDING','ROUND_1_COUNTER_FILED','ESCALATED_TO_ADMIN','APPROVED','REJECTED','RETAKE_REQUESTED','RETAKE_APPROVED')
   - `created_at` DATETIME, `updated_at` DATETIME

3. **`ledger_entries`**:
   - `entry_id` INT AUTO_INCREMENT PRIMARY KEY
   - `owner_id` INT NOT NULL (FK -> `traders`)
   - `party_name` VARCHAR(150) NOT NULL
   - `amount` DECIMAL(12,2) NOT NULL
   - `entry_type` ENUM('CREDIT_GIVEN','CREDIT_RECEIVED') NOT NULL
   - `entry_date` DATE NOT NULL
   - `description` VARCHAR(255)
   - `status` ENUM('PENDING','PAID','OVERDUE') DEFAULT 'PENDING'

4. **`connections`**:
   - `connection_id` INT AUTO_INCREMENT PRIMARY KEY
   - `requester_id` INT NOT NULL, `receiver_id` INT NOT NULL
   - `status` ENUM('PENDING','ACCEPTED','REJECTED') DEFAULT 'PENDING'

5. **`notifications`**:
   - `notification_id` INT AUTO_INCREMENT PRIMARY KEY
   - `recipient_id` INT NOT NULL
   - `type` VARCHAR(50) NOT NULL
   - `message` TEXT NOT NULL, `link_ref` VARCHAR(255), `is_read` BOOLEAN DEFAULT FALSE

6. **`admins`**:
   - `admin_id` INT AUTO_INCREMENT PRIMARY KEY
   - `username` VARCHAR(50) NOT NULL UNIQUE
   - `password_hash` VARCHAR(255) NOT NULL
   - `role` VARCHAR(50) DEFAULT 'SUPER_ADMIN'

### The Mandatory 7-Step JDBC Execution Standard
All DAOs adhere strictly to the syllabus pattern:
1. Load JDBC driver: `Class.forName("com.mysql.cj.jdbc.Driver");`
2. Create connection: `Connection conn = DriverManager.getConnection(url, user, pass);`
3. Create statement: `PreparedStatement ps = conn.prepareStatement(sql);`
4. Set query parameters: `ps.setObject(index, value);`
5. Execute query: `ResultSet rs = ps.executeQuery();` or `ps.executeUpdate()`
6. Process results: Iterate `while (rs.next())` and map to domain objects
7. Close resources: Try-with-resources or explicit close in `finally` block

---

## 7. ADMIN FEATURES: SCORE CONTROL, COMPLAINT VISIBILITY & RETAKE FLOW

### 7.1 Score Control
- **Backend Endpoint:** `POST /api/admin/trader/{id}/score` handled in `AdminServlet.java`.
- **DAO Implementation:** `TraderDAO.updateScore(int traderId, BigDecimal newScore)` persists custom scores clamped between 0.00 and 10.00.
- **Admin UI:** Accessible in `/admin` under the **Merchants** tab via the **Edit Score** button on any trader row.

### 7.2 Complaint Visibility
In `/admin` under the **Disputes** queue, every arbitration case card displays:
1. **Who filed the complaint:** Filer business name or name.
2. **User ID:** Filer's integer ID (`User ID: X`).
3. **Reported Trader Card:** Reported merchant business name and cluster.
4. **Dispute Meta:** Disputed amount in INR, incident date, and proof document link.

### 7.3 Complaint Retake Flow
```
[User Filed Complaint]
          |
          v
[User Dashboard -> Disputes Tab]
          |
          | User clicks "Retake Complaint"
          v
[Status Changed to RETAKE_REQUESTED]
          |
          v
[Admin Arbitration Queue]
  - Displays prominent Retake Notice Banner:
    "RETAKE REQUESTED: The complainant has requested to withdraw/retake this complaint."
  - Provides Action Buttons: "Approve Retake" vs "Dismiss Request"
          |
          +-------------------------------+
          |                               |
          v                               v
[Admin Approves Retake]          [Admin Dismisses Retake]
  - Status -> RETAKE_APPROVED      - Status reverts to ESCALATED_TO_ADMIN
  - If previously APPROVED:        - Investigation proceeds as normal
    * Score penalty (+1.50)
      is revoked and restored
    * Score is unfrozen
  - If previously PENDING:
    * Score is unfrozen
    * No penalty ever applied
```

---

## 8. FILE UPLOAD PIPELINE (PDFS AND IMAGES)

### Implementation Details
- **Frontend Utility:** `src/utils/fileUpload.js` accepts file objects and dispatches a multipart `FormData` POST request to `/api/upload`.
- **Backend Handler:** `UploadServlet.java` running on embedded Tomcat:
  - Validates MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
  - Generates unique timestamped filenames: `doc_<timestamp>_<clean_filename>`.
  - Stores files in `backend/uploads/` on the local machine.
  - Serves files with inline disposition (`Content-Disposition: inline`) allowing direct in-browser preview of PDF vouchers and invoices during demonstrations.
- **Client Fallback:** If the backend is running in offline mode, `fileUpload.js` automatically converts the file into a base64 Data URL, allowing instant client-side preview in the browser.

---

## 9. TRUST SCORE MATHEMATICAL ALGORITHM & SCORERING DYNAMICS

### Formula Specification
```
Trust Score = Baseline (10.00)
            - (1.50 * Count of APPROVED Complaints)
            - (0.50 * Count of OVERDUE Ledger Entries)
            + (0.10 * Min(10, Count of PAID Ledger Entries))
            + (0.05 * Min(10, Count of Mutual ACCEPTED Connections))

Clamped Range: [0.00, 10.00]
Rounding: RoundingMode.HALF_UP to 2 decimal places
```

### Color Interpolation & Ring Visualization
The ScoreRing SVG is defined in `src/components/common/ScoreRing.jsx`:
- `0.0` -> Deep Red `rgb(214, 40, 40)`
- `2.5` -> Orange `rgb(247, 127, 0)`
- `5.0` -> Amber `rgb(244, 211, 94)`
- `7.5` -> Lime `rgb(144, 190, 109)`
- `10.0` -> Vivid Green `rgb(45, 198, 83)`

---

## 10. FRONTEND STRUCTURE, ROUTING & COMPONENT HIERARCHY

```
src/
├── App.jsx                     (Router root, ToastProvider, ThemeProvider, AuthProvider)
├── main.jsx                    (Entrypoint, imports global.css & variables.css)
├── api/                        (Dual-mode API abstraction layer)
│   ├── admin.js                (Metrics, dispute resolution, retake approval, custom score)
│   ├── auth.js                 (Login, register, adminLogin, current user session)
│   ├── client.js               (apiClient fetch wrapper, token handling)
│   ├── complaints.js           (File dispute, retake request, user filed complaints)
│   ├── connections.js          (Connect toggle, mutual status)
│   ├── ledger.js               (Private ledger CRUD)
│   ├── mockData.js             (4 official traders, clean initial state)
│   ├── notifications.js        (Notification feed & mark as read)
│   ├── settings.js             (Accent color & theme persistence)
│   └── traders.js              (getTraders registry with deduplication, getTraderById)
├── components/
│   ├── browse/
│   │   ├── FilterBar.jsx       (Cluster, Sector, Role dropdowns, search input)
│   │   └── TraderCard.jsx      (Card with 48px ScoreRing, photo/initial, ConnectButton)
│   ├── common/
│   │   ├── ConnectButton.jsx   (Toggle state: Connect, Pending, Connected)
│   │   ├── CourseworkPortfolio.jsx (Academic syllabus coursework proof bar)
│   │   ├── FloatingHelp.jsx    (Quick syllabus & help popup widget)
│   │   ├── Icons.jsx           (Feather-style SVG icons: Sun, Moon, Check, UploadCloud, etc.)
│   │   ├── ScoreRing.jsx       (Dynamic SVG ring with glow and color interpolation)
│   │   └── VerifiedBadge.jsx   (Green badge for clean traders)
│   ├── dashboard/
│   │   ├── DisputesTab.jsx     (Filed disputes view with Retake Complaint action)
│   │   ├── LedgerTab.jsx       (Private ledger table, totals, modal trigger)
│   │   ├── PastRecordsTab.jsx  (List of approved past arbitrations)
│   │   └── ProfileTab.jsx      (Merchant details, lane, avatar photo uploader)
│   ├── layout/
│   │   ├── AppLayout.jsx       (Shell: Sidebar + Navbar + Outlet + BottomNav)
│   │   ├── BottomNav.jsx       (Mobile bottom nav bar)
│   │   ├── Navbar.jsx          (Top bar with search, notification bell, user pill)
│   │   └── Sidebar.jsx         (Desktop sidebar with logo and navigation links)
│   └── modals/
│       ├── AdminLoginModal.jsx (Direct login modal for /admin access)
│       ├── ComplaintModal.jsx  (Multi-step dispute filing with PDF/image dropzone)
│       ├── ContactModal.jsx    (Association contact info modal)
│       ├── LedgerEntryModal.jsx(Add/edit private ledger record modal)
│       └── TermsModal.jsx      (Bazaar arbitration terms and conditions)
├── context/
│   ├── AuthContext.jsx         (Active user session, login, register, logout, sync)
│   ├── ThemeContext.jsx        (Theme mode: dark/light, accent color, token applier)
│   └── ToastContext.jsx        (Toast banner notification provider)
├── pages/
│   ├── AdminPage.jsx           (Full Association Governance, Score Control & Arbitration)
│   ├── BrowsePage.jsx          (Public merchant registry directory)
│   ├── DashboardPage.jsx       (Profile, Ledger, Past Records, Filed Disputes)
│   ├── LoginPage.jsx           (Auth portal with 4 official account quick-login buttons)
│   ├── NotFoundPage.jsx        (404 catch-all screen)
│   ├── NotificationsPage.jsx   (Notifications feed)
│   ├── PublicProfilePage.jsx   (Merchant public profile with 120px ScoreRing)
│   └── SettingsPage.jsx        (Profile photo upload, account details, theme/color picker)
└── utils/
    ├── fileUpload.js           (Multipart upload utility for PDFs and images)
    └── imageUpload.js          (Client image compression & fallback)
```

---

## 11. DESIGN SYSTEM, THEME TOKENS & EMOJI-FREE STANDARDS

- **Zero Emojis Policy:** All emojis have been completely eliminated from source code, string literals, comments, console logs, and user-facing outputs across both frontend and backend. Standard SVG icons (from `Icons.jsx`) or clean text labels are used throughout.
- **Dark Obsidian Theme (`:root, [data-theme="dark"]`):** High contrast bazaar trading palette with deep navy cards.
- **Light Slate Theme (`[data-theme="light"]`):** Crisp 2-tone canvas with Slate-300 borders and Slate-900 typography.

---

## 12. STATE MANAGEMENT, CROSS-TAB SYNCHRONIZATION & EVENT FLOW

1. **Custom Event (`tradetrust_score_updated`):** Dispatched whenever an admin resolves a complaint, toggles a freeze, or edits a score.
2. **Storage Event (`storage`):** Fired across browser tabs to synchronize updates.
3. **Window Focus Event (`focus`):** Re-fetches current scores when the user switches tabs back to the registry or profile.
4. **Subscribed Components:**
   - `BrowsePage.jsx`: Re-fetches and updates all cards.
   - `PublicProfilePage.jsx`: Re-fetches the merchant record.
   - `AuthContext.jsx`: Updates the session user's score if they were the reported merchant.

---

## 13. HOW TO RUN, TEST, AND VERIFY THE PROJECT

### Frontend Only (Client-First / Fallback Mode)
```bash
npm install
npm run dev
# Open browser at http://localhost:3000
```

### Full-Stack Mode (React + Spring Boot + MySQL on Localhost)
1. **Initialize MySQL (Port 3306):**
   ```bash
   mysql -u root -p < backend/src/main/resources/schema.sql
   ```
2. **Start Spring Boot Backend (Port 8080):**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. **Start React Frontend (Port 3000):**
   ```bash
   npm run dev
   ```

### Default Credentials for Verification
- **Universal Admin:** Username `Admin`, Password `tradetrust` (at `/admin`)
- **Trader 1:** `Rajpurohit Bangles` (Phone: `9820111111`, Password: `tradetrust`)
- **Trader 2:** `Sharma Electronics` (Phone: `9820222222`, Password: `tradetrust`)
- **Trader 3:** `Seliya Stationary` (Phone: `9820333333`, Password: `tradetrust`)
- **Trader 4:** `Sankhe Jwells` (Phone: `9820444444`, Password: `tradetrust`)

---

## 14. VIVA & ACADEMIC PRESENTATION KEY CONCEPTS

Be prepared to explain the following during the presentation:
1. **Client-Server Architecture:** Separation of concerns between React SPA presentation tier, Jakarta Servlet application tier on Tomcat, and MySQL relational persistence tier.
2. **Tomcat Servlet Lifecycle:** `init()` (initialization once), `service()` / `doGet()` / `doPost()` (per-request handling on worker threads), and `destroy()` (clean resource release).
3. **7-Step JDBC Pipeline:** Explicit loading of driver, connection pooling / connection management, parameterized `PreparedStatement` to prevent SQL Injection, and resource closing.
4. **Zero ORM Rationale:** Why raw JDBC was chosen over JPA/Hibernate (exact alignment with semester syllabus, transparent SQL execution, predictable performance).
5. **Dynamic Trust Score Algorithm:** Mathematical penalty formula, score freezing during pending arbitration, and the retake penalty reversal mechanism.
6. **Retake Complaint Workflow:** The bilateral dispute protocol where filers can request retakes, requiring administrative approval before penalties or freezes are lifted.
