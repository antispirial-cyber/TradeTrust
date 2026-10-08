import { apiClient } from './client';
import { INITIAL_PAST_RECORDS } from './mockData';
import { getCurrentUser } from './auth';

export const INITIAL_ADMIN_COMPLAINTS = [
  {
    id: 101,
    complaintId: 101,
    reporterId: 1,
    reporterName: 'Mehta Jewellers Retail',
    reportedId: 9,
    reportedName: 'Crawford Stationery Depot',
    reportedCluster: 'Crawford Market',
    amountDisputed: 54000,
    incidentDate: '2026-03-24',
    description: 'Failure to deliver custom velvet jewellery packaging materials after full advance remittance. Merchant stopped responding to WhatsApp notices.',
    status: 'ESCALATED_TO_ADMIN',
    proofPath: 'crawford_invoice_904.pdf',
    createdAt: '2026-03-25T11:00:00'
  },
  {
    id: 102,
    complaintId: 102,
    reporterId: 3,
    reporterName: 'Navkar Diamond & Gems',
    reportedId: 8,
    reportedName: 'Lamington Component Hub',
    reportedCluster: 'Lamington Road',
    amountDisputed: 28000,
    incidentDate: '2026-03-10',
    description: 'Supplied counterfeit diamond carat scale equipment with inaccurate readings. Refused refund or genuine replacement.',
    status: 'ROUND_2_PENDING',
    proofPath: 'lamington_bill_receipt.pdf',
    createdAt: '2026-03-12T14:30:00'
  },
  {
    id: 103,
    complaintId: 103,
    reporterId: 5,
    reporterName: 'Sonal Gems & Crafts',
    reportedId: 7,
    reportedName: 'Mangaldas Silk House',
    reportedCluster: 'Mangaldas Market',
    amountDisputed: 18500,
    incidentDate: '2026-02-15',
    description: 'Delayed delivery of embroidered packaging silk pouches by 45 days, causing bridal order cancellations.',
    status: 'APPROVED',
    proofPath: 'consignment_receipt.jpg',
    createdAt: '2026-02-18T09:15:00'
  }
];

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

  // 2. Fallback to localStorage + initial list
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  const storedIds = new Set(stored.map(c => String(c.id || c.complaintId)));
  const combined = [...stored, ...INITIAL_ADMIN_COMPLAINTS.filter(c => !storedIds.has(String(c.id || c.complaintId)))];
  return {
    success: true,
    data: combined
  };
}

export async function getComplaintsByTrader(traderId) {
  try {
    const res = await apiClient(`/api/complaints`);
    if (res.success && Array.isArray(res.data)) {
      const list = res.data
        .filter(c => (c.reportedId === Number(traderId) || c.traderId === Number(traderId)) && c.status === 'APPROVED')
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

  // Fallback to local stored + mock
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('tradetrust_complaints') || '[]');
  } catch {}

  const approvedCustom = stored.filter(c => Number(c.reportedId) === Number(traderId) && c.status === 'APPROVED');
  const fallback = INITIAL_PAST_RECORDS.filter(c => c.traderId === Number(traderId) && c.status === 'APPROVED');
  return {
    success: true,
    data: [...approvedCustom, ...fallback]
  };
}

export async function fileComplaint({ reportedId, description, amountDisputed, incidentDate, proofFileName, proofPath }) {
  try {
    const res = await apiClient('/api/complaint', {
      method: 'POST',
      body: {
        reportedId: Number(reportedId),
        description,
        amountDisputed: Number(amountDisputed) || 0,
        incidentDate: incidentDate || new Date().toISOString().split('T')[0],
        proofPath: proofPath || proofFileName || 'document.pdf'
      }
    });

    if (res.success && res.data) {
      return {
        success: true,
        data: res.data,
        message: 'Complaint filed successfully. Dispute entered Round 1.'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend fileComplaint error:', err);
  }

  // Fallback for static host / Vercel
  const currentUser = getCurrentUser() || {};
  const newComplaint = {
    id: Date.now(),
    complaintId: Date.now(),
    reporterId: currentUser.id || currentUser.traderId || 1,
    reporterName: currentUser.businessName || currentUser.name || 'Verified Trader',
    reportedId: Number(reportedId),
    reportedName: 'Reported Trader #' + reportedId,
    description,
    amountDisputed: Number(amountDisputed) || 0,
    incidentDate: incidentDate || new Date().toISOString().split('T')[0],
    proofPath: proofPath || proofFileName || 'evidence_document.pdf',
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
