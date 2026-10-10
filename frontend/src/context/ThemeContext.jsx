import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, saveUserSettings } from '../api/settings';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [accentColor, setAccentColorState] = useState('#1E6FFB');
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const s = localStorage.getItem('tradetrust_settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.themeMode === 'dark') return 'dark';
        if (parsed.themeMode === 'light') return 'light';
      }
    } catch {}
    return 'light';
  });

  const applyThemeMode = (mode) => {
    const valid = mode === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', valid);
    document.documentElement.style.colorScheme = valid;
  };

  const applyColorToRoot = (hex) => {
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    document.documentElement.style.setProperty('--accent-color', hex);
    document.documentElement.style.setProperty('--accent-blue', hex);
    // calculate muted with 20% alpha
    document.documentElement.style.setProperty('--accent-muted', `${hex}26`);
    document.documentElement.style.setProperty('--accent-hover', `${hex}dd`);
  };

  useEffect(() => {
    getUserSettings().then(res => {
      if (res.success && res.data) {
        const mode = res.data.themeMode === 'dark' ? 'dark' : 'light';
        setThemeModeState(mode);
        applyThemeMode(mode);

        if (res.data.accentColor) {
          setAccentColorState(res.data.accentColor);
          applyColorToRoot(res.data.accentColor);
        }
      } else {
        applyThemeMode('light');
      }
    });
  }, []);

  const setThemeMode = (newMode) => {
    const valid = newMode === 'light' ? 'light' : 'dark';
    setThemeModeState(valid);
    applyThemeMode(valid);
  };

  const setAccentColor = (newColor) => {
    setAccentColorState(newColor);
    applyColorToRoot(newColor);
  };

  const persistAppearance = async ({ themeMode: newMode, accentColor: newColor }) => {
    const modeToSave = newMode || themeMode;
    const colorToSave = newColor || accentColor;
    const current = await getUserSettings();
    await saveUserSettings({
      ...(current.data || {}),
      themeMode: modeToSave,
      accentColor: colorToSave
    });
  };

  const persistAccentColor = async (colorToSave) => {
    await persistAppearance({ accentColor: colorToSave });
  };

  const persistThemeMode = async (modeToSave) => {
    await persistAppearance({ themeMode: modeToSave });
  };

  return (
    <ThemeContext.Provider value={{
      accentColor,
      setAccentColor,
      themeMode,
      setThemeMode,
      persistAccentColor,
      persistThemeMode,
      persistAppearance
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
