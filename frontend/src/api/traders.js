import { apiClient } from './client';

function formatTrader(t) {
  if (!t) return null;
  const photo = t.photoPath || t.photoUrl || null;
  const initial = t.initial || (t.name ? t.name[0].toUpperCase() : (t.businessName ? t.businessName[0].toUpperCase() : 'T'));
  return {
    ...t,
    id: t.traderId || t.id,
    traderId: t.traderId || t.id,
    photoPath: photo,
    photoUrl: photo,
    initial
  };
}

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
    const list = res.data.map(formatTrader);
    return {
      success: true,
      data: list
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to load merchants',
    data: []
  };
}

export async function getTraderById(id) {
  const res = await apiClient(`/api/traders/${id}`);
  if (res.success && res.data) {
    return {
      success: true,
      data: formatTrader(res.data)
    };
  }

  return {
    success: false,
    message: res.message || 'Merchant profile not found',
    data: null
  };
}

export async function updateTrader(id, updates) {
  const res = await apiClient('/api/trader/profile', {
    method: 'POST',
    body: updates
  });

  if (res.success && res.data) {
    return {
      success: true,
      data: formatTrader(res.data)
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to update merchant profile'
  };
}

export async function getScoreBreakdown(id) {
  const url = id ? `/api/score/${id}` : '/api/score/me';
  return apiClient(url);
}

