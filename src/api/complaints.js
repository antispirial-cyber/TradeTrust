import { apiClient } from './client';
import { getCurrentUser } from './auth';

// No dummy complaints - clean slate for the four official accounts
export const INITIAL_ADMIN_COMPLAINTS = [];

export async function getAllComplaints() {
  // 1. Attempt backend
  try {
    const res = await apiClient('/api/admin/complaints');
    if (res.success && Array.isArray(res.data)) {
      return {
        success: true,
        data: res.data.map(c => ({
          ...c,
          id: c.id || c.complaintId
        }))
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend complaints fetch error:', err);
  }

  // 2. Fallback to localStorage
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  return {
    success: true,
    data: stored
  };
}

export async function getComplaintsByTrader(traderId) {
  try {
    const res = await apiClient('/api/complaints');
    if (res.success && Array.isArray(res.data)) {
      const list = res.data
        .filter(c => (Number(c.reportedId) === Number(traderId) || Number(c.traderId) === Number(traderId)) && c.status === 'APPROVED')
        .map(c => ({
          ...c,
          id: c.id || c.complaintId,
          reporterName: c.reporterName || 'Verified Trader',
          verdictDate: c.updatedAt ? String(c.updatedAt).split('T')[0] : 'Arbitrated by Association'
        }));
      return {
        success: true,
        data: list
      };
    }
  } catch {}

  // Fallback to local stored
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  const approved = stored.filter(c => Number(c.reportedId) === Number(traderId) && c.status === 'APPROVED');
  return {
    success: true,
    data: approved
  };
}

export async function getUserFiledComplaints(userId) {
  try {
    const res = await apiClient('/api/complaints');
    if (res.success && Array.isArray(res.data)) {
      const list = res.data
        .filter(c => String(c.reporterId) === String(userId))
        .map(c => ({
          ...c,
          id: c.id || c.complaintId
        }));
      return {
        success: true,
        data: list
      };
    }
  } catch {}

  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  const userList = stored.filter(c => String(c.reporterId) === String(userId));
  return {
    success: true,
    data: userList
  };
}

export async function fileComplaint({ reportedId, description, amountDisputed, incidentDate, proofFileName, proofPath, reportedName, reportedCluster }) {
  const finalProof = proofPath || proofFileName || 'invoice_voucher.pdf';
  try {
    const res = await apiClient('/api/complaint', {
      method: 'POST',
      body: {
        reportedId: Number(reportedId),
        description,
        amountDisputed: Number(amountDisputed) || 0,
        incidentDate: incidentDate || new Date().toISOString().split('T')[0],
        proofPath: finalProof
      }
    });

    if (res.success && res.data) {
      return {
        success: true,
        data: res.data,
        message: 'Complaint filed successfully. Entered arbitration queue.'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend fileComplaint error:', err);
  }

  // Fallback for client mode / offline
  const currentUser = getCurrentUser() || {};
  const currentId = currentUser.id || currentUser.traderId || 1;
  const newComplaint = {
    id: Date.now(),
    complaintId: Date.now(),
    reporterId: currentId,
    reporterName: currentUser.businessName || currentUser.name || 'Verified Trader',
    reportedId: Number(reportedId),
    reportedName: reportedName || ('Reported Trader #' + reportedId),
    reportedCluster: reportedCluster || 'Zaveri Bazaar',
    description,
    amountDisputed: Number(amountDisputed) || 0,
    incidentDate: incidentDate || new Date().toISOString().split('T')[0],
    proofPath: finalProof,
    status: 'ESCALATED_TO_ADMIN',
    createdAt: new Date().toISOString()
  };

  try {
    let complaints = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
    complaints.unshift(newComplaint);
    localStorage.setItem('tradetrust_complaints', JSON.stringify(complaints));
  } catch {}

  return {
    success: true,
    data: newComplaint,
    message: 'Complaint filed successfully. Escalated to Association Desk.'
  };
}

export async function requestComplaintRetake(complaintId) {
  // 1. Attempt backend
  try {
    const res = await apiClient(`/api/complaint/${complaintId}/retake`, {
      method: 'POST'
    });
    if (res.success) {
      updateComplaintStatusLocal(complaintId, 'RETAKE_REQUESTED');
      return res;
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend requestComplaintRetake error:', err);
  }

  // 2. Client fallback
  updateComplaintStatusLocal(complaintId, 'RETAKE_REQUESTED');
  return {
    success: true,
    message: 'Retake request submitted. Flagged to Market Association Admin for approval.'
  };
}

function updateComplaintStatusLocal(complaintId, status) {
  try {
    let complaints = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
    const idx = complaints.findIndex(c => String(c.id || c.complaintId) === String(complaintId));
    if (idx >= 0) {
      complaints[idx].status = status;
      complaints[idx].updatedAt = new Date().toISOString();
      localStorage.setItem('tradetrust_complaints', JSON.stringify(complaints));
    }
  } catch {}
}
