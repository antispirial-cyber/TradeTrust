import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export function Navbar({ unreadCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNotificationClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate('/login?prompt=notifications');
    }
  };

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
              onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')}
              title={`${user.businessName || user.name} (${user.role})`}
            >
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.businessName || user.name} className="navbar-avatar-img" />
              ) : (
                user.initial || (user.businessName ? user.businessName[0] : (user.name ? user.name[0] : 'U'))
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/notifications"
              className="navbar-icon-btn"
              title="Notifications (Sign in required)"
              onClick={handleNotificationClick}
            >
              <BellIcon size={20} />
            </Link>
            <button
              type="button"
              className="navbar-login-btn"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className="navbar-register-btn"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
