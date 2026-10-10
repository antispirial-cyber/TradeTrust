import { apiClient } from './client';

export function dispatchNotificationUpdate(unreadCount) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradetrust_notifications_updated', {
      detail: { unreadCount }
    }));
  }
}

export async function getNotifications() {
  const res = await apiClient('/api/notifications');
  if (res.success && res.data) {
    const list = res.data.notifications || (Array.isArray(res.data) ? res.data : []);
    const formatted = list.map(n => ({
      ...n,
      id: n.notificationId || n.id
    }));
    const unreadCount = res.data.unreadCount !== undefined
      ? res.data.unreadCount
      : formatted.filter(n => !n.isRead).length;

    dispatchNotificationUpdate(unreadCount);
    return {
      success: true,
      data: formatted,
      unreadCount
    };
  }

  return {
    success: false,
    data: [],
    unreadCount: 0
  };
}

export async function markAllNotificationsRead() {
  const res = await apiClient('/api/notifications/read-all', { method: 'POST' });
  dispatchNotificationUpdate(0);
  return {
    success: res.success,
    unreadCount: 0
  };
}

export async function markNotificationRead(id) {
  const res = await apiClient(`/api/notifications/${id}/read`, { method: 'POST' });
  return {
    success: res.success
  };
}

export async function clearAllNotifications() {
  const res = await apiClient('/api/notifications/clear', { method: 'POST' });
  dispatchNotificationUpdate(0);
  return {
    success: res.success,
    data: [],
    unreadCount: 0
  };
}
