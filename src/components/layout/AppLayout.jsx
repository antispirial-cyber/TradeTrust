import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { FloatingHelp } from '../common/FloatingHelp';
import { CourseworkPortfolio } from '../common/CourseworkPortfolio';
import { getNotifications } from '../../api/notifications';
import './AppLayout.css';

export function AppLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const res = await getNotifications();
      if (res.success) {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar unreadCount={unreadCount} />
      <div className="app-main">
        <Navbar unreadCount={unreadCount} />
        <main className="app-content">
          <Outlet context={{ refreshUnreadCount }} />
          {/* Dedicated Coursework & Evaluation Portfolio for professor grading */}
          <CourseworkPortfolio />
        </main>
      </div>
      <BottomNav unreadCount={unreadCount} />
      <FloatingHelp />
    </div>
  );
}
