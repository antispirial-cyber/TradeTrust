import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BellIcon, FlagIcon, CheckIcon, UserIcon } from '../components/common/Icons';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './NotificationsPage.css';

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const outletCtx = useOutletContext();
  const { showToast } = useToast();

  const loadNotificationsList = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsList();
  }, [user]);

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsRead();
    if (res.success) {
      setNotifications(res.data);
      if (outletCtx && outletCtx.refreshUnreadCount) {
        outletCtx.refreshUnreadCount();
      }
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
      if (outletCtx && outletCtx.refreshUnreadCount) {
        outletCtx.refreshUnreadCount();
      }
    }
    if (notif.linkRef) {
      navigate(notif.linkRef);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'admin_verdict':
      case 'complaint_filed':
        return <FlagIcon size={18} />;
      case 'connection_accepted':
      case 'connection_request':
        return <UserIcon size={18} />;
      case 'score_updated':
        return <CheckIcon size={18} />;
      default:
        return <BellIcon size={18} />;
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)', color: 'var(--text-secondary)', maxWidth: '520px', margin: '40px auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--accent-blue)' }}>
          <BellIcon size={32} />
        </div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
          Sign In to View Notifications & Alerts
        </h2>
        <p style={{ marginBottom: 'var(--space-lg)', lineHeight: '1.5', fontSize: 'var(--text-sm)' }}>
          Commercial dispute notices, mutual connection approvals, and association arbitration findings are delivered privately to your trading account.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
          <button
            type="button"
            className="modal-btn-primary"
            style={{ width: '100%', padding: '10px 14px' }}
            onClick={() => navigate('/login?prompt=notifications')}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            className="modal-btn-secondary"
            style={{ width: '100%', padding: '10px 14px', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
            onClick={() => navigate('/register')}
          >
            Register Business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="notifications-title">Notifications & Market Alerts</h1>
        <button
          type="button"
          className="notifications-mark-btn"
          onClick={handleMarkAllRead}
        >
          Mark all as read
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 && !loading ? (
          <div className="notifications-empty">
            <h3>No notifications yet.</h3>
            <p style={{ marginTop: '8px', fontSize: 'var(--text-sm)' }}>
              You will receive updates here whenever there are connection requests, complaints, or score recalculations.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => handleItemClick(notif)}
            >
              <div className="notification-icon-box">
                {getIconForType(notif.type)}
              </div>

              <div className="notification-content">
                <p className="notification-message">{notif.message}</p>
                <span className="notification-time">{notif.timestamp || (notif.createdAt ? String(notif.createdAt).split('T')[0] : 'Today')}</span>
              </div>

              {!notif.isRead && <div className="notification-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
