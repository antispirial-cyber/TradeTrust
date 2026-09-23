import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScoreRing } from '../common/ScoreRing';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { ConnectButton } from '../common/ConnectButton';
import { PinIcon } from '../common/Icons';
import './TraderCard.css';

export function TraderCard({ trader, onConnectToggle }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/profile/${trader.id}`);
  };

  const handleConnectClick = () => {
    if (onConnectToggle) {
      onConnectToggle(trader.id);
    }
  };

  const initialLetter = trader.initial || (trader.businessName ? trader.businessName[0].toUpperCase() : 'T');

  return (
    <div className="trader-card" onClick={handleCardClick}>
      <div className="trader-card-photo-wrapper">
        <span className="trader-card-initial">{initialLetter}</span>

        {trader.isVerifiedBadge && (
          <div className="trader-card-badge-pos">
            <VerifiedBadge />
          </div>
        )}

        <div className="trader-card-ring-pos" onClick={(e) => e.stopPropagation()}>
          <ScoreRing score={trader.trustScore} size={48} />
        </div>
      </div>

      <div className="trader-card-body">
        <h3 className="trader-card-title">{trader.businessName}</h3>

        <div className="trader-card-meta">
          {trader.role} • {trader.sector}
        </div>

        <div className="trader-card-location">
          <PinIcon size={13} />
          <span>{trader.cluster}</span>
        </div>

        <p className="trader-card-desc" title={trader.businessDesc}>
          {trader.businessDesc || 'No business description provided.'}
        </p>

        <div className="trader-card-mutual">
          {trader.mutualConnections > 0 ? (
            `${trader.mutualConnections} mutual connection${trader.mutualConnections > 1 ? 's' : ''}`
          ) : (
            <span>&nbsp;</span>
          )}
        </div>

        <div className="trader-card-action">
          <ConnectButton
            status={trader.connectionStatus || 'not_connected'}
            onClick={handleConnectClick}
          />
        </div>
      </div>
    </div>
  );
}
