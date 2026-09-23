import { INITIAL_TRADERS } from './mockData';

const STORAGE_KEY = 'tradetrust_traders';

function getStoredTraders() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRADERS));
  return INITIAL_TRADERS;
}

function saveTraders(traders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(traders));
}

export async function getTraders({ cluster, sector, role, search } = {}) {
  const traders = getStoredTraders();
  let results = [...traders];

  if (cluster && cluster !== 'All Clusters') {
    results = results.filter(t => t.cluster.toLowerCase() === cluster.toLowerCase());
  }

  if (sector && sector !== 'All Sectors') {
    results = results.filter(t => t.sector.toLowerCase() === sector.toLowerCase());
  }

  if (role && role !== 'All Roles') {
    results = results.filter(t => t.role.toLowerCase() === role.toLowerCase());
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    results = results.filter(t =>
      t.businessName.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.phone.includes(q)
    );
  }

  // Sort by trust score descending
  results.sort((a, b) => b.trustScore - a.trustScore);

  return {
    success: true,
    data: results
  };
}

export async function getTraderById(id) {
  const traders = getStoredTraders();
  const trader = traders.find(t => t.id === Number(id));
  if (!trader) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Trader not found'
    };
  }
  return {
    success: true,
    data: trader
  };
}

export async function updateTrader(id, updates) {
  const traders = getStoredTraders();
  const index = traders.findIndex(t => t.id === Number(id));
  if (index === -1) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Trader not found'
    };
  }

  const updatedTrader = { ...traders[index], ...updates };
  traders[index] = updatedTrader;
  saveTraders(traders);

  return {
    success: true,
    data: updatedTrader
  };
}
