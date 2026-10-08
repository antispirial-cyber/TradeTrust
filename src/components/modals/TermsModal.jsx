import React from 'react';
import { CloseIcon } from '../common/Icons';
import './ComplaintModal.css';

export function TermsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Terms & Conditions</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(30, 111, 251, 0.1)', color: 'var(--accent-color)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            Status: Draft / Under Review by Mumbai Bazaar Associations
          </div>

          <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>1. Platform Purpose & Scope</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: '1.6' }}>
            TradeTrust serves as a reputation transparency and informal credit record-keeping network for wholesale and retail merchants across Mumbai trade clusters (including Zaveri Bazaar, Dadar Market, Mangaldas Market, and Lamington Road).
          </p>

          <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>2. Informal Credit Ledger Disclosures</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: '1.6' }}>
            Entries logged in the Private Credit Ledger remain confidential to the trader's account. Aggregated settlement metrics contribute to dynamic trust score calculations.
          </p>

          <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>3. Dispute Resolution & Association Arbitration</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: '1.6' }}>
            Commercial grievances follow a two-round mutual counter-exchange process. If unresolved, complaints escalate to the designated Trade Association Arbitration Desk for official findings.
          </p>

          <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>4. Data & Identity Verification</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: '1.6' }}>
            Phone numbers and merchant business names must accurately represent legitimate bazaar commercial entities.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
