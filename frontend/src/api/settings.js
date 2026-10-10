import { apiClient } from './client';

export const PRESET_ACCENT_COLORS = [
  '#1E6FFB',
  '#2DC653',
  '#90BE6D',
  '#F77F00',
  '#9B5DE5',
  '#F15BB5',
  '#00BBF9',
  '#E63946'
];

export async function getUserSettings() {
  const res = await apiClient('/api/trader/settings');
  if (res.success && res.data) {
    return { success: true, data: res.data };
  }
  return { success: true, data: { accentColor: '#1E6FFB', themeMode: 'light' } };
}

export async function saveUserSettings(settings) {
  const res = await apiClient('/api/trader/settings', {
    method: 'POST',
    body: settings
  });

  return {
    success: res.success,
    data: res.data || settings
  };
}
