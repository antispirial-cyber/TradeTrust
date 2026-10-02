import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserIcon, LedgerIcon, BellIcon, SettingsIcon, LogOutIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Sidebar.css';

export function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const { showComingSoon } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/browse');
  };

  const handleAuthGuardedNav = (e, path) => {
    navigate(path);
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
            onClick={(e) => handleAuthGuardedNav(e, '/dashboard')}
          >
            <UserIcon size={20} />
            <span>My Profile</span>
          </div>

          <div
            className={`sidebar-link ${location.pathname === '/dashboard' && location.search.includes('tab=ledger') ? 'active' : ''}`}
            onClick={(e) => handleAuthGuardedNav(e, '/dashboard?tab=ledger')}
          >
            <LedgerIcon size={20} />
            <span>Private Ledger</span>
          </div>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <BellIcon size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
          </NavLink>

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
                {user.initial || (user.businessName ? user.businessName[0] : 'U')}
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
          <button
            type="button"
            className="sidebar-login-btn"
            onClick={() => navigate('/login')}
          >
            Log in / Sign up
          </button>
        )}
      </div>
    </aside>
  );
}
