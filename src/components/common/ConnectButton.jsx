import React from 'react';
import { CheckIcon } from './Icons';
import './ConnectButton.css';

export function ConnectButton({ status = 'not_connected', onClick, disabled = false, className = '' }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled || status === 'pending') return;
    if (onClick) onClick();
  };

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

  if (status === 'pending') {
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
