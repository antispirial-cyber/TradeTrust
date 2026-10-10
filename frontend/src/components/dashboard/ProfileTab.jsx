import React, { useState, useRef, useEffect } from 'react';
import { EditIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import { getAcceptedConnections } from '../../api/connections';
import { uploadFile } from '../../api/client';
import './ProfileTab.css';

export function ProfileTab({ trader, onUpdateSuccess }) {
  const { updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(trader.businessName || '');
  const [businessDesc, setBusinessDesc] = useState(trader.businessDesc || '');
  const [phone, setPhone] = useState(trader.phone || '');
  const [cluster, setCluster] = useState(trader.cluster || 'Zaveri Bazaar');
  const [sector, setSector] = useState(trader.sector || 'Ornaments & Jewellery');
  const [photoPath, setPhotoPath] = useState(trader.photoPath || trader.photoUrl || '');
  const [uploading, setUploading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConn, setLoadingConn] = useState(true);

  useEffect(() => {
    if (trader) {
      setBusinessName(trader.businessName || '');
      setBusinessDesc(trader.businessDesc || '');
      setPhone(trader.phone || '');
      setCluster(trader.cluster || 'Zaveri Bazaar');
      setSector(trader.sector || 'Ornaments & Jewellery');
      setPhotoPath(trader.photoPath || trader.photoUrl || '');
    }
  }, [trader]);

  useEffect(() => {
    async function loadConnections() {
      setLoadingConn(true);
      try {
        const res = await getAcceptedConnections();
        if (res.success && Array.isArray(res.data)) {
          setConnections(res.data);
        }
      } catch (err) {
        console.warn('Failed to load active connections:', err);
      } finally {
        setLoadingConn(false);
      }
    }
    loadConnections();
  }, [trader]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }
    setUploading(true);
    try {
      const data = await uploadFile(file);
      if (data && data.url) {
        const uploadedUrl = data.url;
        setPhotoPath(uploadedUrl);
        await updateProfile({ photoPath: uploadedUrl, photoUrl: uploadedUrl });
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        alert('File upload failed');
      }
    } catch (err) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPath('');
    await updateProfile({ photoPath: '', photoUrl: '' });
    if (onUpdateSuccess) onUpdateSuccess();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile({
      businessName,
      businessDesc,
      phone,
      cluster,
      sector,
      photoPath,
      photoUrl: photoPath
    });
    setIsEditing(false);
    if (onUpdateSuccess) onUpdateSuccess();
  };

  const initialLetter = trader.initial || (trader.businessName ? trader.businessName[0].toUpperCase() : 'T');

  return (
    <div className="dashboard-profile-tab">
      <div className="profile-section-card">
        <div className="profile-section-title">
          <span>Business Information</span>
          <button
            type="button"
            className="modal-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setIsEditing(!isEditing)}
          >
            <EditIcon size={14} />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--card-radius)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {(photoPath || trader.photoPath || trader.photoUrl) ? (
                  <img src={photoPath || trader.photoPath || trader.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {initialLetter}
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                  Merchant Profile Photo
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Upload shop logo or photo
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="modal-btn-primary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </button>
                  {photoPath && (
                    <button
                      type="button"
                      className="modal-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </button>
                  )}
                </div>
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

            <div className="profile-details-grid">
              <div className="form-group">
                <label className="form-label">Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cluster / Bazaar</label>
                <input
                  type="text"
                  value={cluster}
                  onChange={(e) => setCluster(e.target.value)}
                  required
                />
              </div>
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

            <div className="form-group">
              <label className="form-label">Business Description</label>
              <textarea
                className="form-textarea"
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
              />
            </div>

            <button type="submit" className="modal-btn-primary" style={{ alignSelf: 'flex-start' }}>
              Save Profile Updates
            </button>
          </form>
        ) : (
          <>
            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Trader Role</span>
                <span className="profile-detail-value">{trader.role}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Cluster Market</span>
                <span className="profile-detail-value">{trader.cluster}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Commodity Sector</span>
                <span className="profile-detail-value">{trader.sector}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Verified Phone</span>
                <span className="profile-detail-value font-mono">{trader.phone}</span>
              </div>
            </div>

            <div className="profile-detail-item" style={{ marginTop: 'var(--space-sm)' }}>
              <span className="profile-detail-label">Business Overview</span>
              <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                {trader.businessDesc || 'No business description provided.'}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="profile-section-card">
        <div className="profile-section-title">
          <span>Active Bazaar Connections ({connections.length})</span>
        </div>

        {connections.length === 0 && !loadingConn ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', padding: 'var(--space-md) 0' }}>
            No active connections yet. Explore the Bazaar Registry to send and accept connection requests.
          </p>
        ) : (
          <div className="connections-grid">
            {connections.map((c) => {
              const cInit = c.initial || (c.businessName ? c.businessName[0].toUpperCase() : 'T');
              return (
                <div key={c.traderId || c.id} className="connection-item-card">
                  <div className="connection-item-left">
                    <div className="connection-item-avatar">
                      {(c.photoPath || c.photoUrl) ? (
                        <img src={c.photoPath || c.photoUrl} alt={c.businessName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        cInit
                      )}
                    </div>
                    <div className="connection-item-info">
                      <span className="connection-item-name">{c.businessName}</span>
                      <span className="connection-item-role">{c.role} | {c.cluster}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
