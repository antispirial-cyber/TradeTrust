const SETTINGS_KEY = 'tradetrust_settings';

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
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return { success: true, data: JSON.parse(stored) };
    } catch {
      // fallback
    }
  }
  const defaultSettings = {
    accentColor: '#1E6FFB'
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  return { success: true, data: defaultSettings };
}

export async function saveUserSettings(settings) {
  const current = (await getUserSettings()).data;
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return { success: true, data: updated };
}
