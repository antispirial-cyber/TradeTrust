import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { FloatingHelp } from '../common/FloatingHelp';
import { getNotifications } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import './AppLayout.css';

export function AppLayout() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    if (!user || user.role === 'ADMIN') {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getNotifications();
      if (res.success && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (!user || user.role === 'ADMIN') {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();

    const handleNotifUpdate = (e) => {
      if (e?.detail?.unreadCount !== undefined) {
        setUnreadCount(e.detail.unreadCount);
      } else {
        refreshUnreadCount();
      }
    };

    window.addEventListener('tradetrust_notifications_updated', handleNotifUpdate);
    window.addEventListener('storage', refreshUnreadCount);
    window.addEventListener('focus', refreshUnreadCount);

    const interval = setInterval(refreshUnreadCount, 5000);

    return () => {
      window.removeEventListener('tradetrust_notifications_updated', handleNotifUpdate);
      window.removeEventListener('storage', refreshUnreadCount);
      window.removeEventListener('focus', refreshUnreadCount);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar unreadCount={unreadCount} />
      <div className="app-main">
        <Navbar unreadCount={unreadCount} />
        <main className="app-content">
          <Outlet context={{ refreshUnreadCount }} />
        </main>
      </div>
      <BottomNav unreadCount={unreadCount} />
      <FloatingHelp />
    </div>
  );
}
