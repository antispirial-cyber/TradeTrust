import { INITIAL_NOTIFICATIONS } from './mockData';

const NOTIFICATIONS_KEY = 'tradetrust_notifications';

function getStoredNotifications() {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  return INITIAL_NOTIFICATIONS;
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export async function getNotifications() {
  const notifications = getStoredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  return {
    success: true,
    data: notifications,
    unreadCount
  };
}

export async function markAllNotificationsRead() {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, isRead: true }));
  saveNotifications(updated);
  return {
    success: true,
    data: updated,
    unreadCount: 0
  };
}

export async function markNotificationRead(id) {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveNotifications(updated);
  const unreadCount = updated.filter(n => !n.isRead).length;
  return {
    success: true,
    data: updated,
    unreadCount
  };
}
