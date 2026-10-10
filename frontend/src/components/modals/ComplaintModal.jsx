import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon, CheckIcon, UploadCloudIcon } from '../common/Icons';
import { fileComplaint } from '../../api/complaints';
import { uploadFile, formatFileSize } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './ComplaintModal.css';

export function ComplaintModal({ reportedTrader, onClose, onSubmitSuccess }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [amountDisputed, setAmountDisputed] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleProcessFile = (file) => {
    setFileError(null);
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      setFileError('Please select a valid image (PNG, JPG, WEBP) or PDF invoice document.');
      return;
    }

    // Validate size limit (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File exceeds 10MB limit. Please attach a compressed photo or document.');
      return;
    }

    // Revoke old object URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
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
    setSubmissionStatus('Uploading evidence file...');
    try {
      let uploadedPath = null;
      if (selectedFile) {
        try {
          const uploadRes = await uploadFile(selectedFile);
          uploadedPath = uploadRes.url;
        } catch (uploadErr) {
          showToast('Failed to upload evidence file: ' + uploadErr.message);
          setIsSubmitting(false);
          setSubmissionStatus('');
          return;
        }
      }

      setSubmissionStatus('Filing complaint to Association Desk...');
      const res = await fileComplaint({
        reportedId: reportedTrader.id || reportedTrader.traderId,
        reportedName: reportedTrader.businessName || reportedTrader.name,
        reportedCluster: reportedTrader.cluster,
        description,
        amountDisputed,
        incidentDate,
        proofFileName: selectedFile ? selectedFile.name : null,
        proofPath: uploadedPath || null
      });
      if (res.success) {
        setIsSubmitted(true);
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        showToast(res.message || 'Failed to submit complaint');
      }
    } catch (err) {
      showToast('Error submitting complaint: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus('');
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
                We will review it. The trader's score has been temporarily frozen pending Association Admin review.
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
                    Upload Trade Proof (JPG, PNG, or PDF - Max 10MB)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf"
                    onChange={handleFileChange}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {!selectedFile ? (
                    <div
                      className={`modal-dropzone ${isDragging ? 'dragging' : ''}`}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="modal-dropzone-icon">
                        <UploadCloudIcon size={38} />
                      </div>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {isDragging ? 'Drop proof document here...' : 'Click to select or drag and drop proof image'}
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Trade challan, GST tax invoice, stamped delivery note, or payment ledger voucher
                      </span>
                    </div>
                  ) : (
                    <div className="modal-proof-card">
                      <div className="modal-proof-thumb-box">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Evidence preview" className="modal-proof-thumb-img" />
                        ) : (
                          <div className="modal-proof-pdf-badge">
                            <span style={{ fontSize: '11px', fontWeight: 700 }}>PDF</span>
                            <span>DOC</span>
                          </div>
                        )}
                      </div>

                      <div className="modal-proof-details">
                        <div className="modal-proof-filename" title={selectedFile.name}>
                          {selectedFile.name}
                        </div>
                        <div className="modal-proof-meta">
                          <span>{formatFileSize(selectedFile.size)}</span>
                          <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>Attached</span>
                        </div>
                      </div>

                      <div className="modal-proof-actions">
                        <button
                          type="button"
                          className="modal-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="modal-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                          onClick={handleRemoveFile}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {fileError && <div className="modal-file-error">{fileError}</div>}
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
                  <div className="modal-summary-row" style={{ alignItems: 'center' }}>
                    <span className="modal-summary-label">Proof Document:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Proof preview"
                          style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                      )}
                      <span className="modal-summary-value font-mono" style={{ fontSize: '12px' }}>
                        {selectedFile ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})` : 'None attached'}
                      </span>
                    </div>
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
                <button type="button" className="modal-btn-secondary" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </button>
              ) : (
                <button type="button" className="modal-btn-secondary" onClick={onClose} disabled={isSubmitting}>
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
                  {isSubmitting ? (submissionStatus || 'Submitting...') : 'Submit Complaint'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
