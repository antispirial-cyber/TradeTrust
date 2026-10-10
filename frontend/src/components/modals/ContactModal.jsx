import React from 'react';
import { CloseIcon, PinIcon } from '../common/Icons';
import './ComplaintModal.css';

export function ContactModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Contact & Support</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            For platform support, merchant onboarding, or dispute mediation inquiries:
          </p>

          <div style={{ background: 'var(--bg-input)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Mumbai Bazaar Association Helpdesk
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <PinIcon size={14} />
              <span>Zaveri Bazaar Trade Facilitation Cell, Kalbadevi, Mumbai 400002</span>
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <strong>Helpline:</strong> +91 22 2345 6789 (Mon - Sat, 10:00 AM - 7:00 PM)
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <strong>Email:</strong> helpdesk@tradetrust.local
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <strong>WhatsApp Grievance Desk:</strong> +91 98200 99999
            </div>
          </div>
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
