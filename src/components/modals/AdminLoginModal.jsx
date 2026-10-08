import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloseIcon, ShieldIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './ComplaintModal.css';

export function AdminLoginModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ phone: username, password });
      if (res.success && res.data?.role === 'ADMIN') {
        showToast('Authenticated as Market Association Administrator');
        onClose();
        navigate('/admin');
      } else {
        alert(res.message || 'Admin authentication failed. Please verify credentials.');
      }
    } catch (err) {
      alert('Error during admin login: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={20} color="var(--accent-color)" />
            <h3 className="modal-title">Market Association Desk</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleAdminSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
              Authorized arbitration access for Mumbai Trade Association committees.
            </p>

            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Admin Username</label>
              <input
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Admin Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="modal-btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Sign In to Admin Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginModal;
