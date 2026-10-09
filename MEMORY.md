# TRADETRUST — PROJECT DOCUMENTATION & SYSTEM ARCHITECTURE
**Academic Project:** Mumbai University, Semester 3 (Full Stack Java Technologies & Entrepreneurship Development)
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
12. [State Management, Cross-Tab Synchronization & Storage Integrity](#12-state-management-cross-tab-synchronization--storage-integrity)
13. [How to Run, Test, and Verify the Project](#13-how-to-run-test-and-verify-the-project)
14. [Viva & Academic Presentation Key Concepts](#14-viva--academic-presentation-key-concepts)
15. [Detailed Cleanup Changelog](#15-detailed-cleanup-changelog)

---

## 1. EXECUTIVE SUMMARY & ACADEMIC CONTEXT

- **Project Title:** TradeTrust (B2B Trust and Reputation Platform for Wholesale Bazaar Traders)
- **Institution / Program:** Mumbai University, Semester 3 (Final Year).
- **Core Syllabus Topics Covered:**
  1. **Full Stack Java Technologies (FSJT)**: Multi-tier Client-Server Architecture, Jakarta Servlets (`HttpServlet`, `init`, `doGet`, `doPost`, `destroy`), raw 7-step JDBC with `PreparedStatement`, MySQL relational database schema, RESTful JSON communication, multipart file upload processing.
  2. **Entrepreneurship Development**: Commercial trust mechanics, uncollateralized credit risk in informal trade clusters, bazaar mediation.
- **Presentation Target:** Both database and application run on the same local machine during the course demonstration.
- **Dual-Mode Operating Capability:** The project runs in **Full-Stack Mode** (Java 17 + Tomcat + MySQL on localhost) with a **Zero-Configuration Fallback** (Vite + React + LocalStorage fallback) to ensure accessibility on preview links (such as Vercel: https://trade-trust.vercel.app).

---

## 2. PROJECT GENESIS, BUSINESS PROBLEM & DOMAIN LOGIC

### The Problem in Mumbai Wholesale Bazaars
- In traditional physical trade clusters across Mumbai (Zaveri Bazaar, Dadar Market, Mangaldas Market, Lamington Road, Crawford Market), wholesalers deliver consignments to retailers on informal credit (*chitti* / verbal agreement), expecting settlement in 15-30 days.
- **The Gap:** India's formal credit rating agencies (CIBIL, Experian, CRIF) exclusively track formal bank loans, credit cards, and NBFC lines. They have zero visibility into multi-crore daily bazaar trade credit.
- **The Pain:** When an unscrupulous merchant defaults or stalls payment indefinitely, that financial loss remains isolated to the victim. The defaulter easily moves two lanes over and takes fresh credit from another unsuspecting merchant.

### The Solution: TradeTrust
- TradeTrust functions as a specialized reputation and informal credit record-keeping network tailored to Indian bazaar merchants:
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
| **Frontend** | React 18, Vite 5, React Router v6 | Pure functional components, hooks only (`useState`, `useEffect`, `useContext`, `useRef`). No class components. No server-side templates. |
| **Styling** | Vanilla CSS + CSS Custom Properties | No external CSS frameworks (No Tailwind, No Bootstrap, No Material UI). Fully responsive down to 375px mobile screens. Dynamic runtime token injection. |
| **Backend** | Java 17, Spring Boot 3 (wrapper) | **Explicit Servlet classes** extending `HttpServlet`. Mandatory `doGet()`, `doPost()`, `init()`, and `destroy()` lifecycle implementations. |
| **Database Access** | Raw JDBC (`java.sql.*`) | **Zero ORM / Zero JPA / Zero Hibernate / Zero Spring Data**. Every SQL statement is handwritten with `PreparedStatement`. |
| **Database** | MySQL 8.x | Default port **3306**. Database: `tradetrust_db`. |
| **Server / Proxy** | Embedded Tomcat (Port 8080) | Vite dev server on port 3000 proxies `/api` and `/uploads` to `http://localhost:8080`. |
| **Build Tools** | Maven (`pom.xml`) + npm (`package.json`) | Standalone buildable via `mvn clean compile` and `npm run build`. |

---

## 4. OFFICIAL ACCOUNTS & PURGED DUMMY DATA

All dummy accounts, dummy trader cards, and dummy complaints have been deleted from the database seed script, backend authentication, and frontend mock data.

The system strictly contains **four official trader accounts** plus the **main admin account**:

| Trader Card / Business Name | Contact Phone | Password | Initial Score | Cluster | Role |
|---|---|---|---|---|---|
| **Rajpurohit Bangles** | `9820011111` | `tradetrust` | 10.00 | Zaveri Bazaar | Wholesaler |
| **Sharma Electronics** | `9820022222` | `tradetrust` | 10.00 | Lamington Road | Retailer |
| **Seliya Stationary** | `9820033333` | `tradetrust` | 10.00 | Crawford Market | Wholesaler |
| **Sankhe Jwells** | `9820044444` | `tradetrust` | 10.00 | Zaveri Bazaar | Retailer |
| **Market Association Admin** | Username: `Admin` | `tradetrust` | 10.00 | South Mumbai | Platform Admin |

- **Clean Inputs:** All login, registration, and admin lock screen forms start completely empty with clean placeholders. No credentials or demo shortcuts are prefilled into input fields.
- **Universal Admin:** Accessible at `/admin` using username `Admin` and password `tradetrust`.

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
             |  - AuthServlet        - ComplaintServlet|   | - tradetrust_registered_traders       |
             |  - TraderServlet      - LedgerServlet |   | - tradetrust_complaints               |
             |  - AdminServlet       - UploadServlet |   | - tradetrust_ledger                   |
             |  - ConnectionServlet  - ScoreServlet  |   | - tradetrust_notifications            |
             |  - PingServlet        - BrowseServlet |   | - tradetrust_current_user             |
             +---------------------------------------+   +---------------------------------------+
                                 |
                                 v
             +---------------------------------------+
             |            Raw JDBC Layer             |
             |  PreparedStatement + DBConnection     |
             +---------------------------------------+
                                 |
                                 v
             +---------------------------------------+
             |       MySQL Database (Port 3306)      |
             |             tradetrust_db             |
             +---------------------------------------+
```

### Persistence Guarantee
- **New Registrations:** When a user registers via the Sign Up form, the account is permanently persisted in the MySQL `traders` table (or local storage fallback), survives restarts, and allows repeated logins with the user's phone and password.
- **Session Continuity:** Authenticated sessions are safely stored under `tradetrust_current_user` and validated against existing registered or official accounts on startup.

---

## 6. DATABASE SCHEMA & JDBC LAYER

The relational database is configured in `backend/src/main/resources/schema.sql` on MySQL 8 (`tradetrust_db` on port 3306):

1. **`traders` Table:** `trader_id` (PK, AUTO_INCREMENT), `name`, `phone` (UNIQUE), `business_name`, `business_desc`, `role` (ENUM: WHOLESALER, RETAILER), `cluster`, `sector`, `photo_path`, `password_hash`, `trust_score` (DECIMAL 4,2 DEFAULT 10.00), `score_frozen` (BOOLEAN), `is_verified_badge` (BOOLEAN), `created_at`.
2. **`complaints` Table:** `complaint_id` (PK), `reporter_id` (FK -> traders), `reported_id` (FK -> traders), `description`, `amount_disputed` (DECIMAL 12,2), `incident_date`, `proof_path`, `status` (ENUM: ROUND_1_PENDING, ROUND_1_COUNTER_FILED, ROUND_2_PENDING, ROUND_2_COUNTER_FILED, ESCALATED_TO_ADMIN, APPROVED, REJECTED, RETAKE_REQUESTED, RETAKE_APPROVED), timestamps.
3. **`complaint_rounds` Table:** Multi-stage arbitration evidence exchange.
4. **`ledger_entries` Table:** Private double-entry credit ledger (`owner_id`, `party_name`, `amount`, `entry_type`, `status`).
5. **`connections` Table:** Mutual bazaar trade relationships.
6. **`notifications` Table:** Commercial dispute notices, connection requests, and arbitration verdicts.
7. **`admins` Table:** Universal administrator credentials.
8. **`trader_settings` Table:** Accent color and interface preferences.

### Standard JDBC Execution Pipeline
In compliance with the syllabus, every database operation follows the 7-step JDBC workflow:
1. Load JDBC driver: `Class.forName("com.mysql.cj.jdbc.Driver");`
2. Establish connection: `DriverManager.getConnection(url, user, password);`
3. Prepare SQL statement: `PreparedStatement ps = conn.prepareStatement(sql);`
4. Bind parameters: `ps.setString(1, ...);`, `ps.setInt(2, ...);`
5. Execute query: `ResultSet rs = ps.executeQuery();` or `ps.executeUpdate();`
6. Process result set: Map rows to model beans (`Trader`, `Complaint`, `LedgerEntry`)
7. Close resources: Managed automatically via Java try-with-resources blocks.

---

## 7. ADMIN FEATURES: SCORE CONTROL, COMPLAINT VISIBILITY & RETAKE FLOW

### 7.1 Score Control
- **Backend Endpoint:** `POST /api/admin/trader/{id}/score` handled in `AdminServlet.java`.
- **DAO Implementation:** `TraderDAO.updateScore(int traderId, BigDecimal newScore)` persists custom scores clamped between 0.00 and 10.00.
- **Admin UI:** Accessible in `/admin` under the **Merchants** tab via the **Edit Score** button on any trader row.

### 7.2 Complaint Visibility
In `/admin` under the **Disputes** queue, every arbitration case card clearly shows:
1. **Who filed the complaint:** Filer business name / full name.
2. **Filer User ID:** Explicit user ID (`User ID: X`).
3. **Reported Trader Card:** Reported merchant business name, cluster tag, and active trust score badge.
4. **Dispute Details:** Disputed amount in INR, incident date, grievance description, and attached evidence link.

### 7.3 Complaint Retake Flow
```
[User Files Dispute]
          |
          v
[Complainant opens Dashboard -> Disputes Tab]
          |
          | Complainant clicks "Retake Complaint"
          v
[Status Flags to RETAKE_REQUESTED]
          |
          v
[Admin Arbitration Queue Alert Banner]
  - Displays: "[Retake Flagged]: The filing user (User ID: X) has requested to retake/withdraw this complaint."
  - Action buttons: "Approve Retake" vs "Reject Retake"
          |
          +-----------------------------------------+
          |                                         |
          v                                         v
[Admin Approves Retake]                    [Admin Rejects Retake]
  - Status -> RETAKE_APPROVED                - Status -> ESCALATED_TO_ADMIN
  - Score Handling:                          - Complaint remains active in dispute queue
    * If complaint was previously APPROVED:  - Penalties remain in place
      The 1.50 point deduction is restored.
    * Score is unfrozen.
    * Claim is officially withdrawn.
```

---

## 8. FILE UPLOAD PIPELINE (PDFS AND IMAGES)

### Localhost File Uploads
- **Frontend Utility:** `src/utils/fileUpload.js` accepts file objects and dispatches a multipart `FormData` POST request to `/api/upload`.
- **Backend Handler:** `UploadServlet.java` running on embedded Tomcat with `@MultipartConfig`:
  - Validates file presence and extensions (`.pdf`, `.png`, `.jpg`, `.jpeg`).
  - Generates secure UUID filenames to prevent collisions and directory traversal.
  - Stores uploaded files directly in the local `uploads/` directory.
  - Serves files at `/uploads/{filename}` with proper MIME headers (`application/pdf`, `image/png`, `image/jpeg`) and inline content-disposition, allowing PDFs to open directly in the browser during demo presentations.
- **Client Fallback:** In static environments without a running Tomcat server, `fileUpload.js` converts uploaded files to Data URLs, preserving full upload and preview functionality in the browser.

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
- `0.00 - 4.99`: Red (Critical Default / High Risk)
- `5.00 - 7.49`: Amber / Yellow (Average Standing / Pending Disputes)
- `7.50 - 8.49`: Lime / Light Green (Good Standing)
- `8.50 - 10.00`: Emerald Green (Prime Merchant / Clean Ledger)

---

## 10. FRONTEND STRUCTURE, ROUTING & COMPONENT HIERARCHY

```
src/
├── App.jsx                     (Router root, ToastProvider, ThemeProvider, AuthProvider)
├── main.jsx                    (Standard React 18 createRoot render)
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
│   │   ├── CourseworkPortfolio.jsx (Academic coursework PDF evaluation docket)
│   │   ├── FloatingHelp.jsx    (Feature guide popup widget)
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
│   ├── LoginPage.jsx           (Clean sign in & business registration)
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

- **Zero Emojis Policy:** All emojis have been eliminated from source code, string literals, comments, console logs, and user-facing outputs across both frontend and backend. Standard SVG icons (from `Icons.jsx`) or clean text labels are used throughout.
- **Dark Obsidian Theme (`:root, [data-theme="dark"]`):** High contrast bazaar trading palette with deep navy cards.
- **Light Slate Theme (`[data-theme="light"]`):** Crisp 2-tone canvas with Slate-300 borders and Slate-900 typography.

---

## 12. STATE MANAGEMENT, CROSS-TAB SYNCHRONIZATION & STORAGE INTEGRITY

1. **Custom Event (`tradetrust_score_updated`):** Dispatched whenever an admin resolves a complaint, toggles a freeze, or edits a score.
2. **Storage Event (`storage`):** Synchronizes updates across tabs.
3. **Window Focus Event (`focus`):** Re-fetches current scores when returning to the registry or profile.
4. **Storage Integrity at the Source:**
   - Obsolete legacy keys (`tradetrust_traders`, `tradetrust_disputes`, `tradetrust_past_records`, `tradetrust_auth_user`, `tradetrust_admin_unlocked`) are automatically cleared at startup.
   - `getStoredComplaints()` ensures that complaints in local storage only reference valid traders (the four seed accounts or genuine new user registrations), preventing stale dummy records from lingering in the UI.

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

### Official Verification Credentials
- **Universal Admin:** Username `Admin`, Password `tradetrust` (at `/admin`)
- **Trader 1:** `Rajpurohit Bangles` (Phone: `9820011111`, Password: `tradetrust`)
- **Trader 2:** `Sharma Electronics` (Phone: `9820022222`, Password: `tradetrust`)
- **Trader 3:** `Seliya Stationary` (Phone: `9820033333`, Password: `tradetrust`)
- **Trader 4:** `Sankhe Jwells` (Phone: `9820044444`, Password: `tradetrust`)

---

## 14. VIVA & ACADEMIC PRESENTATION KEY CONCEPTS

Be ready to explain the following during the presentation:
1. **Multi-Tier Architecture:** How the React frontend communicates with Tomcat Servlets over HTTP REST endpoints, and how Servlets interact with MySQL via JDBC.
2. **Tomcat Servlet Lifecycle:** `init()` (called once during initialization), `doGet()` and `doPost()` (called per request by the servlet container), and `destroy()` (called when the servlet is unloaded).
3. **7-Step JDBC Pipeline:** Explicit loading of MySQL driver, creating database connections, using `PreparedStatement` with parameterized placeholders (`?`) to prevent SQL injection, executing queries, iterating through `ResultSet`, and closing resources.
4. **Zero ORM Rationale:** Why raw JDBC was chosen over JPA/Hibernate (exact alignment with semester syllabus, transparent SQL execution, predictable performance).
5. **Dynamic Trust Score Algorithm:** Baseline 10.00 score, deduction of 1.50 for approved complaints, ledger settlement adjustments (+0.10 for paid, -0.50 for overdue), and mutual connection bonuses (+0.05).
6. **Retake Complaint Workflow:** Why complaints can be retaken/withdrawn by the filing merchant, why administrative approval is required before the retake takes effect, and how trust scores are restored when retakes are approved.
7. **Multipart Upload Pipeline:** How `UploadServlet` processes `multipart/form-data`, validates files, generates secure filenames on disk, and serves them inline for in-browser PDF viewing.

---

## 15. DETAILED CLEANUP CHANGELOG

1. **Removed Login Prefills & Demo Shortcuts:**
   - Modified `LoginPage.jsx` to start phone and password state as empty strings (`''`).
   - Removed the 4 "Quick Demo Accounts" auto-login buttons from the sign-in screen.
   - Cleaned password placeholders from `placeholder="Account password (tradetrust)"` to `placeholder="Password"`.
   - Modified `AdminLoginModal.jsx` and `AdminPage.jsx` gate screen to start with empty inputs, removing hardcoded prefilled credentials and reset buttons.
   - Removed quick demo auto-login buttons from `DashboardPage.jsx` and `NotificationsPage.jsx`, leaving standard navigation to `/login` and `/register`.

2. **Fixed Source Code Instead of Layered Workarounds:**
   - Removed temporary `RESET_KEY` cache-clearing logic from `main.jsx`, restoring standard React root mounting.
   - Fixed data integrity directly at the source in `traders.js` and `complaints.js` by filtering out non-existent trader references and legacy storage keys.

3. **Removed Dead Code and Unused Files:**
   - Deleted redundant root image asset `logo.png.png`.
   - Deleted unused component files `src/components/common/BlankDropbox.jsx` and `BlankDropbox.css`.

4. **Preserved Coursework Portfolio:**
   - Retained `CourseworkPortfolio.jsx` and `CourseworkPortfolio.css` mounted at the bottom of `BrowsePage.jsx` for coursework assignment and experiment PDF verification.

5. **Build Verification:**
   - Frontend compiled successfully with `vite build` into `dist/` with zero errors.
   - Backend compiled successfully with `mvn clean compile` across all 34 Java source files.

6. **Systematic Theme and Layout Button Fixes (Collective Pass):**
   - **Root Cause Resolution for Disappearing Buttons:** Defined the missing `--accent-blue: #1E6FFB;` CSS token in `src/styles/variables.css` across both Dark Obsidian (`:root, [data-theme="dark"]`) and Light Slate (`[data-theme="light"]`) modes, ensuring all buttons, tags, and icons resolve solid background and text colors instead of falling back to transparent.
   - **Dynamic Token Synchronization:** Updated `applyColorToRoot()` in `src/context/ThemeContext.jsx` to synchronize `--accent-blue` dynamically alongside `--accent-color`.
   - **High-Contrast Text on Accent Buttons:** Updated `.modal-btn-primary`, `.connect-btn.not-connected`, `.login-submit-btn`, `.browse-search-btn`, `.ledger-add-btn`, `.navbar-register-btn`, and `.sidebar-register-btn` to use explicit high-contrast white text (`color: #ffffff;`) instead of inherited dark `--text-primary` on blue backgrounds in Light Slate mode.
   - **Sidebar Footer Layout & Overlap Fix:** Refactored `.sidebar-footer` in `Sidebar.css` from a single crowded horizontal row into a clean vertical column layout (`flex-direction: column; width: 100%; gap: var(--space-sm);`). Auth buttons now occupy a full-width grid (`.sidebar-auth-grid`, 50/50 split), and "Terms • Contact" sits cleanly underneath in `.sidebar-links-row`, eliminating button squishing, vertical text wrapping, and visual collision.
   - **Clean Semantic CSS Classes:** Replaced fragile inline button styles in `Navbar.jsx`, `Sidebar.jsx`, `BrowsePage.jsx`, `DashboardPage.jsx`, `NotificationsPage.jsx`, and `AdminPage.jsx` with dedicated classes (`.navbar-login-btn`, `.navbar-register-btn`, `.sidebar-login-btn`, `.sidebar-register-btn`).
   - **Modal Layout Polish:** Added consistent `24px` padding to the score adjustment modal card in `AdminPage.jsx` for clean visual spacing.

7. **Dynamic Notification System & Full Cross-Tab Reactivity:**
   - **Notification Bug Root Cause Resolution:** Fixed `markAllNotificationsRead` and `markNotificationRead` in `src/api/notifications.js` which previously returned an empty array `data: []` without persisting `isRead = true` to `localStorage`. The function now marks items read directly in persistent storage, preserves the notification list in the UI, and calculates `unreadCount = 0`.
   - **Instant Real-Time Broadcasting:** Implemented `tradetrust_notifications_updated` custom event and wired it to `AppLayout`, `NotificationsPage`, `Navbar`, and `Sidebar`, eliminating the 5-second polling lag so badges update to 0 with zero delay.
   - **Dynamic Filtering & Actions:** Added "Clear all" action and "All / Unread" filter toggle in `NotificationsPage.jsx`, with optimistic UI state updates for immediate user feedback.
   - **Cross-Component Events:** Integrated automatic notification creation and dispatched `tradetrust_complaints_updated` when disputes are filed, retakes are requested, or association arbitration verdicts are rendered.
   - **Official Deployment Link:** Documented official preview deployment URL as `https://trade-trust.vercel.app`.

