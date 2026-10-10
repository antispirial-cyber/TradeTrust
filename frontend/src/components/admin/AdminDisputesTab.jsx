import React from 'react';
import { ProofAttachment } from '../common/ProofAttachment';
import { useToast } from '../../context/ToastContext';

export function AdminDisputesTab({
  complaints,
  traders,
  complaintFilter,
  setComplaintFilter,
  handleResolveDispute,
  handleToggleFreeze
}) {
  const { showToast } = useToast();

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'ALL') return true;
    if (complaintFilter === 'PENDING') {
      return c.status === 'ESCALATED_TO_ADMIN';
    }
    if (complaintFilter === 'RETAKE_REQUESTED') {
      return c.status === 'RETAKE_REQUESTED';
    }
    return c.status === complaintFilter;
  });

  return (
    <div className="admin-panel-card">
      <div className="panel-header-row">
        <div>
          <h3 className="panel-heading">Association Dispute Queue</h3>
          <p className="panel-subheading">
            Escalated merchant claims, retake requests, and payment default reports requiring administrative resolution.
          </p>
        </div>

        {/* Filter pills */}
        <div className="filter-pill-group">
          {['ALL', 'PENDING', 'RETAKE_REQUESTED', 'APPROVED', 'REJECTED'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-pill-btn ${complaintFilter === filter ? 'active' : ''}`}
              onClick={() => setComplaintFilter(filter)}
            >
              {filter === 'ALL' ? 'All Disputes' : filter === 'RETAKE_REQUESTED' ? 'Retake Requests' : filter}
            </button>
          ))}
        </div>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="admin-empty-state">
          <p>No disputes matching the selected filter ({complaintFilter}).</p>
        </div>
      ) : (
        <div className="disputes-list">
          {filteredComplaints.map((c) => {
            const isRetakeRequested = c.status === 'RETAKE_REQUESTED';
            const isPending = !isRetakeRequested && c.status === 'ESCALATED_TO_ADMIN';
            const isApproved = c.status === 'APPROVED';
            const isRejected = c.status === 'REJECTED';
            const isRetakeApproved = c.status === 'RETAKE_APPROVED';
            const reportedTraderObj = traders.find(
              (t) => String(t.id || t.traderId) === String(c.reportedId)
            );

            return (
              <div
                key={c.id || c.complaintId}
                className={`dispute-card ${isPending || isRetakeRequested ? 'pending' : ''}`}
              >
                <div className="dispute-card-header">
                  <div className="dispute-parties">
                    <span className="case-id">Case #{c.id || c.complaintId}</span>
                    <span className="party-reporter">
                      Filed by: <strong>{c.reporterName || 'Verified Trader'}</strong> (User ID: {c.reporterId})
                    </span>
                    <span className="party-arrow">&rarr;</span>
                    <span className="party-reported">
                      Trader Card: <strong>{c.reportedName || ('Merchant #' + c.reportedId)}</strong>
                      {c.reportedCluster && <span className="cluster-tag">{c.reportedCluster}</span>}
                      {reportedTraderObj && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color:
                              Number(reportedTraderObj.trustScore) >= 8.5
                                ? '#10B981'
                                : Number(reportedTraderObj.trustScore) >= 6.0
                                ? '#F59E0B'
                                : '#EF4444'
                          }}
                        >
                          Score: {Number(reportedTraderObj.trustScore).toFixed(2)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="dispute-meta-badges">
                    <span className={`status-badge-chip status-${c.status.toLowerCase()}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <span className="disputed-amount">
                      ₹{(Number(c.amountDisputed) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="dispute-body">
                  <p className="dispute-desc">"{c.description}"</p>
                  <div className="dispute-footer-info">
                    <span>Incident Date: {c.incidentDate || 'Recent'}</span>
                    {c.proofPath && (
                      <ProofAttachment
                        proofPath={c.proofPath}
                        fileName={c.proofFileName || `proof_case_${c.id || c.complaintId}.jpg`}
                        label="View Evidence Document"
                      />
                    )}
                  </div>
                </div>

                {/* Retake Request Alert Banner for Admin */}
                {isRetakeRequested && (
                  <div
                    style={{
                      margin: '12px 0',
                      padding: '12px 14px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444', marginBottom: '8px' }}>
                      [Retake Flagged]: The filing user (User ID: {c.reporterId}) has requested to retake/withdraw this complaint.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="action-btn-approve"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleResolveDispute(c.id || c.complaintId, 'RETAKE_APPROVED')}
                      >
                        Approve Retake (Withdraw Complaint & Restore Score)
                      </button>
                      <button
                        type="button"
                        className="action-btn-dismiss"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleResolveDispute(c.id || c.complaintId, 'RETAKE_REJECTED')}
                      >
                        Reject Retake
                      </button>
                    </div>
                  </div>
                )}

                <div className="dispute-actions-toolbar">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="action-btn-approve"
                        onClick={() => handleResolveDispute(c.id || c.complaintId, 'APPROVED')}
                      >
                        Approve Dispute (Deduct Score Penalty)
                      </button>

                      <button
                        type="button"
                        className="action-btn-dismiss"
                        onClick={() => handleResolveDispute(c.id || c.complaintId, 'REJECTED')}
                      >
                        Dismiss Dispute (No Score Penalty)
                      </button>
                    </>
                  ) : !isRetakeRequested ? (
                    <div className="resolved-status-text">
                      {isApproved && 'Resolved by Association: Complaint Approved. Penalty applied to merchant record.'}
                      {isRejected && 'Resolved by Association: Complaint Dismissed. Score restored.'}
                      {isRetakeApproved && 'Resolved by Association: Retake Approved. Complaint withdrawn and score restored.'}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="action-btn-neutral"
                    onClick={() => {
                      const foundTrader = traders.find((t) => String(t.id || t.traderId) === String(c.reportedId));
                      if (foundTrader) {
                        handleToggleFreeze(foundTrader);
                      } else {
                        showToast('Merchant record #' + c.reportedId + ' not found in active directory');
                      }
                    }}
                  >
                    Freeze / Unfreeze Merchant
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
