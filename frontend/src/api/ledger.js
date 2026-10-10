import { apiClient } from './client';

export async function getLedgerEntries() {
  const res = await apiClient('/api/ledger');
  if (res.success && res.data) {
    const list = Array.isArray(res.data) ? res.data : (res.data.entries || []);
    return {
      success: true,
      data: list.map(e => ({
        ...e,
        id: e.entryId || e.id
      }))
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to load ledger',
    data: []
  };
}

export async function addLedgerEntry(entry) {
  const res = await apiClient('/api/ledger', {
    method: 'POST',
    body: {
      partyName: entry.partyName || 'Unnamed Counterparty',
      amount: Number(entry.amount) || 0,
      entryType: entry.entryType || 'CREDIT_GIVEN',
      entryDate: entry.entryDate || new Date().toISOString().split('T')[0],
      description: entry.description || '',
      status: entry.status || 'PENDING'
    }
  });

  if (res.success && res.data) {
    return {
      success: true,
      data: {
        ...res.data,
        id: res.data.entryId || res.data.id
      }
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to record ledger entry'
  };
}

export async function updateLedgerEntry(id, updates) {
  const res = await apiClient(`/api/ledger/${id}/status`, {
    method: 'POST',
    body: {
      status: updates.status || 'PENDING'
    }
  });

  return {
    success: res.success,
    data: updates
  };
}

export async function deleteLedgerEntry(id) {
  const res = await apiClient(`/api/ledger/${id}`, {
    method: 'DELETE'
  });

  return {
    success: res.success,
    data: { id }
  };
}
