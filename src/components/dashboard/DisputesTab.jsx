import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAllComplaints, requestComplaintRetake } from '../../api/complaints';
import './PastRecordsTab.css';

export function DisputesTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retakingId, setRetakingId] = useState(null);

  const loadComplaints = async () => {
    if (!user) return;
    setLoading(false);
    try {
      const res = await getAllComplaints();
      if (res.success && Array.isArray(res.data)) {
        const userIdStr = String(user.id || user.traderId);
        // Show complaints filed by this user or against this user
        const relevant = res.data.filter(c =>
          String(c.reporterId) === userIdStr ||
          String(c.reportedId) === userIdStr ||
          (c.reporterName && user.businessName && c.reporterName.toLowerCase() === user.businessName.toLowerCase()) ||
          (c.reportedName && user.businessName && c.reportedName.toLowerCase() === user.businessName.toLowerCase())
        );
        setComplaints(relevant);
      }
    } catch (err) {
      console.error('[DisputesTab] Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [user]);

  const handleRetake = async (complaintId) => {
    const confirmWithdraw = window.confirm(
      'Are you sure you want to request a retake (withdrawal) of this complaint? This will flag the complaint to the Market Association Administrator for approval.'
    );
    if (!confirmWithdraw) return;

    setRetakingId(complaintId);
    try {
      const res = await requestComplaintRetake(complaintId);
      if (res.success) {
        showToast(res.message || 'Retake request submitted to Market Association Admin.');
        await loadComplaints();
      } else {
        alert(res.message || 'Failed to submit retake request.');
      }
    } catch (err) {
      alert('Error requesting retake: ' + err.message);
    } finally {
      setRetakingId(null);
    }
  };

  if (loading) {
    return <div className="past-records-empty">Loading merchant arbitration records...</div>;
  }

  const userIdStr = String(user?.id || user?.traderId);
  const myFiledComplaints = complaints.filter(c =>
    String(c.reporterId) === userIdStr ||
    (c.reporterName && user?.businessName && c.reporterName.toLowerCase() === user.businessName.toLowerCase())
  );
  const complaintsAgainstMe = complaints.filter(c =>
    String(c.reportedId) === userIdStr ||
    (c.reportedName && user?.businessName && c.reportedName.toLowerCase() === user.businessName.toLowerCase())
  );

  return (
    <div className="disputes-tab-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: Complaints Filed By Me */}
      <div className="disputes-section">
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Complaints Filed by You ({myFiledComplaints.length})
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Grievances you have lodged against trade partners. You may submit a retake request to withdraw a claim, subject to Association Admin approval.
        </p>

        {myFiledComplaints.length === 0 ? (
          <div className="past-records-empty" style={{ padding: '24px' }}>
            <p>You have not filed any trade complaints.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myFiledComplaints.map((c) => {
              const isRetakeRequested = c.status === 'RETAKE_REQUESTED';
              const isRetakeApproved = c.status === 'RETAKE_APPROVED';
              const canRetake = !isRetakeRequested && !isRetakeApproved;

              return (
                <div
                  key={c.id || c.complaintId}
                  className="past-record-card"
                  style={{ border: isRetakeRequested ? '1px solid #EF4444' : undefined }}
                >
                  <div className="past-record-top">
                    <span className="past-record-status" style={{
                      background: isRetakeRequested ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 111, 251, 0.12)',
                      color: isRetakeRequested ? '#EF4444' : 'var(--accent-color)'
                    }}>
                      Case #{c.id || c.complaintId} • Status: {c.status.replace(/_/g, ' ')}
                    </span>
                    <span className="past-record-date">Incident: {c.incidentDate}</span>
                  </div>

                  <div style={{ margin: '8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Against Trader Card: <strong>{c.reportedName || ('Merchant #' + c.reportedId)}</strong>
                  </div>

                  <div className="past-record-amount">
                    Disputed Amount: ₹{Number(c.amountDisputed || 0).toLocaleString('en-IN')}
                  </div>

                  <p className="past-record-desc">{c.description}</p>

                  <div className="past-record-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      {c.proofPath && (
                        <a
                          href={c.proofPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-color)', textDecoration: 'underline', marginRight: '12px' }}
                        >
                          [View Attached File]
                        </a>
                      )}
                      <span>Filed: {c.createdAt ? String(c.createdAt).split('T')[0] : 'Recent'}</span>
                    </div>

                    {canRetake && (
                      <button
                        type="button"
                        className="modal-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#EF4444', color: '#EF4444' }}
                        onClick={() => handleRetake(c.id || c.complaintId)}
                        disabled={retakingId === (c.id || c.complaintId)}
                      >
                        {retakingId === (c.id || c.complaintId) ? 'Requesting Retake...' : 'Retake Complaint'}
                      </button>
                    )}

                    {isRetakeRequested && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444' }}>
                        [Retake Flagged: Awaiting Admin Approval]
                      </span>
                    )}

                    {isRetakeApproved && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>
                        [Retake Approved: Complaint Withdrawn]
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Complaints Against Me */}
      <div className="disputes-section">
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Complaints Involving Your Account ({complaintsAgainstMe.length})
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Disputes raised by other wholesale or retail bazaar traders against your business profile.
        </p>

        {complaintsAgainstMe.length === 0 ? (
          <div className="past-records-empty" style={{ padding: '24px' }}>
            <p>Clean Record. No open complaints on file against your account.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {complaintsAgainstMe.map((c) => (
              <div key={c.id || c.complaintId} className="past-record-card">
                <div className="past-record-top">
                  <span className="past-record-status">
                    Case #{c.id || c.complaintId} • Status: {c.status.replace(/_/g, ' ')}
                  </span>
                  <span className="past-record-date">Incident: {c.incidentDate}</span>
                </div>

                <div style={{ margin: '8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Filed by: <strong>{c.reporterName || 'Verified Trader'}</strong> (User ID: {c.reporterId})
                </div>

                <div className="past-record-amount">
                  Disputed Amount: ₹{Number(c.amountDisputed || 0).toLocaleString('en-IN')}
                </div>

                <p className="past-record-desc">{c.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
