import { apiClient } from './client';
import { INITIAL_LEDGER_ENTRIES } from './mockData';

export async function getLedgerEntries() {
  const res = await apiClient('/api/ledger');
  if (res.success && res.data) {
    const list = Array.isArray(res.data) ? res.data : (res.data.entries || []);
    return {
      success: true,
      data: list.map(e => ({
        ...e,
        id: e.id || e.entryId
      }))
    };
  }

  // Fallback to local storage if offline
  const stored = localStorage.getItem('tradetrust_ledger');
  if (stored) {
    try {
      return { success: true, data: JSON.parse(stored) };
    } catch {}
  }
  return {
    success: true,
    data: INITIAL_LEDGER_ENTRIES
  };
}

export async function addLedgerEntry(entry) {
  const res = await apiClient('/api/ledger', {
    method: 'POST',
    body: {
      partyName: entry.partyName || 'Unnamed Party',
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
        id: res.data.id || res.data.entryId
      }
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to add ledger entry'
  };
}

export async function updateLedgerEntry(id, updates) {
  const res = await apiClient(`/api/ledger/${id}/status`, {
    method: 'POST',
    body: {
      status: updates.status || 'PENDING'
    }
  });

  if (res.success) {
    return {
      success: true,
      data: updates
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to update ledger entry'
  };
}

export async function deleteLedgerEntry(id) {
  const res = await apiClient(`/api/ledger/${id}`, {
    method: 'DELETE'
  });

  if (res.success) {
    return {
      success: true,
      data: { id }
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to delete ledger entry'
  };
}
