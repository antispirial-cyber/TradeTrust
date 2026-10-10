import { apiClient } from './client';

export async function getAdminMetrics() {
  const res = await apiClient('/api/admin/metrics');
  if (res.success && res.data) {
    return {
      success: true,
      data: res.data
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to fetch admin metrics',
    data: {
      totalTraders: 0,
      pendingComplaints: 0,
      frozenTraders: 0,
      averageTrustScore: '10.00',
      totalDisputedAmount: 0
    }
  };
}

export async function resolveDispute(complaintId, resolution) {
  const res = await apiClient(`/api/admin/complaints/${complaintId}/resolve`, {
    method: 'POST',
    body: { resolution }
  });

  return {
    success: res.success,
    message: res.message || (res.success ? `Dispute resolved as ${resolution}` : 'Failed to apply resolution'),
    data: res.data
  };
}

export async function toggleTraderFreeze(traderId, freezeState) {
  const res = await apiClient(`/api/admin/traders/${traderId}/freeze`, {
    method: 'POST',
    body: { freezeState }
  });

  return {
    success: res.success,
    message: res.message || (res.success ? `Merchant score ${freezeState ? 'FROZEN' : 'ACTIVE'}` : 'Failed to update freeze status'),
    data: res.data
  };
}

export async function toggleTraderVerified(traderId, isVerified) {
  const res = await apiClient(`/api/admin/traders/${traderId}/verify`, {
    method: 'POST',
    body: { isVerified }
  });

  return {
    success: res.success,
    message: res.message || (res.success ? `Verification badge ${isVerified ? 'granted' : 'revoked'}` : 'Failed to update badge'),
    data: res.data
  };
}

export async function setTraderCustomScore(traderId, newScore) {
  const score = Math.max(0, Math.min(10, parseFloat(newScore) || 0));
  const res = await apiClient(`/api/admin/traders/${traderId}/score`, {
    method: 'POST',
    body: { newScore: score }
  });

  return {
    success: res.success,
    message: res.message || `Trust score adjusted to ${score.toFixed(2)}`,
    data: res.data
  };
}

export async function broadcastNotice({ title, message, cluster = 'All Clusters' }) {
  const res = await apiClient('/api/admin/broadcast', {
    method: 'POST',
    body: { title, message, cluster }
  });

  return {
    success: res.success,
    message: res.message || 'Circular broadcasted to merchants'
  };
}
