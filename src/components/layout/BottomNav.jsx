import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserIcon, LedgerIcon, BellIcon, SettingsIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './BottomNav.css';

export function BottomNav({ unreadCount = 0 }) {
  const { user } = useAuth();
  const { showComingSoon } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthNav = (e, path) => {
    if (!user) {
      e.preventDefault();
      showComingSoon(e);
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/browse"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <SearchIcon size={20} />
        <span>Browse</span>
      </NavLink>

      <div
        className={`bottom-nav-item ${location.pathname === '/dashboard' && !location.search.includes('tab=ledger') ? 'active' : ''}`}
        onClick={(e) => handleAuthNav(e, '/dashboard')}
      >
        <UserIcon size={20} />
        <span>Profile</span>
      </div>

      <div
        className={`bottom-nav-item ${location.pathname === '/dashboard' && location.search.includes('tab=ledger') ? 'active' : ''}`}
        onClick={(e) => handleAuthNav(e, '/dashboard?tab=ledger')}
      >
        <LedgerIcon size={20} />
        <span>Ledger</span>
      </div>

      <NavLink
        to="/notifications"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <BellIcon size={20} />
        <span>Alerts</span>
        {unreadCount > 0 && <span className="bottom-nav-badge" />}
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <SettingsIcon size={20} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
