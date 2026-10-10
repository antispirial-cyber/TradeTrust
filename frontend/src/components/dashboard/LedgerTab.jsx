import React, { useState, useEffect } from 'react';
import { PlusIcon, EditIcon, TrashIcon } from '../common/Icons';
import { LedgerEntryModal } from '../modals/LedgerEntryModal';
import { getLedgerEntries, addLedgerEntry, updateLedgerEntry, deleteLedgerEntry } from '../../api/ledger';
import './LedgerTab.css';

export function LedgerTab() {
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const loadEntries = async () => {
    const res = await getLedgerEntries();
    if (res.success) {
      setEntries(res.data);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Compute running balance
  const outstandingGiven = entries
    .filter(e => e.entryType === 'CREDIT_GIVEN' && e.status !== 'PAID')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const outstandingReceived = entries
    .filter(e => e.entryType === 'CREDIT_RECEIVED' && e.status !== 'PAID')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this ledger record?')) {
      await deleteLedgerEntry(id);
      loadEntries();
    }
  };

  const handleSaveModal = async (entryData) => {
    if (editingEntry) {
      await updateLedgerEntry(editingEntry.id, entryData);
    } else {
      await addLedgerEntry(entryData);
    }
    setIsModalOpen(false);
    loadEntries();
  };

  return (
    <div className="ledger-tab-container">
      <div className="ledger-balance-row">
        <div className="ledger-balance-card">
          <span className="ledger-balance-label">Outstanding Credit Given (You are owed)</span>
          <span className="ledger-balance-amount given font-mono">
            ₹{outstandingGiven.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="ledger-balance-card">
          <span className="ledger-balance-label">Outstanding Credit Received (You owe)</span>
          <span className="ledger-balance-amount received font-mono">
            ₹{outstandingReceived.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="ledger-actions-bar">
        <span className="ledger-privacy-note">
          Private ledger. Visible only to your account.
        </span>
        <button
          type="button"
          className="ledger-add-btn"
          onClick={handleOpenAdd}
        >
          <PlusIcon size={16} />
          <span>Add Credit Entry</span>
        </button>
      </div>

      <div className="ledger-table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Party / Firm</th>
              <th>Direction</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
              <th>Description / Terms</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  No ledger entries recorded yet. Click "Add Credit Entry" to log informal trade credit.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-mono">{entry.entryDate}</td>
                  <td style={{ fontWeight: 600 }}>{entry.partyName}</td>
                  <td>
                    <span className={`ledger-type-badge ${entry.entryType === 'CREDIT_GIVEN' ? 'given' : 'received'}`}>
                      {entry.entryType === 'CREDIT_GIVEN' ? 'Given (Owed)' : 'Received (Owe)'}
                    </span>
                  </td>
                  <td className="font-mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(entry.amount).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`ledger-status-pill ${entry.status}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td style={{ maxWidth: '240px', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                    {entry.description || '-'}
                  </td>
                  <td>
                    <div className="ledger-table-actions" style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="ledger-icon-action"
                        onClick={() => handleOpenEdit(entry)}
                        title="Edit record"
                      >
                        <EditIcon size={15} />
                      </button>
                      <button
                        type="button"
                        className="ledger-icon-action delete"
                        onClick={() => handleDelete(entry.id)}
                        title="Delete record"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <LedgerEntryModal
          initialEntry={editingEntry}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}
