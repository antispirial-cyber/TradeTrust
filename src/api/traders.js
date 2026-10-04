import { apiClient } from './client';
import { INITIAL_TRADERS } from './mockData';

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
  const phoneSet = new Set(stored.map(t => t.phone));
  const combined = [...stored, ...INITIAL_TRADERS.filter(t => !phoneSet.has(t.phone))];

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
  results.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
  return {
    success: true,
    data: results
  };
}

export async function getTraderById(id) {
  const res = await apiClient(`/api/traders/${id}`);
  if (res.success && res.data) {
    const trader = {
      ...res.data,
      id: res.data.id || res.data.traderId,
      initial: res.data.name ? res.data.name[0] : (res.data.businessName ? res.data.businessName[0] : 'T')
    };
    return {
      success: true,
      data: trader
    };
  }

  // Fallback to mock / stored custom traders
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
  } catch {}
  const allTraders = [...stored, ...INITIAL_TRADERS];
  const fallback = allTraders.find(t => String(t.id || t.traderId) === String(id));
  if (fallback) {
    return { success: true, data: fallback };
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
