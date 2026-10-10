import React, { useState, useEffect, useRef } from 'react';
import { HelpCircleIcon, CloseIcon } from './Icons';
import './FloatingHelp.css';

export function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="help-wedge-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Platform Help"
        title="Platform Feature Guide"
      >
        <HelpCircleIcon size={22} />
      </button>

      {isOpen && (
        <div ref={popoverRef} className="help-popover" role="dialog" aria-modal="true">
          <div className="help-popover-header">
            <span className="help-popover-title">Platform Feature Guide</span>
            <button
              type="button"
              className="help-popover-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Guide"
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="help-list">
            <div className="help-item">
              <strong>Browse Registry</strong>
              Search and inspect verified bazaar traders across Mumbai commodity clusters.
            </div>
            <div className="help-item">
              <strong>My Profile</strong>
              Manage your public reputation, view mutual connections, and showcase standing.
            </div>
            <div className="help-item">
              <strong>Private Ledger</strong>
              Track informal credit given and received with running balance - visible only to you.
            </div>
            <div className="help-item">
              <strong>Notifications</strong>
              Receive alerts on complaint updates, admin verdicts, score changes, and connection requests.
            </div>
            <div className="help-item">
              <strong>Settings</strong>
              Update account details and customize your platform accent color.
            </div>
            <div className="help-item">
              <strong>Trust Score Ring</strong>
              Reputation metric (0.0 to 10.0) with glowing indicator - click to inspect past records.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
