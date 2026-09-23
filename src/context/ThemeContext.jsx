import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, saveUserSettings } from '../api/settings';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [accentColor, setAccentColorState] = useState('#1E6FFB');

  const applyColorToRoot = (hex) => {
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    document.documentElement.style.setProperty('--accent-color', hex);
    // calculate muted with 20% alpha
    document.documentElement.style.setProperty('--accent-muted', `${hex}26`);
    document.documentElement.style.setProperty('--accent-hover', `${hex}dd`);
  };

  useEffect(() => {
    getUserSettings().then(res => {
      if (res.success && res.data.accentColor) {
        setAccentColorState(res.data.accentColor);
        applyColorToRoot(res.data.accentColor);
      }
    });
  }, []);

  const setAccentColor = (newColor) => {
    setAccentColorState(newColor);
    applyColorToRoot(newColor);
  };

  const persistAccentColor = async (colorToSave) => {
    const color = colorToSave || accentColor;
    await saveUserSettings({ accentColor: color });
  };

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, persistAccentColor }}>
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
