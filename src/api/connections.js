import { getTraderById, updateTrader } from './traders';

export async function toggleConnectTrader(traderId) {
  const result = await getTraderById(traderId);
  if (!result.success) return result;

  const currentStatus = result.data.connectionStatus;
  let nextStatus = 'connected';
  if (currentStatus === 'not_connected') {
    nextStatus = 'connected'; // In demo, immediate connect or pending -> connected
  } else if (currentStatus === 'connected') {
    nextStatus = 'not_connected';
  } else {
    nextStatus = 'connected';
  }

  const updated = await updateTrader(traderId, {
    connectionStatus: nextStatus
  });

  return updated;
}
