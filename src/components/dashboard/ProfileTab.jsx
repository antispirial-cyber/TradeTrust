import React, { useState } from 'react';
import { EditIcon } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';
import './ProfileTab.css';

export function ProfileTab({ trader, onUpdateSuccess }) {
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(trader.businessName || '');
  const [businessDesc, setBusinessDesc] = useState(trader.businessDesc || '');
  const [phone, setPhone] = useState(trader.phone || '');
  const [cluster, setCluster] = useState(trader.cluster || 'Zaveri Bazaar');
  const [sector, setSector] = useState(trader.sector || 'Ornaments & Jewellery');

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile({
      businessName,
      businessDesc,
      phone,
      cluster,
      sector
    });
    setIsEditing(false);
    if (onUpdateSuccess) onUpdateSuccess();
  };

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
          <span>Active Bazaar Connections (4)</span>
        </div>

        <div className="connections-grid">
          <div className="connection-item-card">
            <div className="connection-item-left">
              <div className="connection-item-avatar">N</div>
              <div className="connection-item-info">
                <span className="connection-item-name">Navkar Diamond & Gems</span>
                <span className="connection-item-role">WHOLESALER • Zaveri Bazaar</span>
              </div>
            </div>
          </div>

          <div className="connection-item-card">
            <div className="connection-item-left">
              <div className="connection-item-avatar">Z</div>
              <div className="connection-item-info">
                <span className="connection-item-name">Zaveri Gold House</span>
                <span className="connection-item-role">RETAILER • Zaveri Bazaar</span>
              </div>
            </div>
          </div>

          <div className="connection-item-card">
            <div className="connection-item-left">
              <div className="connection-item-avatar">S</div>
              <div className="connection-item-info">
                <span className="connection-item-name">Sonal Gems & Crafts</span>
                <span className="connection-item-role">WHOLESALER • Zaveri Bazaar</span>
              </div>
            </div>
          </div>

          <div className="connection-item-card">
            <div className="connection-item-left">
              <div className="connection-item-avatar">B</div>
              <div className="connection-item-info">
                <span className="connection-item-name">Bombay Bullion Hub</span>
                <span className="connection-item-role">WHOLESALER • Zaveri Bazaar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
