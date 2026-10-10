import React, { useState, useEffect } from 'react';
import { getScoreBreakdown } from '../../api/traders';
import { ScoreRing } from '../common/ScoreRing';
import { CloseIcon } from '../common/Icons';
import './ComplaintModal.css';

export function ScoreBreakdownModal({ isOpen, onClose, traderId, traderName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');

    getScoreBreakdown(traderId)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load score metrics');
        }
      })
      .catch((err) => {
        setError(err.message || 'Error fetching score breakdown');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, traderId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Trust Score Breakdown</h3>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Formula & behavior metrics for {traderName || data?.traderName || 'Merchant'}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
              Calculating behavioral trust metrics...
            </div>
          ) : error ? (
            <div style={{ color: 'var(--danger-color)', padding: 'var(--space-md)' }}>{error}</div>
          ) : data ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <ScoreRing score={data.storedTrustScore || data.calculatedTrustScore} size={70} />
                <div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                    {(Number(data.storedTrustScore) || Number(data.calculatedTrustScore) || 10).toFixed(2)} / 10.00
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {data.scoreFrozen ? 'Status: Frozen under active arbitration' : 'Status: Live dynamic calculation'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Base Baseline Score</span>
                  <span style={{ fontWeight: 600 }}>+10.00</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>
                    Approved Complaints Penalty
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {data.approvedComplaintsCount} dispute(s) with tiered penalty
                    </div>
                  </span>
                  <span style={{ fontWeight: 600, color: data.complaintsPenalty > 0 ? '#ef4444' : 'inherit' }}>
                    {data.complaintsPenalty > 0 ? `-${Number(data.complaintsPenalty).toFixed(2)}` : '0.00'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>
                    Paid Ledger Bonus
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {data.paidEntriesCount} completed payment(s) (+0.10 each)
                    </div>
                  </span>
                  <span style={{ fontWeight: 600, color: data.paidBonus > 0 ? '#10b981' : 'inherit' }}>
                    {data.paidBonus > 0 ? `+${Number(data.paidBonus).toFixed(2)}` : '0.00'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>
                    Overdue Credit Penalty
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {data.overdueEntriesCount} overdue record(s) (-0.50 each)
                    </div>
                  </span>
                  <span style={{ fontWeight: 600, color: data.overduePenalty > 0 ? '#ef4444' : 'inherit' }}>
                    {data.overduePenalty > 0 ? `-${Number(data.overduePenalty).toFixed(2)}` : '0.00'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>
                    Bazaar Network Boost
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {data.connectionsCount} accepted connection(s) (+0.05 each)
                    </div>
                  </span>
                  <span style={{ fontWeight: 600, color: data.connectionsBonus > 0 ? '#10b981' : 'inherit' }}>
                    {data.connectionsBonus > 0 ? `+${Number(data.connectionsBonus).toFixed(2)}` : '0.00'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'rgba(30, 111, 251, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                Mathematical limits: Raw score is clamped between 0.00 and 10.00. Verified Badge is awarded when score ≥ 7.00 with 0 approved complaints.
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', padding: 'var(--space-md) var(--space-xl)' }}>
          <button type="button" className="modal-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
