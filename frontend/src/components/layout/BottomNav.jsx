import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserIcon, LedgerIcon, BellIcon, SettingsIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

export function BottomNav({ unreadCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGuardedNav = (path, promptKey) => {
    if (!user) {
      navigate(`${path}${path.includes('?') ? '&' : '?'}prompt=${promptKey}`);
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
        onClick={() => handleGuardedNav('/dashboard', 'profile')}
      >
        <UserIcon size={20} />
        <span>Profile</span>
      </div>

      <div
        className={`bottom-nav-item ${location.pathname === '/dashboard' && location.search.includes('tab=ledger') ? 'active' : ''}`}
        onClick={() => handleGuardedNav('/dashboard?tab=ledger', 'ledger')}
      >
        <LedgerIcon size={20} />
        <span>Ledger</span>
      </div>

      <div
        className={`bottom-nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
        onClick={() => handleGuardedNav('/notifications', 'notifications')}
      >
        <BellIcon size={20} />
        <span>Alerts</span>
        {user && unreadCount > 0 && <span className="bottom-nav-badge" />}
      </div>

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
