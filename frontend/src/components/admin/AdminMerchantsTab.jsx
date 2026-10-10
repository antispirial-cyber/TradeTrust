import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '../common/Icons';
import { CLUSTERS } from '../../constants';

const CLUSTER_OPTIONS = ['All', ...CLUSTERS];

export function AdminMerchantsTab({
  traders,
  merchantSearch,
  setMerchantSearch,
  merchantCluster,
  setMerchantCluster,
  handleToggleFreeze,
  handleToggleBadge,
  setAdjustingTrader,
  setNewScoreVal
}) {
  const navigate = useNavigate();

  const filteredMerchants = traders.filter((t) => {
    const q = merchantSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.businessName && t.businessName.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q));

    const matchesCluster =
      merchantCluster === 'All' ||
      merchantCluster === 'All Clusters' ||
      t.cluster === merchantCluster;

    return matchesSearch && matchesCluster;
  });

  return (
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
            {CLUSTER_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Clusters' : c}
              </option>
            ))}
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
                        {(t.photoUrl || t.photoPath) ? (
                          <img src={t.photoUrl || t.photoPath} alt="" className="avatar-img-circle" />
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
                    <div
                      className="score-cell-pill"
                      style={{
                        color: score >= 8.5 ? '#10B981' : score >= 6.0 ? '#F59E0B' : '#EF4444'
                      }}
                    >
                      Score: {score.toFixed(2)}
                    </div>
                  </td>

                  <td>
                    {isFrozen ? (
                      <span className="badge-frozen-tag">FROZEN</span>
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
                      {t.isVerifiedBadge ? '[Verified]' : '+ Verify'}
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
                        Profile
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
  );
}
