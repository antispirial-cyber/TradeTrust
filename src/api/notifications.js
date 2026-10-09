import { apiClient } from './client';
import { INITIAL_NOTIFICATIONS } from './mockData';

// Broadcast notification updates to AppLayout, Navbar, and pages
export function dispatchNotificationUpdate(unreadCount) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradetrust_notifications_updated', {
      detail: { unreadCount }
    }));
    window.dispatchEvent(new Event('storage'));
  }
}

export async function getNotifications() {
  // 1. Attempt backend fetch
  try {
    const res = await apiClient('/api/notifications');
    if (res.success && res.data) {
      const list = res.data.notifications || (Array.isArray(res.data) ? res.data : []);
      const formatted = list.map(n => ({
        ...n,
        id: n.id || n.notificationId
      }));
      const unreadCount = res.data.unreadCount !== undefined
        ? res.data.unreadCount
        : formatted.filter(n => !n.isRead).length;

      // Keep local storage in sync with backend
      try {
        localStorage.setItem('tradetrust_notifications', JSON.stringify(formatted));
      } catch {}

      return {
        success: true,
        data: formatted,
        unreadCount
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend notifications fetch error:', err);
  }

  // 2. Fallback to local storage
  const stored = localStorage.getItem('tradetrust_notifications');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return {
          success: true,
          data: parsed,
          unreadCount: parsed.filter(n => !n.isRead).length
        };
      }
    } catch {}
  }

  // 3. Fallback to initial seed
  const initial = Array.isArray(INITIAL_NOTIFICATIONS) ? INITIAL_NOTIFICATIONS : [];
  return {
    success: true,
    data: initial,
    unreadCount: initial.filter(n => !n.isRead).length
  };
}

export async function markAllNotificationsRead() {
  // 1. Update local storage first so UI has zero delay
  let updatedList = [];
  try {
    const stored = JSON.parse(localStorage.getItem('tradetrust_notifications') || '[]');
    if (Array.isArray(stored)) {
      updatedList = stored.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('tradetrust_notifications', JSON.stringify(updatedList));
    }
  } catch {}

  // Broadcast immediate 0 unread count
  dispatchNotificationUpdate(0);

  // 2. Sync with backend if connected
  try {
    const res = await apiClient('/api/notifications/read-all', { method: 'POST' });
    if (res.success) {
      const curr = await getNotifications();
      return {
        success: true,
        data: curr.data || updatedList,
        unreadCount: 0
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend markAllNotificationsRead error:', err);
  }

  return {
    success: true,
    data: updatedList,
    unreadCount: 0
  };
}

export async function markNotificationRead(id) {
  // 1. Update local storage
  let updatedList = [];
  let unreadCount = 0;
  try {
    const stored = JSON.parse(localStorage.getItem('tradetrust_notifications') || '[]');
    if (Array.isArray(stored)) {
      updatedList = stored.map(n => {
        if (String(n.id) === String(id) || String(n.notificationId) === String(id)) {
          return { ...n, isRead: true };
        }
        return n;
      });
      localStorage.setItem('tradetrust_notifications', JSON.stringify(updatedList));
      unreadCount = updatedList.filter(n => !n.isRead).length;
    }
  } catch {}

  // Broadcast updated count
  dispatchNotificationUpdate(unreadCount);

  // 2. Sync with backend if connected
  try {
    const res = await apiClient(`/api/notifications/${id}/read`, { method: 'POST' });
    if (res.success) {
      const curr = await getNotifications();
      return {
        success: true,
        data: curr.data || updatedList,
        unreadCount: curr.unreadCount !== undefined ? curr.unreadCount : unreadCount
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend markNotificationRead error:', err);
  }

  return {
    success: true,
    data: updatedList,
    unreadCount
  };
}

export async function clearAllNotifications() {
  try {
    localStorage.setItem('tradetrust_notifications', JSON.stringify([]));
  } catch {}

  dispatchNotificationUpdate(0);

  try {
    await apiClient('/api/notifications/clear', { method: 'POST' });
  } catch {}

  return {
    success: true,
    data: [],
    unreadCount: 0
  };
}

export function addNotification(notif) {
  const newNotif = {
    id: notif.id || 'notif-' + Date.now(),
    type: notif.type || 'system_alert',
    message: notif.message,
    linkRef: notif.linkRef || null,
    isRead: false,
    timestamp: notif.timestamp || 'Just now',
    createdAt: new Date().toISOString()
  };

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('tradetrust_notifications') || '[]');
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  list.unshift(newNotif);
  try {
    localStorage.setItem('tradetrust_notifications', JSON.stringify(list));
  } catch {}

  const unreadCount = list.filter(n => !n.isRead).length;
  dispatchNotificationUpdate(unreadCount);

  return newNotif;
}
