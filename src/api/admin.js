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

  const storedIds = new Set(storedTraders.map(t => String(t.id || t.traderId)).filter(Boolean));
  const phoneSet = new Set(storedTraders.map(t => normalizePhone(t.phone)).filter(Boolean));
  const allTraders = [
    ...storedTraders,
    ...INITIAL_TRADERS.filter(t => !storedIds.has(String(t.id || t.traderId)) && !phoneSet.has(normalizePhone(t.phone)))
  ];

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
      applyDisputeResolutionLocal(complaintId, resolution);
      return res;
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend resolveDispute error:', err);
  }

  // Fallback update in local storage + in-memory sync
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

  if (idx >= 0) {
    stored[idx].status = resolution;
    stored[idx].verdictDate = new Date().toISOString().split('T')[0];
    reportedTraderId = stored[idx].reportedId || stored[idx].traderId || stored[idx].reportedTraderId;
    reportedName = stored[idx].reportedName;
    localStorage.setItem('tradetrust_complaints', JSON.stringify(stored));
  } else {
    // If it's one of INITIAL_ADMIN_COMPLAINTS not yet in localStorage
    const complaintsRes = INITIAL_TRADERS; // fast reference
    let allComplaints = [];
    try {
      const storedComplaints = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
      const { INITIAL_ADMIN_COMPLAINTS } = require ? {} : {};
    } catch {}

    let item = stored.find(c => String(c.id || c.complaintId) === String(complaintId));
    if (!item) {
      // Find from initial admin complaints
      const initialSeed = [
        { id: 101, complaintId: 101, reportedId: 9, reportedName: 'Crawford Stationery Depot' },
        { id: 102, complaintId: 102, reportedId: 8, reportedName: 'Lamington Component Hub' },
        { id: 103, complaintId: 103, reportedId: 7, reportedName: 'Mangaldas Silk House' }
      ].find(c => String(c.id || c.complaintId) === String(complaintId));
      if (initialSeed) {
        item = initialSeed;
      }
    }

    if (item) {
      reportedTraderId = item.reportedId || item.traderId || item.reportedTraderId;
      reportedName = item.reportedName;
      const updatedItem = {
        ...item,
        status: resolution,
        verdictDate: new Date().toISOString().split('T')[0]
      };
      stored.unshift(updatedItem);
      localStorage.setItem('tradetrust_complaints', JSON.stringify(stored));
    }
  }

  // If reportedTraderId is still null, try finding trader by reportedName
  if (!reportedTraderId && reportedName) {
    const qName = reportedName.toLowerCase().trim();
    let storedTraders = [];
    try {
      storedTraders = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
    } catch {}
    const match = [...storedTraders, ...INITIAL_TRADERS].find(t =>
      (t.businessName && t.businessName.toLowerCase().trim() === qName) ||
      (t.name && t.name.toLowerCase().trim() === qName)
    );
    if (match) {
      reportedTraderId = match.id || match.traderId;
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
    message: `Dispute #${complaintId} has been ${resolution === 'APPROVED' ? 'approved (penalty applied: -1.50)' : 'dismissed'}.`
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

  let targetScore = null;
  const idx = stored.findIndex(t => String(t.id || t.traderId) === String(traderId));
  if (idx >= 0) {
    const current = Number(stored[idx].trustScore != null ? stored[idx].trustScore : 10.0);
    targetScore = Math.max(0, Math.min(10, Number((current + delta).toFixed(2))));
    stored[idx].trustScore = targetScore;
    stored[idx].isScoreFrozen = false;
    stored[idx].scoreFrozen = false;
    localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
  } else {
    // If seed trader, clone to stored with adjustment
    let seed = INITIAL_TRADERS.find(t => String(t.id || t.traderId) === String(traderId));
    if (!seed) {
      seed = INITIAL_TRADERS.find(t =>
        (t.phone && String(t.phone) === String(traderId)) ||
        (t.businessName && t.businessName.toLowerCase() === String(traderId).toLowerCase())
      );
    }
    if (seed) {
      const current = Number(seed.trustScore != null ? seed.trustScore : 10.0);
      targetScore = Math.max(0, Math.min(10, Number((current + delta).toFixed(2))));
      const updated = {
        ...seed,
        id: seed.id || seed.traderId,
        trustScore: targetScore,
        isScoreFrozen: false,
        scoreFrozen: false
      };
      stored.unshift(updated);
      localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
    }
  }

  // Also update in-memory INITIAL_TRADERS reference so all modules reading it see updated score immediately
  const memSeed = INITIAL_TRADERS.find(t =>
    String(t.id || t.traderId) === String(traderId) ||
    (t.phone && String(t.phone) === String(traderId)) ||
    (t.businessName && t.businessName.toLowerCase() === String(traderId).toLowerCase())
  );
  if (memSeed && targetScore != null) {
    memSeed.trustScore = targetScore;
    memSeed.isScoreFrozen = false;
    memSeed.scoreFrozen = false;
  }

  // Also sync tradetrust_current_user if the logged in user is the penalized trader
  try {
    const currentUser = JSON.parse(localStorage.getItem('tradetrust_current_user') || 'null');
    if (currentUser && (
      String(currentUser.id || currentUser.traderId) === String(traderId) ||
      (currentUser.phone && String(currentUser.phone) === String(traderId))
    )) {
      if (targetScore != null) {
        currentUser.trustScore = targetScore;
      }
      currentUser.isScoreFrozen = false;
      currentUser.scoreFrozen = false;
      localStorage.setItem('tradetrust_current_user', JSON.stringify(currentUser));
    }
  } catch {}

  // Dispatch events so open tabs and components update live
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradetrust_score_updated', {
      detail: { traderId, newScore: targetScore, delta }
    }));
    window.dispatchEvent(new Event('storage'));
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
      const updated = { ...seed, id: seed.id || seed.traderId, ...fields };
      stored.unshift(updated);
      localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
    }
  }

  // Also update in-memory INITIAL_TRADERS
  const memSeed = INITIAL_TRADERS.find(t => String(t.id || t.traderId) === String(traderId));
  if (memSeed) {
    Object.assign(memSeed, fields);
  }

  // Also update current user if matching
  try {
    const currentUser = JSON.parse(localStorage.getItem('tradetrust_current_user') || 'null');
    if (currentUser && String(currentUser.id || currentUser.traderId) === String(traderId)) {
      Object.assign(currentUser, fields);
      localStorage.setItem('tradetrust_current_user', JSON.stringify(currentUser));
    }
  } catch {}

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
