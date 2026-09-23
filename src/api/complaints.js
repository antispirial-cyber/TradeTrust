import { INITIAL_PAST_RECORDS } from './mockData';

const COMPLAINTS_KEY = 'tradetrust_complaints';

function getStoredComplaints() {
  const stored = localStorage.getItem(COMPLAINTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(INITIAL_PAST_RECORDS));
  return INITIAL_PAST_RECORDS;
}

function saveComplaints(complaints) {
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
}

export async function getComplaintsByTrader(traderId) {
  const complaints = getStoredComplaints();
  const filtered = complaints.filter(c => c.traderId === Number(traderId) && c.status === 'APPROVED');
  return {
    success: true,
    data: filtered
  };
}

export async function fileComplaint({ reportedId, description, amountDisputed, incidentDate, proofFileName }) {
  const complaints = getStoredComplaints();
  const newComplaint = {
    id: `comp-${Date.now()}`,
    traderId: Number(reportedId),
    reporterName: "Current User",
    amountDisputed: Number(amountDisputed) || 0,
    incidentDate: incidentDate || new Date().toISOString().split('T')[0],
    proofFileName: proofFileName || "document.pdf",
    description,
    status: 'ROUND_1_PENDING',
    createdAt: new Date().toISOString()
  };

  complaints.push(newComplaint);
  saveComplaints(complaints);

  return {
    success: true,
    data: newComplaint,
    message: "Complaint received. We will review it."
  };
}
