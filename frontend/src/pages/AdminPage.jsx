import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getAdminMetrics,
  resolveDispute,
  toggleTraderFreeze,
  toggleTraderVerified,
  setTraderCustomScore,
  broadcastNotice
} from '../api/admin';
import { getAllComplaints } from '../api/complaints';
import { getTraders } from '../api/traders';
import { ShieldIcon, GavelIcon, LogOutIcon } from '../components/common/Icons';
import { AdminDisputesTab } from '../components/admin/AdminDisputesTab';
import { AdminMerchantsTab } from '../components/admin/AdminMerchantsTab';
import { AdminCircularsTab } from '../components/admin/AdminCircularsTab';
import { AdminSecurityTab } from '../components/admin/AdminSecurityTab';
import './AdminPage.css';

export function AdminPage() {
  const { user, login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Admin Tab: 'disputes' | 'merchants' | 'broadcast' | 'security'
  const [activeTab, setActiveTab] = useState('disputes');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalTraders: 0,
    pendingComplaints: 0,
    frozenTraders: 0,
    averageTrustScore: '10.00',
    totalDisputedAmount: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [traders, setTraders] = useState([]);

  // Filter & Search
  const [complaintFilter, setComplaintFilter] = useState('ALL');
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantCluster, setMerchantCluster] = useState('All');

  // Score Adjustment Modal / State
  const [adjustingTrader, setAdjustingTrader] = useState(null);
  const [newScoreVal, setNewScoreVal] = useState('10.00');

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCluster, setBroadcastCluster] = useState('All Clusters');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Login form state for unauthorized visits
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const loadAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [metricsRes, complaintsRes, tradersRes] = await Promise.all([
        getAdminMetrics(),
        getAllComplaints(),
        getTraders()
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (complaintsRes.success) setComplaints(complaintsRes.data || []);
      if (tradersRes.success) setTraders(tradersRes.data || []);
    } catch (err) {
      console.error('[TradeTrust Admin] Error loading admin suite:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadAdminData(false);

      // 5-second background polling so newly filed complaints appear automatically
      const pollInterval = setInterval(() => {
        loadAdminData(true);
      }, 5000);

      const handleUpdate = () => {
        loadAdminData(true);
      };

      window.addEventListener('tradetrust_complaints_updated', handleUpdate);
      window.addEventListener('tradetrust_score_updated', handleUpdate);
      window.addEventListener('focus', handleUpdate);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('tradetrust_complaints_updated', handleUpdate);
        window.removeEventListener('tradetrust_score_updated', handleUpdate);
        window.removeEventListener('focus', handleUpdate);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAdminGateLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await login({ phone: authUsername, password: authPassword });
      if (res.success && res.data?.role === 'ADMIN') {
        showToast('Welcome, Market Association Administrator!');
      } else {
        showToast(res.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      showToast('Login error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResolveDispute = async (complaintId, verdict) => {
    let confirmMsg = '';
    if (verdict === 'APPROVED') {
      confirmMsg = `Are you sure you want to APPROVE Dispute #${complaintId}? This will deduct trust score from the reported merchant.`;
    } else if (verdict === 'REJECTED') {
      confirmMsg = `Dismiss Dispute #${complaintId} without score penalty?`;
    } else if (verdict === 'RETAKE_APPROVED') {
      confirmMsg = `Approve Retake Request for Dispute #${complaintId}? This will withdraw the complaint and restore the merchant's trust score.`;
    } else if (verdict === 'RETAKE_REJECTED') {
      confirmMsg = `Reject Retake Request for Dispute #${complaintId}? The dispute will remain in its current status.`;
    } else {
      confirmMsg = `Apply verdict ${verdict} to Dispute #${complaintId}?`;
    }

    if (!window.confirm(confirmMsg)) return;

    const res = await resolveDispute(complaintId, verdict);
    if (res.success) {
      showToast(res.message || `Dispute #${complaintId} resolved: ${verdict}`);
      await loadAdminData(true);
    } else {
      showToast(res.message || 'Failed to update dispute');
    }
  };

  const handleToggleFreeze = async (trader) => {
    const currentFreeze = trader.scoreFrozen || trader.isScoreFrozen;
    const nextFreeze = !currentFreeze;
    const confirmMsg = nextFreeze
      ? `Freeze trust score for ${trader.businessName}? Merchant will be flagged during inquiry.`
      : `Unfreeze trust score for ${trader.businessName}?`;

    if (!window.confirm(confirmMsg)) return;

    const res = await toggleTraderFreeze(trader.id || trader.traderId, nextFreeze);
    if (res.success) {
      showToast(`${trader.businessName} score is now ${nextFreeze ? 'FROZEN' : 'ACTIVE'}`);
      await loadAdminData(true);
    }
  };

  const handleToggleBadge = async (trader) => {
    const nextBadge = !trader.isVerifiedBadge;
    const res = await toggleTraderVerified(trader.id || trader.traderId, nextBadge);
    if (res.success) {
      showToast(`Verification badge ${nextBadge ? 'granted to' : 'removed from'} ${trader.businessName}`);
      await loadAdminData(true);
    }
  };

  const handleSaveScore = async () => {
    if (!adjustingTrader) return;
    const num = parseFloat(newScoreVal);
    if (isNaN(num) || num < 0 || num > 10) {
      showToast('Score must be between 0.00 and 10.00');
      return;
    }
    const res = await setTraderCustomScore(adjustingTrader.id || adjustingTrader.traderId, num);
    if (res.success) {
      showToast(`${adjustingTrader.businessName} score adjusted to ${num.toFixed(2)}`);
      setAdjustingTrader(null);
      await loadAdminData(true);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await broadcastNotice({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        cluster: broadcastCluster
      });
      if (res.success) {
        showToast('Circular broadcasted to all merchant portals!');
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleAdminLogout = async () => {
    await logout();
    showToast('Signed out of Admin Panel');
    navigate('/login');
  };

  // If not logged in as Admin, show the Admin Gate
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="admin-gate-container">
        <div className="admin-gate-card">
          <div className="admin-gate-icon">
            <ShieldIcon size={44} color="var(--accent-color)" />
          </div>
          <h2 className="admin-gate-title">Market Association Arbitration Desk</h2>
          <p className="admin-gate-subtitle">
            Restricted administrative portal for Mumbai Market Association officers, arbitration panellists, and score compliance regulators.
          </p>

          <form className="admin-gate-form" onSubmit={handleAdminGateLogin}>
            <div className="form-group">
              <label className="form-label">Administrator Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
                placeholder="Admin username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </div>

            <button type="submit" className="admin-gate-btn" disabled={authLoading}>
              {authLoading ? 'Verifying Credentials...' : 'Sign In as Administrator'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Association Header Bar */}
      <div className="admin-header-bar">
        <div className="admin-header-left">
          <div className="admin-badge-icon">
            <GavelIcon size={22} color="#fff" />
          </div>
          <div>
            <h1 className="admin-header-title">Trade Association Admin Portal</h1>
            <p className="admin-header-sub">
              Mumbai Bazaar Merchant Administration & Dispute Resolution
            </p>
          </div>
        </div>

        <div className="admin-header-actions">
          <span className="admin-role-pill">ADMIN</span>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleAdminLogout}
            title="Sign out"
          >
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid">
        <div className="metric-box">
          <span className="metric-label">REGISTERED MERCHANTS</span>
          <span className="metric-value">{metrics.totalTraders}</span>
          <span className="metric-sub">Across 5 Mumbai Bazaars</span>
        </div>

        <div className="metric-box highlight-pending">
          <span className="metric-label">PENDING DISPUTES</span>
          <span className="metric-value">{metrics.pendingComplaints}</span>
          <span className="metric-sub">Awaiting Arbitrator Findings</span>
        </div>

        <div className="metric-box highlight-frozen">
          <span className="metric-label">FROZEN MERCHANTS</span>
          <span className="metric-value">{metrics.frozenTraders}</span>
          <span className="metric-sub">Trust Score Locked</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">AVG TRUST SCORE</span>
          <span className="metric-value">{metrics.averageTrustScore || '10.00'}</span>
          <span className="metric-sub">Mumbai Network Health</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">TOTAL DISPUTED</span>
          <span className="metric-value">₹{(Number(metrics.totalDisputedAmount) || 0).toLocaleString('en-IN')}</span>
          <span className="metric-sub">Active Grievance Volume</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveTab('disputes')}
        >
          Arbitration Desk ({complaints.length})
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'merchants' ? 'active' : ''}`}
          onClick={() => setActiveTab('merchants')}
        >
          Merchant Directory ({traders.length})
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          Publish Circular
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security & Access
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="admin-tab-content">
        {activeTab === 'disputes' && (
          <AdminDisputesTab
            complaints={complaints}
            traders={traders}
            complaintFilter={complaintFilter}
            setComplaintFilter={setComplaintFilter}
            handleResolveDispute={handleResolveDispute}
            handleToggleFreeze={handleToggleFreeze}
          />
        )}

        {activeTab === 'merchants' && (
          <AdminMerchantsTab
            traders={traders}
            merchantSearch={merchantSearch}
            setMerchantSearch={setMerchantSearch}
            merchantCluster={merchantCluster}
            setMerchantCluster={setMerchantCluster}
            handleToggleFreeze={handleToggleFreeze}
            handleToggleBadge={handleToggleBadge}
            setAdjustingTrader={setAdjustingTrader}
            setNewScoreVal={setNewScoreVal}
          />
        )}

        {activeTab === 'broadcast' && (
          <AdminCircularsTab
            broadcastTitle={broadcastTitle}
            setBroadcastTitle={setBroadcastTitle}
            broadcastMessage={broadcastMessage}
            setBroadcastMessage={setBroadcastMessage}
            broadcastCluster={broadcastCluster}
            setBroadcastCluster={setBroadcastCluster}
            handleSendBroadcast={handleSendBroadcast}
            isBroadcasting={isBroadcasting}
          />
        )}

        {activeTab === 'security' && (
          <AdminSecurityTab />
        )}
      </div>

      {/* Score Adjustment Modal */}
      {adjustingTrader && (
        <div className="modal-overlay" onClick={() => setAdjustingTrader(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <h3 className="modal-title">Adjust Trust Score</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Override reputation score for <strong>{adjustingTrader.businessName}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label">New Trust Score (0.00 - 10.00)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={newScoreVal}
                onChange={(e) => setNewScoreVal(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="modal-btn-primary"
                style={{ flex: 1 }}
                onClick={handleSaveScore}
              >
                Save Score
              </button>
              <button
                type="button"
                className="modal-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setAdjustingTrader(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
