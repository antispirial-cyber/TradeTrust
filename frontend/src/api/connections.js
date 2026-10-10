import { apiClient } from './client';

export async function toggleConnectTrader(traderId, currentStatus) {
  const isConnected = currentStatus === 'connected';

  if (isConnected) {
    const res = await apiClient('/api/connect/remove', {
      method: 'POST',
      body: { traderId: Number(traderId) }
    });
    if (res.success) {
      return {
        success: true,
        data: { connectionStatus: 'not_connected' },
        message: 'Connection removed'
      };
    }
    return res;
  } else {
    const res = await apiClient('/api/connect/request', {
      method: 'POST',
      body: { traderId: Number(traderId) }
    });
    if (res.success && res.data) {
      return {
        success: true,
        data: {
          connectionStatus: res.data.connectionStatus || 'pending_sent'
        },
        message: 'Connection request sent'
      };
    }
    return res;
  }
}

export async function acceptConnection(connectionId) {
  return apiClient('/api/connect/accept', {
    method: 'POST',
    body: { connectionId: Number(connectionId) }
  });
}

export async function declineConnection(connectionId) {
  return apiClient('/api/connect/decline', {
    method: 'POST',
    body: { connectionId: Number(connectionId) }
  });
}

export async function getAcceptedConnections() {
  const res = await apiClient('/api/connect/accepted');
  if (res.success && Array.isArray(res.data)) {
    return {
      success: true,
      data: res.data.map(t => ({
        ...t,
        id: t.traderId || t.id
      }))
    };
  }
  return {
    success: false,
    data: []
  };
}
