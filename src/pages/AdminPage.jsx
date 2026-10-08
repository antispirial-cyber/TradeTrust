import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAdminMetrics, resolveDispute, toggleTraderFreeze, toggleTraderVerified, setTraderCustomScore, broadcastNotice } from '../api/admin';
import { getAllComplaints } from '../api/complaints';
import { getTraders } from '../api/traders';
import { ShieldIcon, GavelIcon, SearchIcon, CheckIcon, LogOutIcon } from '../components/common/Icons';
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
  const [complaintFilter, setComplaintFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
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

  // Quick Login Form state for unauthorized visits
  const [authUsername, setAuthUsername] = useState('Admin');
  const [authPassword, setAuthPassword] = useState('tradetrust');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleAdminGateLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await login({ phone: authUsername, password: authPassword });
      if (res.success && res.data?.role === 'ADMIN') {
        showToast('Welcome, Market Association Administrator!');
      } else {
        alert(res.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResolveDispute = async (complaintId, verdict) => {
    const confirmMsg = verdict === 'APPROVED'
      ? `Are you sure you want to APPROVE Dispute #${complaintId}? This will deduct trust score from the reported merchant.`
      : `Dismiss Dispute #${complaintId} without score penalty?`;

    if (!window.confirm(confirmMsg)) return;

    const res = await resolveDispute(complaintId, verdict);
    if (res.success) {
      showToast(res.message || `Dispute #${complaintId} resolved: ${verdict}`);
      await loadAdminData();
    } else {
      alert(res.message || 'Failed to update dispute');
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
      await loadAdminData();
    }
  };

  const handleToggleBadge = async (trader) => {
    const nextBadge = !trader.isVerifiedBadge;
    const res = await toggleTraderVerified(trader.id || trader.traderId, nextBadge);
    if (res.success) {
      showToast(`Verification badge ${nextBadge ? 'granted to' : 'removed from'} ${trader.businessName}`);
      await loadAdminData();
    }
  };

  const handleSaveScore = async () => {
    if (!adjustingTrader) return;
    const num = parseFloat(newScoreVal);
    if (isNaN(num) || num < 0 || num > 10) {
      alert('Score must be between 0.00 and 10.00');
      return;
    }
    const res = await setTraderCustomScore(adjustingTrader.id || adjustingTrader.traderId, num);
    if (res.success) {
      showToast(`${adjustingTrader.businessName} score adjusted to ${num.toFixed(2)}`);
      setAdjustingTrader(null);
      await loadAdminData();
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
            <ShieldIcon size={44} color="var(--accent-blue)" />
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
                placeholder="Admin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Passkey</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                placeholder="tradetrust"
              />
            </div>

            <button type="submit" className="admin-gate-btn" disabled={authLoading}>
              {authLoading ? 'Verifying Credentials...' : 'Sign In as Administrator'}
            </button>
          </form>

          <div className="admin-gate-quick">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Universal Access Credentials:</span>
            <div className="admin-creds-badge">
              <code>Username: <strong>Admin</strong></code>
              <code>Password: <strong>tradetrust</strong></code>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              ℹ️ Hardcoded across all devices and web deployments. All previous legacy admin accounts have been purged.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    if (complaintFilter === 'ALL') return true;
    if (complaintFilter === 'PENDING') {
      return c.status === 'ESCALATED_TO_ADMIN' || c.status === 'ROUND_1_PENDING' || c.status === 'ROUND_2_PENDING';
    }
    return c.status === complaintFilter;
  });

  // Filter merchants
  const filteredMerchants = traders.filter(t => {
    const q = merchantSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.businessName && t.businessName.toLowerCase().includes(q)) ||
      (t.phone && String(t.phone).includes(q));

    const matchesCluster = merchantCluster === 'All' || t.cluster === merchantCluster;
    return matchesSearch && matchesCluster;
  });

  return (
    <div className="admin-page-container">
      {/* Top Banner Header */}
      <div className="admin-header-card">
        <div className="admin-header-left">
          <div className="admin-badge-strip">
            <span className="admin-badge-pill">
              <ShieldIcon size={14} /> Association Panel Desk
            </span>
            <span className="admin-status-indicator">
              <span className="status-dot-pulse" /> Active Session
            </span>
          </div>
          <h1 className="admin-title">TradeTrust Administration & Arbitration</h1>
          <p className="admin-subtitle">
            South Mumbai Bazaars • Dispute Resolution • Trust Score Auditing • Merchant Registry
          </p>
        </div>

        <div className="admin-header-right">
          <div className="admin-user-pill">
            <div className="admin-avatar-small">A</div>
            <div>
              <div className="admin-user-name">Authorized Official: Admin</div>
              <div className="admin-user-role">Association Administrator</div>
            </div>
          </div>

          <div className="admin-actions-bar">
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => navigate('/browse')}
            >
              Public Bazaar
            </button>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleAdminLogout}
              title="Sign Out Admin"
            >
              <LogOutIcon size={16} /> Exit Admin
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-header">
            <span className="metric-title">Registered Merchants</span>
            <span className="metric-icon">🏪</span>
          </div>
          <div className="metric-value">{metrics.totalTraders || traders.length}</div>
          <div className="metric-caption">Across 5 Mumbai Bazaars</div>
        </div>

        <div className="admin-metric-card alert">
          <div className="metric-header">
            <span className="metric-title">Pending Arbitration</span>
            <span className="metric-icon">⚖️</span>
          </div>
          <div className="metric-value">{metrics.pendingComplaints}</div>
          <div className="metric-caption">Awaiting Association Verdict</div>
        </div>

        <div className="admin-metric-card warning">
          <div className="metric-header">
            <span className="metric-title">Frozen Scores</span>
            <span className="metric-icon">❄️</span>
          </div>
          <div className="metric-value">{metrics.frozenTraders}</div>
          <div className="metric-caption">Merchants Restricted Under Review</div>
        </div>

        <div className="admin-metric-card success">
          <div className="metric-header">
            <span className="metric-title">Average Bazaar Trust</span>
            <span className="metric-icon">⭐</span>
          </div>
          <div className="metric-value">{metrics.averageTrustScore || '8.40'} / 10</div>
          <div className="metric-caption">Cluster Health Benchmark</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveTab('disputes')}
        >
          <GavelIcon size={16} />
          <span>Arbitration Desk ({complaints.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'merchants' ? 'active' : ''}`}
          onClick={() => setActiveTab('merchants')}
        >
          <span>🏪 Merchant Registry ({traders.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          <span>📢 Association Circulars</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <ShieldIcon size={16} />
          <span>Security & Credentials</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="admin-tab-content">
        {/* TAB 1: ARBITRATION & DISPUTES */}
        {activeTab === 'disputes' && (
          <div className="admin-panel-card">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-heading">Association Dispute Queue</h3>
                <p className="panel-subheading">
                  Escalated merchant claims and payment default reports requiring administrative resolution.
                </p>
              </div>

              {/* Filter pills */}
              <div className="filter-pill-group">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`filter-pill-btn ${complaintFilter === filter ? 'active' : ''}`}
                    onClick={() => setComplaintFilter(filter)}
                  >
                    {filter === 'ALL' ? 'All Disputes' : filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="admin-empty-state">
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚖️</div>
                <p>No disputes matching the selected filter ({complaintFilter}).</p>
              </div>
            ) : (
              <div className="disputes-list">
                {filteredComplaints.map((c) => {
                  const isPending = c.status === 'ESCALATED_TO_ADMIN' || c.status === 'ROUND_1_PENDING' || c.status === 'ROUND_2_PENDING';
                  const isApproved = c.status === 'APPROVED';
                  const isRejected = c.status === 'REJECTED';

                  return (
                    <div key={c.id || c.complaintId} className={`dispute-card ${isPending ? 'pending' : ''}`}>
                      <div className="dispute-card-header">
                        <div className="dispute-parties">
                          <span className="case-id">Case #{c.id || c.complaintId}</span>
                          <span className="party-reporter">Filing Party: <strong>{c.reporterName || 'Verified Trader'}</strong></span>
                          <span className="party-arrow">➔</span>
                          <span className="party-reported">
                            Reported: <strong>{c.reportedName || ('Merchant #' + c.reportedId)}</strong>
                            {c.reportedCluster && <span className="cluster-tag">{c.reportedCluster}</span>}
                          </span>
                        </div>

                        <div className="dispute-meta-badges">
                          <span className={`status-badge-chip status-${c.status.toLowerCase()}`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                          <span className="disputed-amount">₹{(Number(c.amountDisputed) || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="dispute-body">
                        <p className="dispute-desc">"{c.description}"</p>
                        <div className="dispute-footer-info">
                          <span>Incident Date: {c.incidentDate || 'Recent'}</span>
                          {c.proofPath && <span>Evidence Document: 📎 {c.proofPath}</span>}
                          {c.verdictDate && <span>Verdict Logged: {c.verdictDate}</span>}
                        </div>
                      </div>

                      <div className="dispute-actions-row">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              className="action-btn-approve"
                              onClick={() => handleResolveDispute(c.id || c.complaintId, 'APPROVED')}
                            >
                              ✅ Approve Complaint (Deduct Trust Score)
                            </button>
                            <button
                              type="button"
                              className="action-btn-reject"
                              onClick={() => handleResolveDispute(c.id || c.complaintId, 'REJECTED')}
                            >
                              ❌ Dismiss / Reject Claim
                            </button>
                          </>
                        ) : (
                          <div className="resolved-status-text">
                            {isApproved && '✅ Resolved by Association: Complaint Approved. Penalty applied to merchant record.'}
                            {isRejected && '🛡️ Resolved by Association: Complaint Dismissed. Score restored.'}
                          </div>
                        )}

                        <button
                          type="button"
                          className="action-btn-neutral"
                          onClick={() => {
                            const foundTrader = traders.find(t => String(t.id || t.traderId) === String(c.reportedId));
                            if (foundTrader) {
                              handleToggleFreeze(foundTrader);
                            } else {
                              showToast('Score toggle sent for Merchant #' + c.reportedId);
                            }
                          }}
                        >
                          ❄️ Freeze / Unfreeze Merchant
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MERCHANTS & SCORE GOVERNANCE */}
        {activeTab === 'merchants' && (
          <div className="admin-panel-card">
            <div className="panel-header-row">
              <div>
                <h3 className="panel-heading">Merchant Registry & Score Governance</h3>
                <p className="panel-subheading">
                  Supervise bazaar merchants, adjust scores, grant verified association badges, or freeze defaulting profiles.
                </p>
              </div>

              {/* Cluster and Search Filters */}
              <div className="merchant-controls-bar">
                <div className="search-input-wrapper">
                  <SearchIcon size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search merchant, shop, phone..."
                    value={merchantSearch}
                    onChange={(e) => setMerchantSearch(e.target.value)}
                  />
                </div>

                <select
                  className="cluster-select"
                  value={merchantCluster}
                  onChange={(e) => setMerchantCluster(e.target.value)}
                >
                  <option value="All">All Clusters</option>
                  <option value="Zaveri Bazaar">Zaveri Bazaar</option>
                  <option value="Dadar Market">Dadar Market</option>
                  <option value="Mangaldas Market">Mangaldas Market</option>
                  <option value="Lamington Road">Lamington Road</option>
                  <option value="Crawford Market">Crawford Market</option>
                </select>
              </div>
            </div>

            <div className="merchants-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Merchant / Business</th>
                    <th>Cluster & Sector</th>
                    <th>Phone</th>
                    <th>Trust Score</th>
                    <th>Status</th>
                    <th>Association Badge</th>
                    <th>Administrative Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMerchants.map((t) => {
                    const isFrozen = t.scoreFrozen || t.isScoreFrozen;
                    const score = Number(t.trustScore) || 0;

                    return (
                      <tr key={t.id || t.traderId} className={isFrozen ? 'row-frozen' : ''}>
                        <td>
                          <div className="merchant-cell-name">
                            <div className="merchant-cell-avatar">
                              {t.photoUrl ? (
                                <img src={t.photoUrl} alt="" className="avatar-img-circle" />
                              ) : (
                                t.initial || t.name?.[0] || 'T'
                              )}
                            </div>
                            <div>
                              <div className="merchant-bold-name">{t.businessName || t.name}</div>
                              <div className="merchant-sub-name">{t.name} ({t.role})</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="cluster-tag">{t.cluster}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.sector}</div>
                        </td>

                        <td>
                          <code style={{ fontSize: '12px' }}>{t.phone}</code>
                        </td>

                        <td>
                          <div className="score-cell-pill" style={{
                            color: score >= 8.5 ? '#10B981' : score >= 6.0 ? '#F59E0B' : '#EF4444'
                          }}>
                            ★ {score.toFixed(2)}
                          </div>
                        </td>

                        <td>
                          {isFrozen ? (
                            <span className="badge-frozen-tag">❄️ FROZEN</span>
                          ) : (
                            <span className="badge-active-tag">Active</span>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`badge-toggle-btn ${t.isVerifiedBadge ? 'verified' : 'unverified'}`}
                            onClick={() => handleToggleBadge(t)}
                            title="Click to toggle association verification"
                          >
                            {t.isVerifiedBadge ? '✓ Verified' : '+ Verify'}
                          </button>
                        </td>

                        <td>
                          <div className="table-actions-inline">
                            <button
                              type="button"
                              className={`action-btn-freeze ${isFrozen ? 'unfreeze' : 'freeze'}`}
                              onClick={() => handleToggleFreeze(t)}
                              title={isFrozen ? 'Unfreeze score' : 'Freeze score'}
                            >
                              {isFrozen ? 'Unfreeze' : 'Freeze'}
                            </button>

                            <button
                              type="button"
                              className="action-btn-score"
                              onClick={() => {
                                setAdjustingTrader(t);
                                setNewScoreVal(score.toFixed(2));
                              }}
                              title="Override Trust Score"
                            >
                              Adjust Score
                            </button>

                            <button
                              type="button"
                              className="action-btn-view"
                              onClick={() => navigate(`/profile/${t.id || t.traderId}`)}
                              title="View Trader Public Registry Card"
                            >
                              Profile ↗
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ASSOCIATION CIRCULARS / BROADCASTS */}
        {activeTab === 'broadcast' && (
          <div className="admin-panel-card">
            <h3 className="panel-heading">Publish Association Circular</h3>
            <p className="panel-subheading">
              Dispatch an official market advisory, holiday settlement schedule, or default alert directly to all Mumbai traders' notification centres.
            </p>

            <form className="broadcast-form" onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label className="form-label">Target Market Cluster</label>
                <select
                  className="form-select"
                  value={broadcastCluster}
                  onChange={(e) => setBroadcastCluster(e.target.value)}
                >
                  <option value="All Clusters">All Bazaars (City-wide Broadcast)</option>
                  <option value="Zaveri Bazaar">Zaveri Bazaar</option>
                  <option value="Dadar Market">Dadar Market</option>
                  <option value="Mangaldas Market">Mangaldas Market</option>
                  <option value="Lamington Road">Lamington Road</option>
                  <option value="Crawford Market">Crawford Market</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Advisory Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory 30-Day Credit Limit Notice for Festive Season"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Circular Message Body</label>
                <textarea
                  className="form-textarea"
                  placeholder="Provide precise details, association directives, or arbitration warnings..."
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="admin-gate-btn" style={{ maxWidth: '280px' }} disabled={isBroadcasting}>
                {isBroadcasting ? 'Broadcasting...' : '📢 Publish Circular to All Traders'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SECURITY & CREDENTIALS */}
        {activeTab === 'security' && (
          <div className="admin-panel-card">
            <h3 className="panel-heading">System Security & Access Credentials</h3>
            <p className="panel-subheading">
              Universal hardcoded credentials active across all devices, mobile screens, and static deployments.
            </p>

            <div className="security-info-grid">
              <div className="security-card">
                <h4>Active Administrator Credential</h4>
                <div className="creds-detail-row">
                  <span>Username:</span>
                  <code>Admin</code>
                </div>
                <div className="creds-detail-row">
                  <span>Password:</span>
                  <code>tradetrust</code>
                </div>
                <div className="creds-detail-row">
                  <span>Role:</span>
                  <span className="role-chip">ADMIN (Market Association Desk)</span>
                </div>
                <div className="creds-detail-row">
                  <span>Multi-Device Accessibility:</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>Enabled on all devices</span>
                </div>
              </div>

              <div className="security-card">
                <h4>Legacy Accounts Purge</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  All previous admin credentials (including old seed accounts using <code>password123</code>) have been completely removed from both the client codebase and backend database schema.
                </p>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', fontWeight: 600 }}>
                  <CheckIcon size={16} /> Single universal Admin active
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Adjustment Modal */}
      {adjustingTrader && (
        <div className="modal-overlay" onClick={() => setAdjustingTrader(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
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
