import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, CloseIcon, UploadCloudIcon } from './Icons';
import './CourseworkPortfolio.css';

const STORAGE_KEY = 'tradetrust_coursework_submissions';

const DEFAULT_SUBMISSIONS = [
  {
    id: 'sub-exp-1',
    type: 'EXPERIMENT',
    title: 'Experiment 1: Problem Identification & Informal Credit in Mumbai Bazaars',
    fileName: null,
    pdfUrl: null,
    date: '2026-10-01'
  },
  {
    id: 'sub-exp-2',
    type: 'EXPERIMENT',
    title: 'Experiment 2: Value Proposition & Merchant Persona Validation',
    fileName: null,
    pdfUrl: null,
    date: '2026-10-02'
  },
  {
    id: 'sub-assign-1',
    type: 'ASSIGNMENT',
    title: 'Assignment 1: Field Study & Market Cluster Survey (Zaveri Bazaar)',
    fileName: null,
    pdfUrl: null,
    date: '2026-10-03'
  }
];

export function CourseworkPortfolio() {
  const [isOpen, setIsOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [activeViewerId, setActiveViewerId] = useState(null);

  // Modal State for adding new submission
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subType, setSubType] = useState('EXPERIMENT');
  const [subTitle, setSubTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // File replacement reference
  const replaceInputRef = useRef(null);
  const [replacingId, setReplacingId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSubmissions(JSON.parse(stored));
        return;
      } catch {}
    }
    setSubmissions(DEFAULT_SUBMISSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBMISSIONS));
  }, []);

  const saveSubmissions = (newList) => {
    setSubmissions(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  const uploadFileToServer = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.data && data.data.url) {
        return data.data.url;
      }
    } catch (e) {
      console.warn('Backend upload fallback to local dataURL:', e);
    }

    // Fallback: Read as Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    if (!subTitle.trim()) return;

    setIsUploading(true);
    let pdfUrl = null;
    let fileName = null;

    if (selectedFile) {
      fileName = selectedFile.name;
      pdfUrl = await uploadFileToServer(selectedFile);
    }

    const newItem = {
      id: `sub-${Date.now()}`,
      type: subType,
      title: subTitle.trim(),
      fileName,
      pdfUrl,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [...submissions, newItem];
    saveSubmissions(updated);

    setIsAddModalOpen(false);
    setSubTitle('');
    setSelectedFile(null);
    setIsUploading(false);

    if (pdfUrl) {
      setActiveViewerId(newItem.id);
      setIsOpen(true);
    }
  };

  const handleDeleteSubmission = (id) => {
    if (window.confirm('Delete this submission?')) {
      const filtered = submissions.filter((s) => s.id !== id);
      saveSubmissions(filtered);
      if (activeViewerId === id) setActiveViewerId(null);
    }
  };

  const handleOpenReplace = (id) => {
    setReplacingId(id);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const handleFileReplaced = async (e) => {
    if (e.target.files && e.target.files[0] && replacingId) {
      const file = e.target.files[0];
      const pdfUrl = await uploadFileToServer(file);
      const updated = submissions.map((s) =>
        s.id === replacingId ? { ...s, fileName: file.name, pdfUrl } : s
      );
      saveSubmissions(updated);
      setActiveViewerId(replacingId);
      setReplacingId(null);
    }
  };

  const toggleViewer = (id) => {
    setActiveViewerId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="coursework-portfolio-wrapper">
      {/* Hidden input for replacing file */}
      <input
        type="file"
        ref={replaceInputRef}
        style={{ display: 'none' }}
        accept=".pdf"
        onChange={handleFileReplaced}
      />

      {/* Header Docket Bar */}
      <div className="portfolio-header-bar" onClick={() => setIsOpen((prev) => !prev)}>
        <div className="portfolio-header-left">
          <span className="portfolio-header-title">
            🎓 Academic Portfolio & Evaluation Docket
            <span className="portfolio-header-tag">Entrepreneurship Development</span>
          </span>
        </div>

        <div className="portfolio-header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="portfolio-add-btn"
            onClick={() => setIsAddModalOpen(true)}
            title="Add Experiment or Assignment"
          >
            <PlusIcon size={14} />
            <span>Add Submission</span>
          </button>

          <button
            type="button"
            className="portfolio-toggle-btn"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? '▴ Hide Coursework' : '▾ View Submissions (' + submissions.length + ')'}
          </button>
        </div>
      </div>

      {/* Expandable Coursework Body */}
      {isOpen && (
        <div className="portfolio-body">
          <div style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Structured sequential index of course experiments and assignments for professor evaluation and grading.
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Total Submissions: {submissions.length}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="portfolio-empty">
              <p>No coursework submissions attached yet.</p>
              <button
                type="button"
                className="portfolio-add-btn"
                style={{ marginTop: 'var(--space-sm)' }}
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon size={14} />
                <span>Upload First Experiment / Assignment</span>
              </button>
            </div>
          ) : (
            <div className="portfolio-list">
              {submissions.map((item, idx) => (
                <div key={item.id} className="portfolio-item-card">
                  <div className="portfolio-item-header">
                    <div className="portfolio-item-info">
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{idx + 1}
                      </span>
                      <span className={`portfolio-badge ${item.type.toLowerCase()}`}>
                        {item.type}
                      </span>
                      <div>
                        <div className="portfolio-item-title">{item.title}</div>
                        <div className="portfolio-item-meta">
                          {item.fileName ? (
                            <span style={{ color: 'var(--status-green)' }}>📄 {item.fileName}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>⚠️ No PDF attached yet</span>
                          )}
                          <span style={{ margin: '0 6px' }}>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="portfolio-item-controls">
                      {item.pdfUrl ? (
                        <>
                          <button
                            type="button"
                            className={`portfolio-view-btn ${activeViewerId === item.id ? 'active' : ''}`}
                            onClick={() => toggleViewer(item.id)}
                          >
                            {activeViewerId === item.id ? 'Hide PDF ▴' : 'View PDF ▾'}
                          </button>

                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="portfolio-icon-btn"
                            title="Open in new browser tab"
                          >
                            ↗ Popout
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="portfolio-view-btn"
                          onClick={() => handleOpenReplace(item.id)}
                          style={{ borderColor: 'var(--accent-blue)' }}
                        >
                          + Attach PDF
                        </button>
                      )}

                      <button
                        type="button"
                        className="portfolio-icon-btn"
                        onClick={() => handleOpenReplace(item.id)}
                        title="Upload/Replace PDF"
                      >
                        Replace
                      </button>

                      <button
                        type="button"
                        className="portfolio-icon-btn delete"
                        onClick={() => handleDeleteSubmission(item.id)}
                        title="Delete entry"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Embedded PDF Viewer */}
                  {activeViewerId === item.id && item.pdfUrl && (
                    <div className="portfolio-pdf-viewer">
                      <div className="portfolio-pdf-actions">
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          Viewing: <strong>{item.fileName || item.title}</strong>
                        </span>
                        <a
                          href={item.pdfUrl}
                          download={item.fileName || `${item.title}.pdf`}
                          className="portfolio-icon-btn"
                          style={{ textDecoration: 'underline' }}
                        >
                          Download Copy
                        </a>
                      </div>
                      <iframe
                        src={item.pdfUrl}
                        className="portfolio-pdf-iframe"
                        title={item.title}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for adding new submission */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Coursework Submission</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmission}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Submission Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                    <button
                      type="button"
                      className={`role-toggle-btn ${subType === 'EXPERIMENT' ? 'active' : ''}`}
                      onClick={() => setSubType('EXPERIMENT')}
                    >
                      Experiment
                    </button>
                    <button
                      type="button"
                      className={`role-toggle-btn ${subType === 'ASSIGNMENT' ? 'active' : ''}`}
                      onClick={() => setSubType('ASSIGNMENT')}
                    >
                      Assignment
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Title / Problem Statement</label>
                  <input
                    type="text"
                    placeholder="e.g. Experiment 3: Business Model Canvas & Platform Mechanics"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attach Coursework PDF</label>
                  <div
                    className="modal-dropzone"
                    style={{ minHeight: '100px', cursor: 'pointer' }}
                    onClick={() => document.getElementById('portfolio-file-input').click()}
                  >
                    <input
                      id="portfolio-file-input"
                      type="file"
                      accept=".pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="modal-dropzone-icon">
                      <UploadCloudIcon size={28} />
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      Click to browse or drop Experiment / Assignment PDF
                    </span>
                    {selectedFile && (
                      <span className="modal-file-selected" style={{ marginTop: '6px' }}>
                        ✓ {selectedFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-primary"
                  disabled={isUploading || !subTitle.trim()}
                >
                  {isUploading ? 'Attaching Document...' : 'Save Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
