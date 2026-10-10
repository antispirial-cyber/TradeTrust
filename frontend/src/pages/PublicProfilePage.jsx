import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScoreRing } from '../components/common/ScoreRing';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { ConnectButton } from '../components/common/ConnectButton';
import { PinIcon, FlagIcon } from '../components/common/Icons';
import { PastRecordsTab } from '../components/dashboard/PastRecordsTab';
import { ComplaintModal } from '../components/modals/ComplaintModal';
import { ScoreBreakdownModal } from '../components/modals/ScoreBreakdownModal';
import { getTraderById } from '../api/traders';
import { toggleConnectTrader, acceptConnection, declineConnection } from '../api/connections';
import { useToast } from '../context/ToastContext';
import './PublicProfilePage.css';

export function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trader, setTrader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'past-records'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const fetchTrader = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getTraderById(id);
      if (res.success) {
        setTrader(res.data);
      } else if (showLoading) {
        navigate('/browse');
      }
    } catch {
      if (showLoading) navigate('/browse');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrader(true);

    const handleUpdate = () => {
      // Background update without wiping or unmounting open modals
      fetchTrader(false);
    };

    window.addEventListener('tradetrust_score_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('tradetrust_score_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [id]);

  const handleConnectToggle = async () => {
    if (!trader) return;
    if (trader.connectionStatus === 'connected') {
      const confirmDisconnect = window.confirm(`Disconnect from ${trader.businessName}?`);
      if (!confirmDisconnect) return;
    }
    const res = await toggleConnectTrader(trader.id, trader.connectionStatus);
    if (res.success) {
      const nextStatus = res.data?.connectionStatus || 'not_connected';
      setTrader((prev) => ({ ...prev, connectionStatus: nextStatus }));
      if (nextStatus === 'connected') {
        showToast(`Connected with ${trader.businessName}`);
      } else if (nextStatus === 'pending_sent') {
        showToast(`Connection request sent to ${trader.businessName}`);
      } else {
        showToast('Connection removed');
      }
    } else {
      showToast(res.message || 'Action failed');
    }
  };

  const handleAccept = async () => {
    if (!trader?.connectionId) return;
    const res = await acceptConnection(trader.connectionId);
    if (res.success) {
      showToast(`Connected with ${trader.businessName}`);
      setTrader((prev) => ({ ...prev, connectionStatus: 'connected' }));
    } else {
      showToast(res.message || 'Failed to accept connection');
    }
  };

  const handleDecline = async () => {
    if (!trader?.connectionId) return;
    const res = await declineConnection(trader.connectionId);
    if (res.success) {
      showToast('Connection declined');
      setTrader((prev) => ({ ...prev, connectionStatus: 'not_connected' }));
    } else {
      showToast(res.message || 'Failed to decline connection');
    }
  };

  if (loading || !trader) {
    return <div style={{ color: 'var(--text-secondary)', padding: 'var(--space-xl)' }}>Loading trader profile...</div>;
  }

  const initialLetter = trader.initial || (trader.businessName ? trader.businessName[0].toUpperCase() : 'T');

  return (
    <div className="public-profile-page">
      <div className="public-profile-header">
        <div className="public-profile-left">
          <div className="public-profile-avatar">
            {(trader.photoUrl || trader.photoPath) ? (
              <img src={trader.photoUrl || trader.photoPath} alt={trader.businessName} className="public-profile-photo-img" />
            ) : (
              initialLetter
            )}
          </div>

          <div className="public-profile-info">
            <h1 className="public-profile-name">{trader.businessName}</h1>
            <div className="public-profile-meta">
              {trader.role} | {trader.sector}
            </div>
            <div className="public-profile-location">
              <PinIcon size={14} />
              <span>{trader.cluster}</span>
            </div>
            {trader.isVerifiedBadge && (
              <div style={{ marginTop: '4px' }}>
                <VerifiedBadge />
              </div>
            )}
            {trader.mutualConnections > 0 && (
              <div className="public-profile-mutual">
                {trader.mutualConnections} mutual connection{trader.mutualConnections > 1 ? 's' : ''} in bazaar
              </div>
            )}

            <div className="public-profile-actions">
              <div style={{ width: '140px' }}>
                <ConnectButton
                  status={trader.connectionStatus || 'not_connected'}
                  onClick={handleConnectToggle}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              </div>

              <button
                type="button"
                className="public-profile-report-btn"
                onClick={() => setIsReportModalOpen(true)}
                title="Report this trader"
              >
                <FlagIcon size={15} />
                <span>Report Default</span>
              </button>
            </div>
          </div>
        </div>

        <div className="public-profile-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoreRing score={trader.trustScore} size={120} onClick={() => setIsScoreModalOpen(true)} />
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              fontSize: '11px',
              marginTop: '8px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={() => setIsScoreModalOpen(true)}
          >
            View Calculation
          </button>
        </div>
      </div>

      <div className="public-profile-tabs">
        <button
          type="button"
          className={`public-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About Business
        </button>
        <button
          type="button"
          className={`public-tab-btn ${activeTab === 'past-records' ? 'active' : ''}`}
          onClick={() => setActiveTab('past-records')}
        >
          Past Records
        </button>
      </div>

      <div className="public-profile-content">
        {activeTab === 'about' ? (
          <div className="public-about-card">
            <h3 className="public-about-title">Business Description & Trade Lane</h3>
            <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
              {trader.businessDesc || 'No business description provided.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Market Cluster
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{trader.cluster}</span>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Primary Commodity
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{trader.sector}</span>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  Contact Line
                </span>
                <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{trader.phone}</span>
              </div>
            </div>
          </div>
        ) : (
          <PastRecordsTab traderId={trader.id} />
        )}
      </div>

      {isReportModalOpen && (
        <ComplaintModal
          reportedTrader={trader}
          onClose={() => setIsReportModalOpen(false)}
          onSubmitSuccess={() => {
            fetchTrader();
          }}
        />
      )}

      {isScoreModalOpen && (
        <ScoreBreakdownModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          traderId={trader.id}
          traderName={trader.businessName}
        />
      )}
    </div>
  );
}
