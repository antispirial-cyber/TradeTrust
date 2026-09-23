import React, { useState } from 'react';
import { CloseIcon } from '../common/Icons';
import './ComplaintModal.css';

export function LedgerEntryModal({ initialEntry, onClose, onSave }) {
  const [partyName, setPartyName] = useState(initialEntry ? initialEntry.partyName : '');
  const [amount, setAmount] = useState(initialEntry ? initialEntry.amount : '');
  const [entryType, setEntryType] = useState(initialEntry ? initialEntry.entryType : 'CREDIT_GIVEN');
  const [entryDate, setEntryDate] = useState(initialEntry ? initialEntry.entryDate : new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialEntry ? initialEntry.description : '');
  const [status, setStatus] = useState(initialEntry ? initialEntry.status : 'PENDING');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!partyName.trim() || !amount) return;

    onSave({
      partyName,
      amount: Number(amount),
      entryType,
      entryDate,
      description,
      status
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {initialEntry ? 'Edit Ledger Entry' : 'New Private Credit Record'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Party Name / Firm</label>
              <input
                type="text"
                placeholder="e.g. Navkar Diamond & Gems"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entry Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Credit Direction</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="browse-select"
                >
                  <option value="CREDIT_GIVEN">Credit Given (Owed to you)</option>
                  <option value="CREDIT_RECEIVED">Credit Received (You owe)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Settlement Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="browse-select"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Invoice Notes</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '80px' }}
                placeholder="Goods details, terms (e.g. 30 days informal slip #104)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-primary">
              {initialEntry ? 'Save Changes' : 'Record Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
