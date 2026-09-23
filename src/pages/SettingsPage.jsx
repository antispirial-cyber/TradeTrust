import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { PRESET_ACCENT_COLORS } from '../api/settings';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { accentColor, setAccentColor, persistAccentColor } = useTheme();
  const { showToast } = useToast();

  // Account details form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [cluster, setCluster] = useState('Zaveri Bazaar');
  const [sector, setSector] = useState('Ornaments & Jewellery');
  const [password, setPassword] = useState('••••••••');

  // Appearance state
  const [selectedColor, setSelectedColor] = useState(accentColor);
  const [hexInput, setHexInput] = useState(accentColor);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBusinessName(user.businessName || '');
      setBusinessDesc(user.businessDesc || '');
      setCluster(user.cluster || 'Zaveri Bazaar');
      setSector(user.sector || 'Ornaments & Jewellery');
    }
  }, [user]);

  useEffect(() => {
    setSelectedColor(accentColor);
    setHexInput(accentColor);
  }, [accentColor]);

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    showComingSoon(e);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setHexInput(color);
    setAccentColor(color);
  };

  const handleHexChange = (e) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setSelectedColor(val);
      setAccentColor(val);
    }
  };

  const handleSaveAppearance = async () => {
    await persistAccentColor(selectedColor);
    showToast('Accent color saved!');
  };

  return (
    <div className="settings-page">
      {/* Account Details Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Account Details</h2>
          <p className="settings-section-desc">Manage your business profile identity and trading lane credentials</p>
        </div>

        <form className="settings-form" onSubmit={handleAccountSubmit}>
          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registered Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Business / Shop Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Cluster Market</label>
              <input
                type="text"
                value={cluster}
                onChange={(e) => setCluster(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Commodity Sector</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Business Overview Description</label>
            <textarea
              className="form-textarea"
              value={businessDesc}
              onChange={(e) => setBusinessDesc(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">Account Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="modal-btn-primary" style={{ alignSelf: 'flex-start' }}>
            Save Account Details
          </button>
        </form>
      </div>

      {/* Appearance Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Appearance & Accent Color</h2>
          <p className="settings-section-desc">Personalize your platform accent color with live updates across all pages</p>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
            Select Color Swatch
          </label>
          <div className="appearance-palette">
            {PRESET_ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch-btn ${selectedColor.toLowerCase() === color.toLowerCase() ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>

          <div className="custom-hex-row">
            <label className="form-label">Custom HEX:</label>
            <input
              type="text"
              className="custom-hex-input"
              value={hexInput}
              onChange={handleHexChange}
              maxLength={7}
            />
          </div>

          <div className="live-preview-box">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Live preview:</span>
            <button
              type="button"
              className="modal-btn-primary"
              style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}
            >
              Accent Button
            </button>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent-color)',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--accent-muted)'
              }}
            >
              Active Badge
            </span>
          </div>
        </div>

        <button
          type="button"
          className="modal-btn-primary"
          style={{ alignSelf: 'flex-start' }}
          onClick={handleSaveAppearance}
        >
          Save Appearance
        </button>
      </div>
    </div>
  );
}
