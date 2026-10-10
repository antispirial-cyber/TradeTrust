import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ScoreRing } from '../components/common/ScoreRing';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { PinIcon } from '../components/common/Icons';
import { ProfileTab } from '../components/dashboard/ProfileTab';
import { LedgerTab } from '../components/dashboard/LedgerTab';
import { PastRecordsTab } from '../components/dashboard/PastRecordsTab';
import { DisputesTab } from '../components/dashboard/DisputesTab';
import { ScoreBreakdownModal } from '../components/modals/ScoreBreakdownModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './DashboardPage.css';

export function DashboardPage() {
  const { user, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isPastRecordsUnlocked, setIsPastRecordsUnlocked] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const tabParam = searchParams.get('tab');

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam === 'ledger') {
      setActiveTab('ledger');
    } else if (tabParam === 'disputes') {
      setActiveTab('disputes');
    } else if (tabParam === 'past-records') {
      setIsPastRecordsUnlocked(true);
      setActiveTab('past-records');
    } else {
      setActiveTab('profile');
    }
  }, [searchParams, tabParam]);

  const handleScoreRingClick = () => {
    if (!isPastRecordsUnlocked) {
      setIsPastRecordsUnlocked(true);
      setActiveTab('past-records');
      showToast('Verified Past Records Unlocked');
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
    const isLedgerRequest = tabParam === 'ledger';
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)', color: 'var(--text-secondary)', maxWidth: '520px', margin: '40px auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
          {isLedgerRequest ? 'Sign In to Access Private Credit Ledger' : 'Sign In to Access Personal Profile'}
        </h2>
        <p style={{ marginBottom: 'var(--space-lg)', lineHeight: '1.5', fontSize: 'var(--text-sm)' }}>
          {isLedgerRequest
            ? 'Your private credit given and received ledger is strictly confidential to your authenticated trading account.'
            : 'View your profile, credit ledger, and disputes.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
          <button
            type="button"
            className="modal-btn-primary"
            style={{ width: '100%', padding: '10px 14px' }}
            onClick={() => navigate('/login')}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            className="modal-btn-secondary"
            style={{ width: '100%', padding: '10px 14px', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
            onClick={() => navigate('/register')}
          >
            Register Business
          </button>
        </div>
      </div>
    );
  }

  const initialLetter = user.initial || (user.businessName ? user.businessName[0] : (user.name ? user.name[0] : 'U'));

  return (
    <div className="dashboard-page">
      {/* Profile Header Card */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-left">
          <div className="dashboard-photo-circle">
            {(user.photoUrl || user.photoPath) ? (
              <img src={user.photoUrl || user.photoPath} alt={user.businessName || user.name} className="dashboard-photo-img" />
            ) : (
              initialLetter
            )}
          </div>
          <div className="dashboard-header-info">
            <h1 className="dashboard-business-name">{user.businessName || user.name}</h1>
            <div className="dashboard-meta-line">
              {user.role} | {user.sector}
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

        <div className="dashboard-header-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoreRing
            score={user.trustScore}
            size={90}
            onClick={handleScoreRingClick}
          />
          <span className="dashboard-ring-hint" onClick={handleScoreRingClick}>
            {isPastRecordsUnlocked ? 'View Past Records' : 'Click score ring to unlock records'}
          </span>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              fontSize: '11px',
              marginTop: '4px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => setIsScoreModalOpen(true)}
          >
            Score Calculation
          </button>
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

        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => handleTabChange('disputes')}
        >
          Disputes
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
        {activeTab === 'disputes' && <DisputesTab />}
        {activeTab === 'past-records' && isPastRecordsUnlocked && (
          <PastRecordsTab traderId={user.id} />
        )}
      </div>

      {isScoreModalOpen && (
        <ScoreBreakdownModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          traderId={user.id}
          traderName={user.businessName || user.name}
        />
      )}
    </div>
  );
}
