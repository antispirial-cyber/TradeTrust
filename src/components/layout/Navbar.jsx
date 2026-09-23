import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Navbar.css';

export function Navbar({ unreadCount = 0 }) {
  const { user } = useAuth();
  const { showComingSoon } = useToast();
  const navigate = useNavigate();

  return (
    <header className="top-navbar">
      <div className="navbar-brand-mobile">
        <Link to="/browse">
          <img src="/logo.png" alt="TradeTrust" className="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link
              to="/notifications"
              className="navbar-icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <BellIcon size={20} />
              {unreadCount > 0 && <span className="navbar-badge" />}
            </Link>
            <div
              className="navbar-avatar"
              onClick={() => navigate('/dashboard')}
              title={`${user.businessName || user.name} (${user.role})`}
            >
              {user.initial || (user.businessName ? user.businessName[0] : 'U')}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="navbar-login-btn"
            onClick={(e) => showComingSoon(e)}
          >
            Log in / Sign up
          </button>
        )}
      </div>
    </header>
  );
}
