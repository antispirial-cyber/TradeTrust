import React from 'react';
import { CheckIcon } from './Icons';
import './ConnectButton.css';

export function ConnectButton({ status = 'not_connected', onClick, onAccept, onDecline, disabled = false, className = '' }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled || status === 'pending' || status === 'pending_sent') return;
    if (onClick) onClick();
  };

  const isPending = status === 'pending' || status === 'pending_sent';

  if (status === 'connected') {
    return (
      <button
        type="button"
        className={`connect-btn connected ${className}`}
        onClick={handleClick}
        title="Click to disconnect"
      >
        <CheckIcon size={14} />
        <span>Connected</span>
      </button>
    );
  }

  if (isPending) {
    return (
      <button
        type="button"
        className={`connect-btn pending ${className}`}
        disabled
      >
        <span>Pending</span>
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <div style={{ display: 'flex', gap: '6px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="connect-btn not-connected"
          style={{ flex: 1, padding: '6px 8px', fontSize: 'var(--text-xs)' }}
          onClick={(e) => {
            e.stopPropagation();
            if (onAccept) onAccept();
            else if (onClick) onClick();
          }}
        >
          Accept
        </button>
        <button
          type="button"
          className="connect-btn pending"
          style={{ flex: 1, padding: '6px 8px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (onDecline) onDecline();
          }}
        >
          Decline
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`connect-btn not-connected ${className}`}
      onClick={handleClick}
    >
      <span>Connect</span>
    </button>
  );
}
