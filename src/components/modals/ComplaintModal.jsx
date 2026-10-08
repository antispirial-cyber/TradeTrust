import React, { useState, useRef } from 'react';
import { CloseIcon, CheckIcon, UploadCloudIcon } from '../common/Icons';
import { fileComplaint } from '../../api/complaints';
import { uploadEvidenceFile } from '../../utils/fileUpload';
import { useToast } from '../../context/ToastContext';
import './ComplaintModal.css';

export function ComplaintModal({ reportedTrader, onClose, onSubmitSuccess }) {
  const { showComingSoon } = useToast();
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [amountDisputed, setAmountDisputed] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!description.trim() || !amountDisputed) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let uploadedPath = null;
      if (selectedFile) {
        uploadedPath = await uploadEvidenceFile(selectedFile);
      }

      const res = await fileComplaint({
        reportedId: reportedTrader.id || reportedTrader.traderId,
        reportedName: reportedTrader.businessName || reportedTrader.name,
        reportedCluster: reportedTrader.cluster,
        description,
        amountDisputed,
        incidentDate,
        proofFileName: selectedFile ? selectedFile.name : null,
        proofPath: uploadedPath || (selectedFile ? selectedFile.name : null)
      });
      if (res.success) {
        setIsSubmitted(true);
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        alert(res.message || 'Failed to submit complaint');
      }
    } catch (err) {
      alert('Error submitting complaint: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isSubmitted ? 'Complaint Lodged' : `Report ${reportedTrader.businessName}`}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {!isSubmitted && (
          <div className="modal-steps">
            <div className={`modal-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="modal-step-circle">{step > 1 ? <CheckIcon size={12} /> : '1'}</div>
              <span>Details</span>
            </div>
            <div className={`modal-step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="modal-step-circle">{step > 2 ? <CheckIcon size={12} /> : '2'}</div>
              <span>Evidence</span>
            </div>
            <div className={`modal-step-item ${step === 3 ? 'active' : ''}`}>
              <div className="modal-step-circle">3</div>
              <span>Review</span>
            </div>
          </div>
        )}

        <div className="modal-body">
          {isSubmitted ? (
            <div className="modal-confirmation">
              <div className="modal-confirm-icon">
                <CheckIcon size={28} />
              </div>
              <h4>Complaint Received</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '380px' }}>
                We will review it. The trader's score has been temporarily frozen pending mutual counter-exchange and admin review.
              </p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Disputed Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={amountDisputed}
                      onChange={(e) => setAmountDisputed(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incident Date</label>
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Complaint Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Detail the unpaid credit amount, invoice terms, invoice number, or goods dispute..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <div>
                  <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                    Upload Trade Proof (JPG, PNG, or PDF — Max 5MB)
                  </label>
                  <div
                    className="modal-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                    />
                    <div className="modal-dropzone-icon">
                      <UploadCloudIcon size={36} />
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      Drag and drop trade challan, invoice copy, or WhatsApp ledger record
                    </span>
                    {selectedFile && (
                      <span className="modal-file-selected" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckIcon size={14} /> {selectedFile.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="modal-summary-box">
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Reported Trader:</span>
                    <span className="modal-summary-value">{reportedTrader.businessName}</span>
                  </div>
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Disputed Amount:</span>
                    <span className="modal-summary-value font-mono">₹{Number(amountDisputed).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Incident Date:</span>
                    <span className="modal-summary-value">{incidentDate}</span>
                  </div>
                  <div className="modal-summary-row">
                    <span className="modal-summary-label">Proof Document:</span>
                    <span className="modal-summary-value font-mono">
                      {selectedFile ? selectedFile.name : 'Attached invoice voucher'}
                    </span>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span className="modal-summary-label">Description Summary:</span>
                    <p style={{ marginTop: '4px', color: 'var(--text-primary)', fontSize: 'var(--text-xs)' }}>
                      {description}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {isSubmitted ? (
            <button
              type="button"
              className="modal-btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={onClose}
            >
              Done
            </button>
          ) : (
            <>
              {step > 1 ? (
                <button type="button" className="modal-btn-secondary" onClick={handleBack}>
                  Back
                </button>
              ) : (
                <button type="button" className="modal-btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="modal-btn-primary"
                  onClick={handleNext}
                  disabled={step === 1 && (!description.trim() || !amountDisputed)}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="modal-btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
