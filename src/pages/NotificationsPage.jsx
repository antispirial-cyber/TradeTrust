import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BellIcon, FlagIcon, CheckIcon, UserIcon } from '../components/common/Icons';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import './NotificationsPage.css';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const outletCtx = useOutletContext();

  const loadNotificationsList = async () => {
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
  }, []);

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
                <span className="notification-time">{notif.timestamp}</span>
              </div>

              {!notif.isRead && <div className="notification-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
