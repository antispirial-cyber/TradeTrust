// TradeTrust Mock Seed Data

export const INITIAL_TRADERS = [
  {
    id: 1,
    name: "Rajesh Mehta",
    phone: "9820012345",
    businessName: "Mehta Jewellers Retail",
    businessDesc: "Retail showroom in Zaveri Bazaar specializing in bridal jewellery, temple collections, and certified diamonds catering to legacy clients across Western India.",
    role: "RETAILER",
    cluster: "Zaveri Bazaar",
    sector: "Ornaments & Jewellery",
    photoUrl: null, // Displays letter avatar "M"
    initial: "M",
    trustScore: 10.0,
    isScoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 1,
    connectionStatus: "connected", // "not_connected" | "pending" | "connected"
    accentColor: "#1E6FFB",
    createdAt: "2023-01-15"
  },
  {
    id: 2,
    name: "Bhavin Shah",
    phone: "9820054321",
    businessName: "Blah blah blah",
    businessDesc: "No business description provided.",
    role: "RETAILER",
    cluster: "Zaveri Bazaar",
    sector: "Ornaments & Jewellery",
    photoUrl: null,
    initial: "B",
    trustScore: 10.0,
    isScoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2023-04-10"
  },
  {
    id: 3,
    name: "Naveen Chordia",
    phone: "9820198765",
    businessName: "Navkar Diamond & Gems",
    businessDesc: "Wholesale supplier of loose certified solitaires, polki, and uncut diamonds catering to high-end jewellery houses across Maharashtra and Gujarat.",
    role: "WHOLESALER",
    cluster: "Zaveri Bazaar",
    sector: "Ornaments & Jewellery",
    photoUrl: null,
    initial: "N",
    trustScore: 10.0,
    isScoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 1,
    connectionStatus: "connected",
    createdAt: "2022-11-20"
  },
  {
    id: 4,
    name: "Zubin Zaveri",
    phone: "9820234567",
    businessName: "Zaveri Gold House",
    businessDesc: "Renowned retailer of 22K, 18K and silver jewellery with custom design services, hallmark certification and quick turnaround time.",
    role: "RETAILER",
    cluster: "Zaveri Bazaar",
    sector: "Gold & Silver Jewellery",
    photoUrl: null,
    initial: "Z",
    trustScore: 10.0,
    isScoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 1,
    connectionStatus: "connected",
    createdAt: "2023-02-01"
  },
  {
    id: 5,
    name: "Sonal Parekh",
    phone: "9820345678",
    businessName: "Sonal Gems & Crafts",
    businessDesc: "Supplier of certified gemstones, beads and jewellery raw materials for global markets with precision sorting and verified origin papers.",
    role: "WHOLESALER",
    cluster: "Zaveri Bazaar",
    sector: "Precious Stones",
    photoUrl: null,
    initial: "S",
    trustScore: 9.8,
    isScoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 1,
    connectionStatus: "connected",
    createdAt: "2023-03-14"
  },
  {
    id: 6,
    name: "Dharmesh Vora",
    phone: "9820456789",
    businessName: "Dadar Fabrics Emporium",
    businessDesc: "Wholesale textiles, cotton weaves, and ethnic dress materials distributing in bulk to suburban retailers across Greater Mumbai.",
    role: "WHOLESALER",
    cluster: "Dadar Market",
    sector: "Fabrics",
    photoUrl: null,
    initial: "D",
    trustScore: 8.5,
    isScoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 2,
    connectionStatus: "not_connected",
    createdAt: "2023-05-18"
  },
  {
    id: 7,
    name: "Mohanlal Silk Traders",
    phone: "9820567890",
    businessName: "Mangaldas Silk House",
    businessDesc: "Bulk distributors of pure Banarasi, Kanjeevaram and raw silk fabrics. Trusted partner for festival demand and trousseau procurement.",
    role: "WHOLESALER",
    cluster: "Mangaldas Market",
    sector: "Fabrics",
    photoUrl: null,
    initial: "M",
    trustScore: 7.2,
    isScoreFrozen: false,
    isVerifiedBadge: false,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2023-08-22"
  },
  {
    id: 8,
    name: "Lalit Electronics",
    phone: "9820678901",
    businessName: "Lamington Component Hub",
    businessDesc: "Commercial microchips, power supplies, and test equipment retailer serving DIY tech specialists and electronics assemblers.",
    role: "RETAILER",
    cluster: "Lamington Road",
    sector: "Electronics",
    photoUrl: null,
    initial: "L",
    trustScore: 4.8,
    isScoreFrozen: false,
    isVerifiedBadge: false,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2023-09-05"
  },
  {
    id: 9,
    name: "Chetan Stationery Co.",
    phone: "9820789012",
    businessName: "Crawford Stationery Depot",
    businessDesc: "Bulk paper distributor, packaging supplier, and corporate stationery importer with high volume trade lanes across South Bombay.",
    role: "WHOLESALER",
    cluster: "Crawford Market",
    sector: "Stationery",
    photoUrl: null,
    initial: "C",
    trustScore: 2.1,
    isScoreFrozen: false,
    isVerifiedBadge: false,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2023-10-12"
  }
];

