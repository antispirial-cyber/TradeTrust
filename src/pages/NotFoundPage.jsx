import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Page Not Found</h2>
      <p style={{ marginBottom: 'var(--space-md)' }}>The requested route is unavailable.</p>
      <Link to="/browse" className="modal-btn-primary" style={{ display: 'inline-block' }}>
        Return to Browse Registry
      </Link>
    </div>
  );
}
