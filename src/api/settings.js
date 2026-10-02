import { apiClient } from './client';

export const PRESET_ACCENT_COLORS = [
  '#1E6FFB', // Vibrant Blue (Default)
  '#2DC653', // Emerald Green
  '#90BE6D', // Lime Green
  '#F77F00', // Amber Orange
  '#9B5DE5', // Purple
  '#F15BB5', // Magenta Pink
  '#00BBF9', // Cyan
  '#E63946'  // Crimson Red
];

export async function getUserSettings() {
  const res = await apiClient('/api/trader/settings');
  if (res.success && res.data) {
    return { success: true, data: res.data };
  }

  const stored = localStorage.getItem('tradetrust_settings');
  if (stored) {
    try {
      return { success: true, data: JSON.parse(stored) };
    } catch {}
  }
  const defaultSettings = { accentColor: '#1E6FFB' };
  localStorage.setItem('tradetrust_settings', JSON.stringify(defaultSettings));
  return { success: true, data: defaultSettings };
}

export async function saveUserSettings(settings) {
  const res = await apiClient('/api/trader/settings', {
    method: 'POST',
    body: settings
  });

  const updated = res.success && res.data ? res.data : settings;
  localStorage.setItem('tradetrust_settings', JSON.stringify(updated));
  return { success: true, data: updated };
}
