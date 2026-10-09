# TradeTrust — Mumbai Bazaar B2B Trust & Reputation Platform

TradeTrust is a B2B trust and trade credit reputation platform designed for wholesale bazaar merchants in Mumbai (Zaveri Bazaar, Crawford Market, Lamington Road). It provides verified commercial identity, dynamic trust scores, dispute arbitration, retake complaint workflows, and private credit ledger management.

- **Official Repository:** https://github.com/antispirial-cyber/TradeTrust
- **Live Preview:** https://trade-trust.vercel.app
- **Target Demo Environment:** Localhost (MySQL 8 on port 3306 + Tomcat on port 8080 + React on port 3000)

---

## 1. Official Platform Accounts

The platform has zero dummy data and is pre-seeded with four official bazaar trader accounts plus the platform administrator:

| Trader Card / Business | Contact Phone | Password | Initial Score | Cluster | Role |
|---|---|---|---|---|---|
| **Rajpurohit Bangles** | `9820011111` | `tradetrust` | 10.00 | Zaveri Bazaar | Wholesaler |
| **Sharma Electronics** | `9820022222` | `tradetrust` | 10.00 | Lamington Road | Retailer |
| **Seliya Stationary** | `9820033333` | `tradetrust` | 10.00 | Crawford Market | Wholesaler |
| **Sankhe Jwells** | `9820044444` | `tradetrust` | 10.00 | Zaveri Bazaar | Retailer |
| **Market Association Admin** | Username: `Admin` | `tradetrust` | 10.00 | South Mumbai | Platform Admin |

---

## 2. Technology Stack & Course Syllabus

Built within the Mumbai University Semester 3 Full Stack Java Technologies syllabus:

- **Frontend:** React 18, Vite 5, React Router DOM v6
  - Pure functional components with standard React hooks (`useState`, `useEffect`, `useContext`, `useRef`).
  - Vanilla CSS with CSS Custom Properties (Theme tokens: Dark Obsidian & Light Slate).
  - No external UI component frameworks (No Bootstrap, No Tailwind, No Material UI).
- **Backend:** Java 17, Spring Boot 3 (Tomcat runtime wrapper)
  - Explicit Jakarta Servlet classes extending `HttpServlet`.
  - Servlet lifecycle methods: `init()`, `doGet()`, `doPost()`, `destroy()`.
- **Database Layer:** Raw JDBC (`java.sql.*`)
  - Explicit 7-step JDBC workflow with `PreparedStatement` to prevent SQL injection.
  - Zero ORM / Zero JPA / Zero Hibernate.
- **Database:** MySQL 8.x (`tradetrust_db` on port 3306).

---

## 3. Core Features & Business Logic

1. **Merchant Directory & Dynamic Trust Score:**
   - Search and filter bazaar traders across Mumbai trade clusters and sectors.
   - Dynamic trust score (0.00 to 10.00) calculated from verified trade records, prompt ledger settlements, and mutual bazaar connections.
2. **Dispute Arbitration & Retake Flow:**
   - Merchants can file complaints with invoice evidence (PDF/JPG).
   - Filing merchants can request a **Retake (withdrawal)** of their complaint.
   - Retakes are flagged to the Market Association Administrator and require admin approval before score penalties are restored and claims dismissed.
3. **Admin Score Control & Complaint Visibility:**
   - Full visibility into reporter name, reporter user ID, and the reported trader card.
   - Admin can freeze/unfreeze scores, toggle verification badges, and manually override trust scores.
4. **Private Credit Ledger:**
   - Confidential tracking of credit given and credit received for informal bazaar credit cycles.
5. **Dynamic Notification Center:**
   - Real-time alerts for market circulars, dispute filings, retake decisions, and connection updates with instant unread badge synchronization.

---

## 4. How to Run Locally

### Prerequisites
- Java JDK 17+
- Apache Maven 3.8+
- Node.js 18+ and npm
- MySQL Server 8.0+

### Step 1: Database Setup
```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

### Step 2: Start Backend (Port 8080)
```bash
cd backend
mvn spring-boot:run
```

### Step 3: Start Frontend (Port 3000)
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### Step 4: Production Build
```bash
# Frontend production build
npm run build

# Backend compilation test
cd backend
mvn clean compile
```
