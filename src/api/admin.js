import { apiClient } from './client';
import { getAllComplaints } from './complaints';
import { getLocalTradersList, saveTraderOverride } from './traders';

export async function getAdminMetrics() {
  try {
    const res = await apiClient('/api/admin/metrics');
    if (res.success && res.data) {
      return {
        success: true,
        data: res.data
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend admin metrics error:', err);
  }

  // Fallback computation from unified local traders list
  const allTraders = getLocalTradersList();

  const complaintsRes = await getAllComplaints();
  const allComplaints = complaintsRes.data || [];

  const pendingComplaints = allComplaints.filter(c =>
    c.status === 'ESCALATED_TO_ADMIN' ||
    c.status === 'ROUND_1_PENDING' ||
    c.status === 'ROUND_2_PENDING' ||
    c.status === 'RETAKE_REQUESTED'
  ).length;

  const frozenTraders = allTraders.filter(t => t.scoreFrozen || t.isScoreFrozen).length;

  const validScores = allTraders.map(t => Number(t.trustScore) || 0);
  const avgScore = validScores.length > 0
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)
    : '10.00';

  const totalDisputedAmount = allComplaints.reduce((sum, c) => sum + (Number(c.amountDisputed) || 0), 0);

  return {
    success: true,
    data: {
      totalTraders: allTraders.length,
      pendingComplaints,
      frozenTraders,
      averageTrustScore: avgScore,
      totalDisputedAmount,
      totalComplaints: allComplaints.length
    }
  };
}

export async function resolveDispute(complaintId, resolution) {
  // resolution: 'APPROVED', 'REJECTED', or 'RETAKE_APPROVED'
  try {
    const res = await apiClient(`/api/admin/complaint/${complaintId}/resolve`, {
      method: 'POST',
      body: { status: resolution }
    });
    if (res.success) {
      applyDisputeResolutionLocal(complaintId, resolution);
      return res;
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend resolveDispute error:', err);
  }

  // Fallback update in local storage
  return applyDisputeResolutionLocal(complaintId, resolution);
}

function applyDisputeResolutionLocal(complaintId, resolution) {
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  const idx = stored.findIndex(c => String(c.id || c.complaintId) === String(complaintId));
  let reportedTraderId = null;
  let reportedName = null;
  let previousStatus = null;

  if (idx >= 0) {
    previousStatus = stored[idx].status;
    stored[idx].status = resolution;
    stored[idx].verdictDate = new Date().toISOString().split('T')[0];
    reportedTraderId = stored[idx].reportedId || stored[idx].traderId;
    reportedName = stored[idx].reportedName;
    localStorage.setItem('tradetrust_complaints', JSON.stringify(stored));
  }

  // If reportedTraderId is still null, look up trader by reportedName
  if (!reportedTraderId && reportedName) {
    const qName = reportedName.toLowerCase().trim();
    const match = getLocalTradersList().find(t =>
      (t.businessName && t.businessName.toLowerCase().trim() === qName) ||
      (t.name && t.name.toLowerCase().trim() === qName)
    );
    if (match) {
      reportedTraderId = match.id || match.traderId;
    }
  }

  // Score adjustments based on resolution
  if (resolution === 'APPROVED' && reportedTraderId) {
    adjustTraderScoreLocal(reportedTraderId, -1.5);
  } else if (resolution === 'RETAKE_APPROVED' && reportedTraderId) {
    // If complaint was previously approved, restore the 1.50 point deduction
    if (previousStatus === 'APPROVED') {
      adjustTraderScoreLocal(reportedTraderId, +1.5);
    }
    // Always unfreeze reported trader's score upon retake approval
    updateTraderFieldLocal(reportedTraderId, {
      scoreFrozen: false,
      isScoreFrozen: false
    });
  } else if (resolution === 'REJECTED' && reportedTraderId) {
    // Unfreeze on dismissal
    updateTraderFieldLocal(reportedTraderId, {
      scoreFrozen: false,
      isScoreFrozen: false
    });
  }

  // Emit association verdict notification
  emitVerdictNotification(complaintId, resolution);

  let msg = `Dispute #${complaintId} has been resolved as ${resolution}.`;
  if (resolution === 'APPROVED') {
    msg = `Dispute #${complaintId} approved. Score penalty (-1.50) applied.`;
  } else if (resolution === 'RETAKE_APPROVED') {
    msg = `Retake approved for Dispute #${complaintId}. Complaint withdrawn and penalties restored.`;
  } else if (resolution === 'REJECTED') {
    msg = `Dispute #${complaintId} dismissed without penalty.`;
  }

  return {
    success: true,
    message: msg
  };
}

export async function toggleTraderFreeze(traderId, freezeState) {
  try {
    const res = await apiClient(`/api/admin/trader/${traderId}/freeze`, {
      method: 'POST',
      body: { freeze: freezeState }
    });
    if (res.success) return res;
  } catch (err) {
    console.warn('[TradeTrust] Backend freeze error:', err);
  }

  // Fallback local update
  updateTraderFieldLocal(traderId, {
    scoreFrozen: freezeState,
    isScoreFrozen: freezeState
  });

  return {
    success: true,
    message: `Trader score status ${freezeState ? 'FROZEN' : 'ACTIVE'}.`
  };
}

export async function toggleTraderVerified(traderId, isVerified) {
  updateTraderFieldLocal(traderId, {
    isVerifiedBadge: isVerified
  });
  return {
    success: true,
    message: `Trader verification badge ${isVerified ? 'granted' : 'revoked'}.`
  };
}

export async function setTraderCustomScore(traderId, newScore) {
  const score = Math.max(0, Math.min(10, parseFloat(newScore) || 0));
  try {
    await apiClient(`/api/admin/trader/${traderId}/score`, {
      method: 'POST',
      body: { score }
    });
  } catch (err) {
    console.warn('[TradeTrust] Backend score adjust error:', err);
  }

  updateTraderFieldLocal(traderId, {
    trustScore: score,
    scoreFrozen: false,
    isScoreFrozen: false
  });

  return {
    success: true,
    data: score,
    message: `Trust score adjusted to ${score.toFixed(2)} / 10.00`
  };
}

export async function broadcastNotice({ title, message, cluster = 'All Clusters' }) {
  const newNotif = {
    id: 'broadcast-' + Date.now(),
    type: 'platform_broadcast',
    message: `[Association Circular - ${cluster}] ${title}: ${message}`,
    linkRef: '/browse',
    isRead: false,
    timestamp: 'Just now'
  };

  try {
    let notifs = JSON.parse(localStorage.getItem('tradetrust_notifications') || '[]');
    notifs.unshift(newNotif);
    localStorage.setItem('tradetrust_notifications', JSON.stringify(notifs));
  } catch {}

  return {
    success: true,
    message: 'Official Association Circular broadcasted to all merchant portals.'
  };
}

function adjustTraderScoreLocal(traderId, delta) {
  const all = getLocalTradersList();
  const trader = all.find(t => String(t.id || t.traderId) === String(traderId));
  if (trader) {
    const current = Number(trader.trustScore != null ? trader.trustScore : 10.0);
    const targetScore = Math.max(0, Math.min(10, Number((current + delta).toFixed(2))));
    updateTraderFieldLocal(traderId, {
      trustScore: targetScore,
      scoreFrozen: false,
      isScoreFrozen: false
    });
  }
}

function updateTraderFieldLocal(traderId, fields) {
  saveTraderOverride(traderId, fields);

  // Sync current user session if it matches the modified trader
  try {
    const currentUser = JSON.parse(localStorage.getItem('tradetrust_current_user') || 'null');
    if (currentUser && String(currentUser.id || currentUser.traderId) === String(traderId)) {
      Object.assign(currentUser, fields);
      localStorage.setItem('tradetrust_current_user', JSON.stringify(currentUser));
    }
  } catch {}

  // Dispatch events so components and open tabs re-render live
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradetrust_score_updated', {
      detail: { traderId, fields }
    }));
    window.dispatchEvent(new Event('storage'));
  }
}

function emitVerdictNotification(complaintId, resolution) {
  const notif = {
    id: 'verdict-' + Date.now(),
    type: 'admin_verdict',
    message: `Market Association Arbitration Verdict on Case #${complaintId}: Dispute has been marked ${resolution}.`,
    linkRef: '/admin',
    isRead: false,
    timestamp: 'Just now'
  };

  try {
    let notifs = JSON.parse(localStorage.getItem('tradetrust_notifications') || '[]');
    notifs.unshift(notif);
    localStorage.setItem('tradetrust_notifications', JSON.stringify(notifs));
  } catch {}
}
