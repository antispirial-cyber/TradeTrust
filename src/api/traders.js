import { apiClient } from './client';
import { INITIAL_TRADERS } from './mockData';
import { normalizePhone } from './auth';
import { isLegacyDummy } from '../utils/sanitizeData';

export async function getTraders({ cluster, sector, role, search } = {}) {
  const params = new URLSearchParams();
  if (cluster && cluster !== 'All Clusters') params.append('cluster', cluster);
  if (sector && sector !== 'All Sectors') params.append('sector', sector);
  if (role && role !== 'All Roles') params.append('role', role);
  if (search && search.trim()) params.append('search', search.trim());

  const query = params.toString();
  const url = query ? `/api/traders?${query}` : '/api/traders';

  const res = await apiClient(url);
  if (res.success && Array.isArray(res.data)) {
    // Ensure id field is always set
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

  // Graceful fallback to mock data + stored registered traders if backend not reachable
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
  } catch {}
  stored = stored.filter(t => !isLegacyDummy(t));
  const storedIds = new Set(stored.map(t => String(t.id || t.traderId)).filter(Boolean));
  const phoneSet = new Set(stored.map(t => normalizePhone(t.phone)).filter(Boolean));
  const combined = [
    ...stored,
    ...INITIAL_TRADERS.filter(t => !storedIds.has(String(t.id || t.traderId)) && (!t.phone || !phoneSet.has(normalizePhone(t.phone))))
  ].map(t => ({
    ...t,
    id: t.id || t.traderId,
    trustScore: Number(Number(t.trustScore != null ? t.trustScore : 10).toFixed(2)),
    initial: t.initial || (t.name ? t.name[0] : (t.businessName ? t.businessName[0] : 'T'))
  }));

  let results = [...combined];
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

  // Fallback to mock / stored custom traders
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
  } catch {}
  stored = stored.filter(t => !isLegacyDummy(t));

  const fromStored = stored.find(t => String(t.id || t.traderId) === String(id));
  if (fromStored) {
    return {
      success: true,
      data: {
        ...fromStored,
        id: fromStored.id || fromStored.traderId,
        trustScore: Number(Number(fromStored.trustScore != null ? fromStored.trustScore : 10).toFixed(2)),
        initial: fromStored.initial || (fromStored.name ? fromStored.name[0] : (fromStored.businessName ? fromStored.businessName[0] : 'T'))
      }
    };
  }

  const fromInitial = INITIAL_TRADERS.find(t => String(t.id || t.traderId) === String(id));
  if (fromInitial) {
    return {
      success: true,
      data: {
        ...fromInitial,
        id: fromInitial.id || fromInitial.traderId,
        trustScore: Number(Number(fromInitial.trustScore != null ? fromInitial.trustScore : 10).toFixed(2)),
        initial: fromInitial.initial || (fromInitial.name ? fromInitial.name[0] : (fromInitial.businessName ? fromInitial.businessName[0] : 'T'))
      }
    };
  }

  return {
    success: false,
    error: 'NOT_FOUND',
    message: 'Trader not found'
  };
}

export async function updateTrader(id, updates) {
  const res = await apiClient('/api/trader/profile', {
    method: 'POST',
    body: updates
  });
  if (res.success) {
    return {
      success: true,
      data: res.data
    };
  }
  return {
    success: false,
    message: res.message || 'Failed to update trader'
  };
}
