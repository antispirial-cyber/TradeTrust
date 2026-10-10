import React from 'react';
import { CheckIcon } from '../common/Icons';

export function AdminSecurityTab() {
  return (
    <div className="admin-panel-card">
      <h3 className="panel-heading">System Security & Passwords</h3>
      <p className="panel-subheading">
        Database accounts and password verification for admin operations.
      </p>

      <div className="security-info-grid">
        <div className="security-card">
          <h4>Active Administrator Credential</h4>
          <div className="creds-detail-row">
            <span>Username:</span>
            <code>Admin</code>
          </div>
          <div className="creds-detail-row">
            <span>Password:</span>
            <code>SHA-256 Hash Authenticated</code>
          </div>
          <div className="creds-detail-row">
            <span>Role:</span>
            <span className="role-chip">ADMIN (Market Association Desk)</span>
          </div>
          <div className="creds-detail-row">
            <span>Database Source:</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>MySQL tradetrust_db.admins</span>
          </div>
        </div>

        <div className="security-card">
          <h4>Merchant Password Security</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            All passwords are protected using SHA-256 hashing. within MySQL. No plain-text passwords exist in the database.
          </p>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
            <CheckIcon size={16} /> Secure MySQL Persistence
          </div>
        </div>
      </div>
    </div>
  );
}
