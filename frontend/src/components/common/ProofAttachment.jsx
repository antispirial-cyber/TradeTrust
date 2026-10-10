import React from 'react';
import { openProofDocument } from '../../api/client';

export function ProofAttachment({ proofPath, fileName, label, title }) {
  if (!proofPath) return null;

  const isImage = proofPath.startsWith('data:image/') || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(proofPath);
  const resolvedFileName = fileName || (isImage ? 'proof_evidence.jpg' : 'proof_document.pdf');
  const displayLabel = label || (isImage ? 'View Attached Proof Photo' : 'View Attached Proof Document');

  return (
    <div style={{
      margin: '10px 0',
      padding: '8px 12px',
      background: 'var(--bg-input)',
      borderRadius: '6px',
      border: '1px solid var(--border-subtle)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      {isImage ? (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => openProofDocument(proofPath, resolvedFileName)}
          title={title || 'Click to view full evidence proof'}
        >
          <img
            src={proofPath}
            alt="Attached Proof Thumbnail"
            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
          />
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-color)', textDecoration: 'underline', display: 'block' }}>
              {displayLabel}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {resolvedFileName}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => openProofDocument(proofPath, resolvedFileName)}
          title={title || 'Click to view full evidence document'}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 5px', background: 'var(--border-color)', borderRadius: '3px' }}>PDF</span>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-color)', textDecoration: 'underline', display: 'block' }}>
              {displayLabel}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {resolvedFileName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
