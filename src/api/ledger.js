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

  // Fallback to local storage if offline or on static Vercel
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

  // Seamless fallback to local storage
  const stored = localStorage.getItem('tradetrust_ledger');
  const list = stored ? JSON.parse(stored) : [...INITIAL_LEDGER_ENTRIES];
  const newEntry = {
    id: `leg-${Date.now()}`,
    entryId: Date.now(),
    partyName: entry.partyName || 'Unnamed Party',
    amount: Number(entry.amount) || 0,
    entryType: entry.entryType || 'CREDIT_GIVEN',
    entryDate: entry.entryDate || new Date().toISOString().split('T')[0],
    description: entry.description || '',
    status: entry.status || 'PENDING'
  };
  list.unshift(newEntry);
  localStorage.setItem('tradetrust_ledger', JSON.stringify(list));
  return {
    success: true,
    data: newEntry
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

  // Seamless fallback to local storage
  const stored = localStorage.getItem('tradetrust_ledger');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      const idx = list.findIndex(e => String(e.id) === String(id) || String(e.entryId) === String(id));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem('tradetrust_ledger', JSON.stringify(list));
      }
    } catch {}
  }
  return {
    success: true,
    data: updates
  };
}

export async function deleteLedgerEntry(id) {
  await apiClient(`/api/ledger/${id}`, {
    method: 'DELETE'
  });

  // Seamless fallback to local storage
  const stored = localStorage.getItem('tradetrust_ledger');
  if (stored) {
    try {
      const list = JSON.parse(stored).filter(e => String(e.id) !== String(id) && String(e.entryId) !== String(id));
      localStorage.setItem('tradetrust_ledger', JSON.stringify(list));
    } catch {}
  }
  return {
    success: true,
    data: { id }
  };
}
