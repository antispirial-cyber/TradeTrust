// TradeTrust Official Seed Data
// Exactly four official trader accounts, initial score 10.00, password 'tradetrust'

export const INITIAL_TRADERS = [
  {
    id: 1,
    traderId: 1,
    name: "Rajpurohit Bangles",
    phone: "9820011111",
    password: "tradetrust",
    businessName: "Rajpurohit Bangles",
    businessDesc: "Wholesale manufacturer and distributor of traditional bangles, bridal chudas, and ethnic ornaments.",
    role: "WHOLESALER",
    cluster: "Zaveri Bazaar",
    sector: "Ornaments & Jewellery",
    photoUrl: null,
    initial: "R",
    trustScore: 10.0,
    isScoreFrozen: false,
    scoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2024-01-10"
  },
  {
    id: 2,
    traderId: 2,
    name: "Sharma Electronics",
    phone: "9820022222",
    password: "tradetrust",
    businessName: "Sharma Electronics",
    businessDesc: "Retailer and distributor of commercial electronics, test meters, and hardware components.",
    role: "RETAILER",
    cluster: "Lamington Road",
    sector: "Electronics",
    photoUrl: null,
    initial: "S",
    trustScore: 10.0,
    isScoreFrozen: false,
    scoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2024-02-15"
  },
  {
    id: 3,
    traderId: 3,
    name: "Seliya Stationary",
    phone: "9820033333",
    password: "tradetrust",
    businessName: "Seliya Stationary",
    businessDesc: "Bulk paper supplier, commercial printing stationery, and office ledger materials.",
    role: "WHOLESALER",
    cluster: "Crawford Market",
    sector: "Stationery",
    photoUrl: null,
    initial: "S",
    trustScore: 10.0,
    isScoreFrozen: false,
    scoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2024-03-20"
  },
  {
    id: 4,
    traderId: 4,
    name: "Sankhe Jwells",
    phone: "9820044444",
    password: "tradetrust",
    businessName: "Sankhe Jwells",
    businessDesc: "Showroom specializing in hallmarked gold jewellery, silver ornaments, and custom designs.",
    role: "RETAILER",
    cluster: "Zaveri Bazaar",
    sector: "Gold & Silver Jewellery",
    photoUrl: null,
    initial: "S",
    trustScore: 10.0,
    isScoreFrozen: false,
    scoreFrozen: false,
    isVerifiedBadge: true,
    mutualConnections: 0,
    connectionStatus: "not_connected",
    createdAt: "2024-04-05"
  }
];

export const INITIAL_LEDGER_ENTRIES = [];

export const INITIAL_PAST_RECORDS = [];

export const INITIAL_NOTIFICATIONS = [];
