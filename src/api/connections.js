import { apiClient } from './client';
import { getTraderById, updateTrader } from './traders';
import { addNotification } from './notifications';

export async function toggleConnectTrader(traderId) {
  const result = await getTraderById(traderId);
  if (!result.success) return result;

  const currentStatus = result.data.connectionStatus;
  const isCurrentlyConnected = currentStatus === 'connected';

  if (isCurrentlyConnected) {
    const res = await apiClient('/api/connect/remove', {
      method: 'POST',
      body: { targetTraderId: Number(traderId) }
    });
    if (res.success) {
      return {
        success: true,
        data: {
          ...result.data,
          connectionStatus: 'not_connected'
        }
      };
    }
  } else {
    const res = await apiClient('/api/connect/request', {
      method: 'POST',
      body: { targetTraderId: Number(traderId) }
    });
    if (res.success) {
      addNotification({
        type: 'connection_accepted',
        message: `Connected with ${result.data.businessName || ('Trader #' + traderId)} on Bazaar Connect.`,
        linkRef: '/browse'
      });
      return {
        success: true,
        data: {
          ...result.data,
          connectionStatus: 'connected'
        }
      };
    }
  }

  // Local fallback
  const nextStatus = isCurrentlyConnected ? 'not_connected' : 'connected';
  if (nextStatus === 'connected') {
    addNotification({
      type: 'connection_accepted',
      message: `Connected with ${result.data.businessName || ('Trader #' + traderId)} on Bazaar Connect.`,
      linkRef: '/browse'
    });
  }
  return updateTrader(traderId, { connectionStatus: nextStatus });
}
