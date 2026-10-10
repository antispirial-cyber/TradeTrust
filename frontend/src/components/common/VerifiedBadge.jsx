import React from 'react';
import { CheckIcon } from './Icons';
import './VerifiedBadge.css';

export function VerifiedBadge({ className = '' }) {
  return (
    <div className={`verified-badge ${className}`}>
      <CheckIcon size={12} />
      <span>Verified</span>
    </div>
  );
}
