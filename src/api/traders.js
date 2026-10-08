import { apiClient } from './client';
import { INITIAL_TRADERS } from './mockData';

// Purge legacy storage keys from previous test runs
if (typeof window !== 'undefined') {
  const LEGACY_KEYS = [
    'tradetrust_traders',
    'tradetrust_disputes',
    'tradetrust_past_records',
    'tradetrust_auth_user',
    'tradetrust_admin_unlocked',
    'tradetrust_release_clean_v1'
  ];
  LEGACY_KEYS.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
}

// Retrieves all registered traders created by users on this client
export function getRegisteredTraders() {
  try {
    const raw = localStorage.getItem('tradetrust_registered_traders');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const seedPhones = new Set(INITIAL_TRADERS.map(t => t.phone));
    return list.filter(t => t && t.phone && !seedPhones.has(t.phone));
  } catch {
    return [];
  }
}

// Retrieves any runtime overrides (score updates, freeze state, verification badges)
export function getTraderOverrides() {
  try {
    const raw = localStorage.getItem('tradetrust_trader_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Saves a runtime override for a trader (e.g. admin score adjustment, freeze toggle)
export function saveTraderOverride(traderId, fieldUpdates) {
  try {
    const overrides = getTraderOverrides();
    const idKey = String(traderId);
    overrides[idKey] = {
      ...(overrides[idKey] || {}),
      ...fieldUpdates
    };
    localStorage.setItem('tradetrust_trader_overrides', JSON.stringify(overrides));
  } catch {}
}

// Combines official seed traders from mockData with registered users and applies runtime overrides
export function getLocalTradersList() {
  const registered = getRegisteredTraders();
  const overrides = getTraderOverrides();

  // Master list: official mock accounts + genuine user registrations
  const all = [...INITIAL_TRADERS, ...registered];

  return all.map(t => {
    const id = t.id || t.traderId;
    const patch = overrides[String(id)] || overrides[Number(id)] || {};
    const finalScore = patch.trustScore != null
      ? Number(patch.trustScore)
      : (t.trustScore != null ? Number(t.trustScore) : 10.0);

    return {
      ...t,
      ...patch,
      id: id,
      traderId: id,
      trustScore: Number(finalScore.toFixed(2)),
      scoreFrozen: patch.scoreFrozen !== undefined ? patch.scoreFrozen : (t.scoreFrozen || false),
      isScoreFrozen: patch.scoreFrozen !== undefined ? patch.scoreFrozen : (t.isScoreFrozen || false),
      isVerifiedBadge: patch.isVerifiedBadge !== undefined ? patch.isVerifiedBadge : (t.isVerifiedBadge || false),
      initial: t.initial || (t.name ? t.name[0] : (t.businessName ? t.businessName[0] : 'T'))
    };
  });
}

export async function getTraders({ cluster, sector, role, search } = {}) {
  const params = new URLSearchParams();
  if (cluster && cluster !== 'All Clusters') params.append('cluster', cluster);
  if (sector && sector !== 'All Sectors') params.append('sector', sector);
  if (role && role !== 'All Roles') params.append('role', role);
  if (search && search.trim()) params.append('search', search.trim());

  const query = params.toString();
  const url = query ? `/api/traders?${query}` : '/api/traders';

  try {
    const res = await apiClient(url);
    if (res.success && Array.isArray(res.data)) {
      const list = res.data.map(t => ({
        ...t,
        id: t.id || t.traderId,
        initial: t.name ? t.name[0] : (t.businessName ? t.businessName[0] : 'T')
      }));
      return {
        success: true,
        data: list
      };
    }
  } catch {}

  // Fallback to local traders list (official mock data + registered traders + overrides)
  let results = getLocalTradersList();

  if (cluster && cluster !== 'All Clusters') {
    results = results.filter(t => t.cluster && t.cluster.toLowerCase() === cluster.toLowerCase());
  }
  if (sector && sector !== 'All Sectors') {
    results = results.filter(t => t.sector && t.sector.toLowerCase() === sector.toLowerCase());
  }
  if (role && role !== 'All Roles') {
    results = results.filter(t => t.role && t.role.toLowerCase() === role.toLowerCase());
  }
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    results = results.filter(t =>
      (t.businessName && t.businessName.toLowerCase().includes(q)) ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q))
    );
  }

  results.sort((a, b) => (Number(b.trustScore) || 0) - (Number(a.trustScore) || 0));
  return {
    success: true,
    data: results
  };
}

export async function getTraderById(id) {
  try {
    const res = await apiClient(`/api/traders/${id}`);
    if (res.success && res.data) {
      const trader = {
        ...res.data,
        id: res.data.id || res.data.traderId,
        trustScore: Number(Number(res.data.trustScore != null ? res.data.trustScore : 10).toFixed(2)),
        initial: res.data.name ? res.data.name[0] : (res.data.businessName ? res.data.businessName[0] : 'T')
      };
      return {
        success: true,
        data: trader
      };
    }
  } catch {}

  const all = getLocalTradersList();
  const found = all.find(t => String(t.id || t.traderId) === String(id));
  if (found) {
    return {
      success: true,
      data: found
    };
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: 'Trader not found'
  };
}

export async function updateTrader(id, updates) {
  try {
    const res = await apiClient('/api/trader/profile', {
      method: 'POST',
      body: updates
    });
    if (res.success && res.data) {
      return {
        success: true,
        data: res.data
      };
    }
  } catch {}

  // Local fallback: record the update in trader overrides
  saveTraderOverride(id, updates);
  const updatedTrader = (await getTraderById(id)).data || updates;
  return {
    success: true,
    data: updatedTrader
  };
}
