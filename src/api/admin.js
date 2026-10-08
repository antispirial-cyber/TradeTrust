import { apiClient } from './client';
import { INITIAL_TRADERS } from './mockData';
import { normalizePhone } from './auth';
import { getAllComplaints } from './complaints';

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

  // Fallback computation from local store + mock data
  let storedTraders = [];
  try {
    storedTraders = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
  } catch {}

  const phoneSet = new Set(storedTraders.map(t => normalizePhone(t.phone)));
  const allTraders = [...storedTraders, ...INITIAL_TRADERS.filter(t => !phoneSet.has(normalizePhone(t.phone)))];

  const complaintsRes = await getAllComplaints();
  const allComplaints = complaintsRes.data || [];

  const pendingComplaints = allComplaints.filter(c =>
    c.status === 'ESCALATED_TO_ADMIN' ||
    c.status === 'ROUND_1_PENDING' ||
    c.status === 'ROUND_2_PENDING'
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
  // resolution: 'APPROVED' or 'REJECTED'
  try {
    const res = await apiClient(`/api/admin/complaint/${complaintId}/resolve`, {
      method: 'POST',
      body: { status: resolution }
    });
    if (res.success) {
      return res;
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend resolveDispute error:', err);
  }

  // Fallback update in local storage
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  const idx = stored.findIndex(c => String(c.id || c.complaintId) === String(complaintId));
  let reportedTraderId = null;

  if (idx >= 0) {
    stored[idx].status = resolution;
    stored[idx].verdictDate = new Date().toISOString().split('T')[0];
    reportedTraderId = stored[idx].reportedId;
    localStorage.setItem('tradetrust_complaints', JSON.stringify(stored));
  } else {
    // If it's one of INITIAL_ADMIN_COMPLAINTS not yet in localStorage
    const complaintsRes = await getAllComplaints();
    const item = (complaintsRes.data || []).find(c => String(c.id || c.complaintId) === String(complaintId));
    if (item) {
      reportedTraderId = item.reportedId;
      const updatedItem = {
        ...item,
        status: resolution,
        verdictDate: new Date().toISOString().split('T')[0]
      };
      stored.unshift(updatedItem);
      localStorage.setItem('tradetrust_complaints', JSON.stringify(stored));
    }
  }

  // If APPROVED, apply penalty (-1.5) to the reported trader's trust score
  if (resolution === 'APPROVED' && reportedTraderId) {
    adjustTraderScoreLocal(reportedTraderId, -1.5);
  }

  // Emit association verdict notification
  emitVerdictNotification(complaintId, resolution);

  return {
    success: true,
    message: `Dispute #${complaintId} has been ${resolution === 'APPROVED' ? 'approved (penalty applied)' : 'dismissed'}.`
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
  updateTraderFieldLocal(traderId, {
    trustScore: score
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
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
  } catch {}

  const idx = stored.findIndex(t => String(t.id || t.traderId) === String(traderId));
  if (idx >= 0) {
    const current = Number(stored[idx].trustScore) || 10.0;
    stored[idx].trustScore = Math.max(0, Math.min(10, (current + delta))).toFixed(2);
    localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
  } else {
    // If seed trader, clone to stored with adjustment
    const seed = INITIAL_TRADERS.find(t => String(t.id || t.traderId) === String(traderId));
    if (seed) {
      const current = Number(seed.trustScore) || 10.0;
      const updated = {
        ...seed,
        trustScore: Math.max(0, Math.min(10, (current + delta))).toFixed(2)
      };
      stored.unshift(updated);
      localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
    }
  }
}

function updateTraderFieldLocal(traderId, fields) {
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
  } catch {}

  const idx = stored.findIndex(t => String(t.id || t.traderId) === String(traderId));
  if (idx >= 0) {
    stored[idx] = { ...stored[idx], ...fields };
    localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
  } else {
    const seed = INITIAL_TRADERS.find(t => String(t.id || t.traderId) === String(traderId));
    if (seed) {
      const updated = { ...seed, ...fields };
      stored.unshift(updated);
      localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
    }
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
