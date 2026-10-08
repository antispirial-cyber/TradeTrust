// Automatic client-side cleanup of legacy dummy data
// Ensures any existing browser localStorage is immediately purged of legacy demo traders

export const LEGACY_DUMMY_NAMES = new Set([
  'mehta jewellers retail',
  'blah blah blah',
  'navkar diamond & gems',
  'zaveri gold house',
  'sonal gems & crafts',
  'dadar fabrics emporium',
  'mangaldas silk house',
  'lamington component hub',
  'crawford stationery depot',
  'rajesh mehta',
  'bhavin shah',
  'naveen chordia',
  'zubin zaveri',
  'sonal parekh',
  'dharmesh vora',
  'mohanlal silk traders',
  'lalit electronics',
  'chetan stationery',
  'chetan stationery co.',
  'kavita designer chudas',
  'kavita shah'
]);

export const LEGACY_DUMMY_PHONES = new Set([
  '9820012345', '9820054321', '9820198765', '9820234567',
  '9820345678', '9820456789', '9820567890', '9820678901', '9820789012'
]);

export function isLegacyDummy(t) {
  if (!t) return false;
  const b = (t.businessName || '').toLowerCase().trim();
  const n = (t.name || '').toLowerCase().trim();
  const p = String(t.phone || '').replace(/\D/g, '').slice(-10);
  return LEGACY_DUMMY_NAMES.has(b) || LEGACY_DUMMY_NAMES.has(n) || LEGACY_DUMMY_PHONES.has(p);
}

export function runDataSanitization() {
  try {
    // 1. Purge legacy dummy accounts from tradetrust_traders
    const rawTraders = localStorage.getItem('tradetrust_traders');
    if (rawTraders) {
      const parsed = JSON.parse(rawTraders);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(t => !isLegacyDummy(t));
        localStorage.setItem('tradetrust_traders', JSON.stringify(cleaned));
      }
    }

    // 2. Purge legacy dummy account from tradetrust_current_user
    const rawUser = localStorage.getItem('tradetrust_current_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (isLegacyDummy(user)) {
        localStorage.removeItem('tradetrust_current_user');
        localStorage.removeItem('tradetrust_token');
      }
    }

    // 3. Purge legacy dummy complaints
    const rawComplaints = localStorage.getItem('tradetrust_complaints');
    if (rawComplaints) {
      const complaints = JSON.parse(rawComplaints);
      if (Array.isArray(complaints)) {
        const cleaned = complaints.filter(c => {
          const rep = (c.reporterName || '').toLowerCase().trim();
          const rpd = (c.reportedName || '').toLowerCase().trim();
          return !LEGACY_DUMMY_NAMES.has(rep) && !LEGACY_DUMMY_NAMES.has(rpd);
        });
        localStorage.setItem('tradetrust_complaints', JSON.stringify(cleaned));
      }
    }

    // 4. Mark storage as sanitized
    localStorage.setItem('tradetrust_sanitized', 'true');
  } catch (err) {
    console.warn('Storage sanitization warning:', err);
  }
}
