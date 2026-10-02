import { apiClient } from './client';
import { INITIAL_NOTIFICATIONS } from './mockData';

export async function getNotifications() {
  const res = await apiClient('/api/notifications');
  if (res.success && res.data) {
    const list = res.data.notifications || (Array.isArray(res.data) ? res.data : []);
    const unreadCount = res.data.unreadCount !== undefined ? res.data.unreadCount : list.filter(n => !n.isRead).length;
    return {
      success: true,
      data: list.map(n => ({
        ...n,
        id: n.id || n.notificationId
      })),
      unreadCount
    };
  }

  // Fallback to local
  const stored = localStorage.getItem('tradetrust_notifications');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        success: true,
        data: parsed,
        unreadCount: parsed.filter(n => !n.isRead).length
      };
    } catch {}
  }

  return {
    success: true,
    data: INITIAL_NOTIFICATIONS,
    unreadCount: INITIAL_NOTIFICATIONS.filter(n => !n.isRead).length
  };
}

export async function markAllNotificationsRead() {
  const res = await apiClient('/api/notifications/read-all', { method: 'POST' });
  if (res.success) {
    const curr = await getNotifications();
    return {
      success: true,
      data: (curr.data || []).map(n => ({ ...n, isRead: true })),
      unreadCount: 0
    };
  }

  return {
    success: true,
    data: [],
    unreadCount: 0
  };
}

export async function markNotificationRead(id) {
  const res = await apiClient(`/api/notifications/${id}/read`, { method: 'POST' });
  const curr = await getNotifications();
  return {
    success: true,
    data: curr.data || [],
    unreadCount: curr.unreadCount || 0
  };
}
