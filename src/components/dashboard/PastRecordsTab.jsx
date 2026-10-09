import React, { useState, useEffect } from 'react';
import { CheckIcon } from '../common/Icons';
import { getComplaintsByTrader } from '../../api/complaints';
import './PastRecordsTab.css';

export function PastRecordsTab({ traderId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      if (traderId) {
        const res = await getComplaintsByTrader(traderId);
        if (res.success) {
          setRecords(res.data);
        }
      }
      setLoading(false);
    }
    loadRecords();

    const handleUpdate = () => {
      loadRecords();
    };

    window.addEventListener('tradetrust_complaints_updated', handleUpdate);
    window.addEventListener('tradetrust_score_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('tradetrust_complaints_updated', handleUpdate);
      window.removeEventListener('tradetrust_score_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [traderId]);

  if (loading) {
    return <div className="past-records-empty">Loading verified history...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="past-records-empty">
        <div className="past-records-clean-badge">
          <CheckIcon size={16} />
          <span>Clean Record</span>
        </div>
        <h4>No verified records on file.</h4>
        <p style={{ marginTop: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          This trader has zero approved complaints or default judgments recorded on TradeTrust.
        </p>
      </div>
    );
  }

  return (
    <div className="past-records-container">
      {records.map((record) => (
        <div key={record.id} className="past-record-card">
          <div className="past-record-top">
            <span className="past-record-status">Verified Default Finding</span>
            <span className="past-record-date">Incident: {record.incidentDate}</span>
          </div>

          <div className="past-record-amount">
            Disputed Amount: ₹{Number(record.amountDisputed).toLocaleString('en-IN')}
          </div>

          <p className="past-record-desc">{record.description}</p>

          <div className="past-record-meta">
            Filed by: {record.reporterName} • Verdict Date: {record.verdictDate || 'Resolved by Market Association'}
          </div>
        </div>
      ))}
    </div>
  );
}