export const INITIAL_LEDGER_ENTRIES = [
  {
    id: "leg-1",
    partyName: "Navkar Diamond & Gems",
    amount: 145000,
    entryType: "CREDIT_GIVEN", // CREDIT_GIVEN or CREDIT_RECEIVED
    entryDate: "2026-09-18",
    description: "Lot 44 Solitaire diamond parcel on 30-day informal settlement.",
    status: "PENDING" // PENDING, PAID, OVERDUE
  },
  {
    id: "leg-2",
    partyName: "Sonal Gems & Crafts",
    amount: 68000,
    entryType: "CREDIT_GIVEN",
    entryDate: "2026-09-10",
    description: "Emerald beads consignment batch #89",
    status: "PENDING"
  },
  {
    id: "leg-3",
    partyName: "Zaveri Gold House",
    amount: 220000,
    entryType: "CREDIT_RECEIVED",
    entryDate: "2026-09-02",
    description: "Raw gold bullion bars (100g x 2) for custom bridal sets.",
    status: "PENDING"
  },
  {
    id: "leg-4",
    partyName: "Bombay Bullion Traders",
    amount: 95000,
    entryType: "CREDIT_RECEIVED",
    entryDate: "2026-08-15",
    description: "Silver filigree work casting advance.",
    status: "PAID"
  },
  {
    id: "leg-5",
    partyName: "Crawford Stationery Depot",
    amount: 32000,
    entryType: "CREDIT_GIVEN",
    entryDate: "2026-07-20",
    description: "Custom velvet packaging boxes and security bags.",
    status: "OVERDUE"
  }
];

export const INITIAL_PAST_RECORDS = [
  {
    id: "rec-1",
    traderId: 9, // Crawford Stationery Depot
    reporterName: "Mehta Jewellers Retail",
    amountDisputed: 54000,
    incidentDate: "2024-04-12",
    status: "APPROVED",
    description: "Failure to deliver packaging materials after full advance given. Counter claim was dismissed by market association admin review.",
    verdictDate: "2024-05-02"
  },
  {
    id: "rec-2",
    traderId: 8, // Lamington Component Hub
    reporterName: "Navkar Diamond & Gems",
    amountDisputed: 28000,
    incidentDate: "2024-02-18",
    status: "APPROVED",
    description: "Supplied counterfeit diamond scale equipment with no refund or replacement offered.",
    verdictDate: "2024-03-05"
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "admin_verdict",
    message: "Admin approved resolution on disputed invoice with Crawford Stationery Depot. Disputed amount deducted from record.",
    linkRef: "/profile/9",
    isRead: false,
    timestamp: "10m ago"
  },
  {
    id: "notif-2",
    type: "connection_request",
    message: "Dadar Fabrics Emporium sent you a connection request.",
    linkRef: "/profile/6",
    isRead: false,
    timestamp: "2h ago"
  },
  {
    id: "notif-3",
    type: "score_updated",
    message: "Your trust score was updated to 10.00 following periodic cluster evaluation.",
    linkRef: "/dashboard",
    isRead: false,
    timestamp: "1d ago"
  },
  {
    id: "notif-4",
    type: "connection_accepted",
    message: "Sonal Gems & Crafts accepted your connection request.",
    linkRef: "/profile/5",
    isRead: true,
    timestamp: "2d ago"
  },
  {
    id: "notif-5",
    type: "platform_broadcast",
    message: "Notice: Zaveri Bazaar market committee meeting scheduled for this Thursday 4:00 PM.",
    linkRef: "/browse",
    isRead: true,
    timestamp: "3d ago"
  }
];
