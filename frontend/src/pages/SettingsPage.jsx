import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { PRESET_ACCENT_COLORS } from '../api/settings';
import { changePassword } from '../api/auth';
import { uploadFile } from '../api/client';
import { SunIcon, MoonIcon } from '../components/common/Icons';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const {
    accentColor,
    setAccentColor,
    themeMode,
    setThemeMode,
    persistAppearance
  } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  // Account details form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [cluster, setCluster] = useState('Zaveri Bazaar');
  const [sector, setSector] = useState('Ornaments & Jewellery');
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || user?.photoPath || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState(themeMode || 'light');
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
      setPhotoUrl(user.photoUrl || user.photoPath || '');
    }
  }, [user]);

  useEffect(() => {
    setSelectedColor(accentColor);
    setHexInput(accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (themeMode) {
      setSelectedTheme(themeMode);
    }
  }, [themeMode]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    setUploadingPhoto(true);
    try {
      const data = await uploadFile(file);
      const uploadedUrl = data.url;
      setPhotoUrl(uploadedUrl);
      await updateProfile({ photoUrl: uploadedUrl, photoPath: uploadedUrl });
      showToast('Custom profile photo uploaded successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to process photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl('');
    await updateProfile({ photoUrl: '', photoPath: '' });
    showToast('Profile photo removed. Defaulting to name initial.');
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (password && password.trim().length > 0) {
      if (password.trim().length < 4) {
        showToast('Password must be at least 4 characters long.');
        return;
      }
      const passRes = await changePassword(password.trim());
      if (!passRes.success) {
        showToast(passRes.message || 'Failed to update password');
        return;
      }
      setPassword('');
    }
    await updateProfile({
      name,
      phone,
      businessName,
      businessDesc,
      cluster,
      sector,
      photoUrl,
      photoPath: photoUrl
    });
    showToast('Account details updated successfully!');
  };

  const handleThemeSelect = (mode) => {
    setSelectedTheme(mode);
    setThemeMode(mode);
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
    await persistAppearance({ themeMode: selectedTheme, accentColor: selectedColor });
    showToast(`Appearance saved! Mode: ${selectedTheme === 'light' ? 'Light Slate' : 'Dark Obsidian'}`);
  };

  return (
    <div className="settings-page">
      {/* Account Details Section */}
      <div className="settings-section-card">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Account Details</h2>
          <p className="settings-section-desc">Manage your profile and business details</p>
        </div>

        {/* Profile Photo Upload Row */}
        <div className="photo-upload-row">
          <div className="photo-preview-circle">
            {(photoUrl || user?.photoUrl || user?.photoPath) ? (
              <img src={photoUrl || user?.photoUrl || user?.photoPath} alt="Merchant Avatar" className="photo-preview-img" />
            ) : (
              <span className="photo-preview-initial">
                {user?.initial || (businessName ? businessName[0].toUpperCase() : (name ? name[0].toUpperCase() : 'U'))}
              </span>
            )}
          </div>
          <div className="photo-upload-info">
            <h4 className="photo-upload-title">Profile Photo</h4>
            <p className="photo-upload-hint">
              Upload a shop logo or profile photo (PNG, JPG).
            </p>
            <div className="photo-upload-btn-group">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <button
                type="button"
                className="modal-btn-primary"
                style={{ padding: '7px 14px', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Processing...' : 'Upload Custom Photo'}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  className="modal-btn-secondary"
                  style={{ padding: '7px 14px', fontSize: 'var(--text-xs)' }}
                  onClick={handleRemovePhoto}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
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
              placeholder="Leave blank to keep unchanged"
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
          <h2 className="settings-section-title">Appearance & Themes</h2>
          <p className="settings-section-desc">Personalize your platform canvas theme and merchant accent color with live site-wide updates</p>
        </div>

        {/* Theme Mode Selector (Dark Obsidian vs Light Slate) */}
        <div className="theme-mode-section">
          <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
            Platform Canvas Theme
          </label>
          <div className="theme-mode-toggle-group">
            <button
              type="button"
              className={`theme-mode-card-btn ${selectedTheme === 'dark' ? 'selected' : ''}`}
              onClick={() => handleThemeSelect('dark')}
            >
              <div className="theme-mode-card-icon"><MoonIcon size={20} /></div>
              <div className="theme-mode-card-info">
                <span className="theme-mode-card-title">Dark Obsidian</span>
                <span className="theme-mode-card-desc">Bazaar trading night palette with deep navy cards</span>
              </div>
              {selectedTheme === 'dark' && <span className="theme-mode-active-indicator">Active</span>}
            </button>

            <button
              type="button"
              className={`theme-mode-card-btn ${selectedTheme === 'light' ? 'selected' : ''}`}
              onClick={() => handleThemeSelect('light')}
            >
              <div className="theme-mode-card-icon"><SunIcon size={20} /></div>
              <div className="theme-mode-card-info">
                <span className="theme-mode-card-title">Light Slate</span>
                <span className="theme-mode-card-desc">High-contrast 2-tone canvas with crisp card boundaries</span>
              </div>
              {selectedTheme === 'light' && <span className="theme-mode-active-indicator">Active</span>}
            </button>
          </div>
        </div>

        <div style={{ paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
          <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
            Accent Color Swatch
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
