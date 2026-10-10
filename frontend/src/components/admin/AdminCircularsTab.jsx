import React from 'react';
import { CLUSTERS } from '../../constants';

const BROADCAST_CLUSTERS = ['All Clusters', ...CLUSTERS];

export function AdminCircularsTab({
  broadcastTitle,
  setBroadcastTitle,
  broadcastMessage,
  setBroadcastMessage,
  broadcastCluster,
  setBroadcastCluster,
  handleSendBroadcast,
  isBroadcasting
}) {
  return (
    <div className="admin-panel-card">
      <h3 className="panel-heading">Publish Association Circular</h3>
      <p className="panel-subheading">
        Dispatch an official market advisory, holiday settlement schedule, or default alert directly to all Mumbai traders' notification centres.
      </p>

      <form className="broadcast-form" onSubmit={handleSendBroadcast}>
        <div className="form-group">
          <label className="form-label">Target Market Cluster</label>
          <select
            className="form-select"
            value={broadcastCluster}
            onChange={(e) => setBroadcastCluster(e.target.value)}
          >
            {BROADCAST_CLUSTERS.map((c) => (
              <option key={c} value={c}>
                {c === 'All Clusters' ? 'All Bazaars (City-wide Broadcast)' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Advisory Headline</label>
          <input
            type="text"
            placeholder="e.g. Mandatory 30-Day Credit Limit Notice for Festive Season"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Circular Message Body</label>
          <textarea
            className="form-textarea"
            placeholder="Provide precise details, association directives, or arbitration warnings..."
            rows={4}
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="admin-gate-btn"
          style={{ maxWidth: '280px' }}
          disabled={isBroadcasting}
        >
          {isBroadcasting ? 'Broadcasting...' : 'Publish Circular to All Traders'}
        </button>
      </form>
    </div>
  );
}
