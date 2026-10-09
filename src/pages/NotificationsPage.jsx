import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BellIcon, FlagIcon, CheckIcon, UserIcon, TrashIcon } from '../components/common/Icons';
import { getNotifications, markAllNotificationsRead, markNotificationRead, clearAllNotifications } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './NotificationsPage.css';

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
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
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('[NotificationsPage] Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsList();

    const handleUpdate = () => {
      loadNotificationsList();
    };

    window.addEventListener('tradetrust_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('tradetrust_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    // Optimistic local update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    const res = await markAllNotificationsRead();
    if (res.success) {
      setNotifications(res.data);
      if (outletCtx && outletCtx.refreshUnreadCount) {
        outletCtx.refreshUnreadCount();
      }
      showToast('All notifications marked as read.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all market notifications and alerts?')) return;

    // Optimistic local update
    setNotifications([]);

    const res = await clearAllNotifications();
    if (res.success) {
      if (outletCtx && outletCtx.refreshUnreadCount) {
        outletCtx.refreshUnreadCount();
      }
      showToast('All notifications cleared.');
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      // Optimistic local update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
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
      case 'retake_requested':
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--accent-color)' }}>
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
            style={{ width: '100%', padding: '10px 14px', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
            onClick={() => navigate('/register')}
          >
            Register Business
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayedNotifications = filter === 'UNREAD'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">Notifications & Market Alerts</h1>
          <div className="notifications-filter-bar">
            <button
              type="button"
              className={`notifications-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`notifications-filter-btn ${filter === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        <div className="notifications-actions">
          <button
            type="button"
            className="notifications-mark-btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
          <button
            type="button"
            className="notifications-clear-btn"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {displayedNotifications.length === 0 && !loading ? (
          <div className="notifications-empty">
            <h3>{filter === 'UNREAD' ? 'No unread notifications.' : 'No notifications yet.'}</h3>
            <p style={{ marginTop: '8px', fontSize: 'var(--text-sm)' }}>
              {filter === 'UNREAD'
                ? "You are completely caught up with all market circulars and trade dispute notices."
                : "You will receive updates here whenever there are connection requests, complaints, or score recalculations."}
            </p>
          </div>
        ) : (
          displayedNotifications.map((notif) => (
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
                <span className="notification-time">
                  {notif.timestamp || (notif.createdAt ? String(notif.createdAt).split('T')[0] : 'Today')}
                </span>
              </div>

              {!notif.isRead && <div className="notification-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
