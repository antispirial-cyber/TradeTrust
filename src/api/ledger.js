import { INITIAL_LEDGER_ENTRIES } from './mockData';

const LEDGER_KEY = 'tradetrust_ledger';

function getStoredLedger() {
  const stored = localStorage.getItem(LEDGER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(LEDGER_KEY, JSON.stringify(INITIAL_LEDGER_ENTRIES));
  return INITIAL_LEDGER_ENTRIES;
}

function saveLedger(entries) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
}

export async function getLedgerEntries() {
  const entries = getStoredLedger();
  return {
    success: true,
    data: [...entries]
  };
}

export async function addLedgerEntry(entry) {
  const entries = getStoredLedger();
  const newEntry = {
    id: `leg-${Date.now()}`,
    partyName: entry.partyName || 'Unnamed Party',
    amount: Number(entry.amount) || 0,
    entryType: entry.entryType || 'CREDIT_GIVEN',
    entryDate: entry.entryDate || new Date().toISOString().split('T')[0],
    description: entry.description || '',
    status: entry.status || 'PENDING'
  };

  entries.unshift(newEntry);
  saveLedger(entries);

  return {
    success: true,
    data: newEntry
  };
}

export async function updateLedgerEntry(id, updates) {
  const entries = getStoredLedger();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Ledger entry not found'
    };
  }

  const updated = {
    ...entries[index],
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : entries[index].amount
  };

  entries[index] = updated;
  saveLedger(entries);

  return {
    success: true,
    data: updated
  };
}

export async function deleteLedgerEntry(id) {
  const entries = getStoredLedger();
  const filtered = entries.filter(e => e.id !== id);
  saveLedger(filtered);
  return {
    success: true,
    data: { id }
  };
}
