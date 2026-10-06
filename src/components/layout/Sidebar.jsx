import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserIcon, LedgerIcon, BellIcon, SettingsIcon, LogOutIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { TermsModal } from '../modals/TermsModal';
import { ContactModal } from '../modals/ContactModal';
import './Sidebar.css';

export function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/browse');
  };

  const handleGuardedNavigation = (path, promptKey) => {
    if (!user) {
      navigate(`${path}${path.includes('?') ? '&' : '?'}prompt=${promptKey}`);
    } else {
      navigate(path);
    }
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <NavLink to="/browse">
            <img src="/logo.png" alt="TradeTrust" className="sidebar-logo" />
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/browse"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <SearchIcon size={20} />
            <span>Browse Registry</span>
          </NavLink>

          <div
            className={`sidebar-link ${location.pathname === '/dashboard' && !location.search.includes('tab=ledger') ? 'active' : ''}`}
            onClick={() => handleGuardedNavigation('/dashboard', 'profile')}
          >
            <UserIcon size={20} />
            <span>My Profile</span>
          </div>

          <div
            className={`sidebar-link ${location.pathname === '/dashboard' && location.search.includes('tab=ledger') ? 'active' : ''}`}
            onClick={() => handleGuardedNavigation('/dashboard?tab=ledger', 'ledger')}
          >
            <LedgerIcon size={20} />
            <span>Private Ledger</span>
          </div>

          <div
            className={`sidebar-link ${location.pathname === '/notifications' ? 'active' : ''}`}
            onClick={() => handleGuardedNavigation('/notifications', 'notifications')}
          >
            <BellIcon size={20} />
            <span>Notifications</span>
            {user && unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <SettingsIcon size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="sidebar-user" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              <div className="sidebar-avatar">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.businessName || user.name} className="sidebar-avatar-img" />
                ) : (
                  user.initial || (user.businessName ? user.businessName[0] : (user.name ? user.name[0] : 'U'))
                )}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.businessName || user.name}</span>
                <span className="sidebar-user-role">{user.role}</span>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOutIcon size={18} />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className="sidebar-login-btn"
                style={{ padding: '8px 4px', fontSize: 'var(--text-xs)' }}
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className="sidebar-login-btn"
                style={{ padding: '8px 4px', fontSize: 'var(--text-xs)', background: 'var(--accent-blue)', color: '#fff', border: 'none' }}
                onClick={() => navigate('/register')}
              >
                Register
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsTermsOpen(true)}>
            Terms
          </span>
          <span>•</span>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsContactOpen(true)}>
            Contact
          </span>
        </div>
      </div>

      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
      {isContactOpen && <ContactModal onClose={() => setIsContactOpen(false)} />}
    </aside>
  );
}
