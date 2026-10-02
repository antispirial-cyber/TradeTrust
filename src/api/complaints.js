import { apiClient } from './client';
import { INITIAL_PAST_RECORDS } from './mockData';

export async function getComplaintsByTrader(traderId) {
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

  // Fallback to mock
  const fallback = INITIAL_PAST_RECORDS.filter(c => c.traderId === Number(traderId) && c.status === 'APPROVED');
  return {
    success: true,
    data: fallback
  };
}

export async function fileComplaint({ reportedId, description, amountDisputed, incidentDate, proofFileName, proofPath }) {
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

  return {
    success: false,
    message: res.message || 'Failed to file complaint'
  };
}
