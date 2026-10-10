import { apiClient } from './client';

export async function getAllComplaints() {
  const res = await apiClient('/api/complaints');
  if (res.success && Array.isArray(res.data)) {
    return {
      success: true,
      data: res.data.map(c => ({
        ...c,
        id: c.complaintId || c.id,
        proofFileName: c.proofFileName || c.proofName || null
      }))
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to load disputes',
    data: []
  };
}

export async function getComplaintsByTrader(traderId) {
  const res = await apiClient(`/api/complaints/records/${traderId}`);
  if (res.success && Array.isArray(res.data)) {
    return {
      success: true,
      data: res.data.map(c => ({
        ...c,
        id: c.complaintId || c.id,
        verdictDate: c.resolvedAt ? String(c.resolvedAt).split('T')[0] : 'Arbitrated by Association'
      }))
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to load merchant records',
    data: []
  };
}

export async function getUserFiledComplaints(userId) {
  const res = await apiClient('/api/complaints');
  if (res.success && Array.isArray(res.data)) {
    const list = res.data
      .filter(c => String(c.reporterId) === String(userId))
      .map(c => ({
        ...c,
        id: c.complaintId || c.id
      }));
    return {
      success: true,
      data: list
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to load user disputes',
    data: []
  };
}

export async function fileComplaint({ reportedId, description, amountDisputed, incidentDate, proofFileName, proofPath }) {
  const res = await apiClient('/api/complaints', {
    method: 'POST',
    body: {
      reportedId: Number(reportedId),
      description,
      amountDisputed: Number(amountDisputed) || 0,
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      proofPath: proofPath || null,
      proofName: proofFileName || null
    }
  });

  if (res.success && res.data) {
    return {
      success: true,
      data: {
        ...res.data,
        id: res.data.complaintId || res.data.id
      },
      message: res.message || 'Dispute filed successfully and escalated to the Association Desk.'
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to file dispute'
  };
}

export async function requestComplaintRetake(complaintId) {
  const res = await apiClient(`/api/complaints/${complaintId}/retake`, {
    method: 'POST'
  });

  return {
    success: res.success,
    message: res.message || (res.success ? 'Retake request submitted to the Association Admin.' : 'Failed to request retake')
  };
}
