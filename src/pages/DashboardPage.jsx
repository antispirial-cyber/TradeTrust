import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScoreRing } from '../components/common/ScoreRing';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { PinIcon } from '../components/common/Icons';
import { ProfileTab } from '../components/dashboard/ProfileTab';
import { LedgerTab } from '../components/dashboard/LedgerTab';
import { PastRecordsTab } from '../components/dashboard/PastRecordsTab';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './DashboardPage.css';

export function DashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [isPastRecordsUnlocked, setIsPastRecordsUnlocked] = useState(false);

  // Sync tab with URL query parameter ?tab=ledger
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'ledger') {
      setActiveTab('ledger');
    } else if (tabParam === 'past-records') {
      setIsPastRecordsUnlocked(true);
      setActiveTab('past-records');
    } else {
      setActiveTab('profile');
    }
  }, [searchParams]);

  const handleScoreRingClick = () => {
    if (!isPastRecordsUnlocked) {
      setIsPastRecordsUnlocked(true);
      setActiveTab('past-records');
      showToast('Verified Past Records Unlocked 🔓');
    } else {
      setActiveTab('past-records');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Not Signed In Yet</h2>
        <p style={{ marginBottom: 'var(--space-md)' }}>Please log in to access your personal business profile and private credit ledger.</p>
        <button
          type="button"
          className="modal-btn-primary"
          onClick={(e) => showComingSoon(e)}
        >
          Log in / Sign up
        </button>
      </div>
    );
  }

  const initialLetter = user.initial || (user.businessName ? user.businessName[0] : 'U');

  return (
    <div className="dashboard-page">
      {/* Profile Header Card */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-left">
          <div className="dashboard-photo-circle">
            {initialLetter}
          </div>
          <div className="dashboard-header-info">
            <h1 className="dashboard-business-name">{user.businessName || user.name}</h1>
            <div className="dashboard-meta-line">
              {user.role} • {user.sector}
            </div>
            <div className="dashboard-cluster-line">
              <PinIcon size={14} />
              <span>{user.cluster}</span>
            </div>
            {user.isVerifiedBadge && (
              <div className="dashboard-badge-line">
                <VerifiedBadge />
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-header-right">
          <ScoreRing
            score={user.trustScore}
            size={90}
            onClick={handleScoreRingClick}
          />
          <span className="dashboard-ring-hint" onClick={handleScoreRingClick}>
            {isPastRecordsUnlocked ? 'View Past Records' : 'Click score ring to unlock records'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs-bar">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          Profile
        </button>

        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => handleTabChange('ledger')}
        >
          Private Ledger
        </button>

        {isPastRecordsUnlocked && (
          <button
            type="button"
            className={`dashboard-tab-btn unlocked-pulse ${activeTab === 'past-records' ? 'active' : ''}`}
            onClick={() => handleTabChange('past-records')}
          >
            Past Records
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="dashboard-tab-content">
        {activeTab === 'profile' && <ProfileTab trader={user} />}
        {activeTab === 'ledger' && <LedgerTab />}
        {activeTab === 'past-records' && isPastRecordsUnlocked && (
          <PastRecordsTab traderId={user.id} />
        )}
      </div>
    </div>
  );
}
