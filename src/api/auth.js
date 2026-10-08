import { apiClient, setAuthToken } from './client';
import { getLocalTradersList, saveTraderOverride } from './traders';

const AUTH_USER_KEY = 'tradetrust_current_user';

export function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function getCurrentUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      const user = JSON.parse(stored);
      // Admin is always valid
      if (user.role === 'ADMIN' || (user.username && user.username.toLowerCase() === 'admin')) {
        return user;
      }
      // Check if user exists among active official or registered traders
      const allTraders = getLocalTradersList();
      const uId = String(user.id || user.traderId);
      const uPhone = normalizePhone(user.phone);
      const matched = allTraders.find(t => String(t.id || t.traderId) === uId || normalizePhone(t.phone) === uPhone);
      if (matched) {
        return { ...user, ...matched };
      }
      // Stale or nonexistent session
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  }
  return null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export const UNIVERSAL_ADMIN_USER = {
  id: 'admin-1',
  traderId: 'admin-1',
  name: 'Market Association Admin',
  username: 'Admin',
  phone: 'Admin',
  businessName: 'TradeTrust Arbitration Desk',
  businessDesc: 'Authorized Market Association Administrator and Arbitration Panel',
  role: 'ADMIN',
  cluster: 'South Mumbai Central Association',
  sector: 'Market Governance',
  trustScore: 10.00,
  isVerifiedBadge: true,
  scoreFrozen: false,
  initial: 'A'
};

export async function adminLogin({ username, password }) {
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  // 1. Attempt real Java backend admin login if active
  try {
    const res = await apiClient('/api/auth/admin-login', {
      method: 'POST',
      body: { username: cleanUser, password: cleanPass }
    });

    if (res.success && res.data) {
      const user = UNIVERSAL_ADMIN_USER;
      const token = res.data.token || ('tt-admin-session-' + Date.now());
      setAuthToken(token);
      setCurrentUser(user);
      return {
        success: true,
        data: user,
        message: 'Admin login successful'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend admin login attempt:', err);
  }

  // 2. Universal credential check (Username: Admin, Password: tradetrust)
  if (cleanUser.toLowerCase() === 'admin') {
    if (cleanPass === 'tradetrust') {
      const token = 'tt-admin-session-' + Date.now();
      setAuthToken(token);
      setCurrentUser(UNIVERSAL_ADMIN_USER);
      return {
        success: true,
        data: UNIVERSAL_ADMIN_USER,
        message: 'Admin login successful'
      };
    } else {
      return {
        success: false,
        message: 'Invalid Admin password. The active universal password is "tradetrust".'
      };
    }
  }

  return {
    success: false,
    message: 'Invalid admin username. Expected "Admin".'
  };
}

export async function login({ phone, password }) {
  const rawInput = (phone || '').trim();
  const cleanPhone = normalizePhone(phone);
  const cleanPass = (password || '').trim();

  // 0. Universal Admin check on general login form
  if (rawInput.toLowerCase() === 'admin') {
    return adminLogin({ username: rawInput, password: cleanPass });
  }

  // 1. Attempt real Java backend login
  try {
    const res = await apiClient('/api/auth/login', {
      method: 'POST',
      body: { phone: cleanPhone, password: cleanPass }
    });

    if (res.success && res.data) {
      const user = res.data.user || res.data;
      const token = res.data.token;
      if (token) {
        setAuthToken(token);
      }
      setCurrentUser(user);
      return {
        success: true,
        data: user,
        message: res.message || 'Login successful'
      };
    }

    if (res && (res.status === 401 || res.status === 400)) {
      return {
        success: false,
        message: res.message || 'Invalid phone number or password'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend login attempt error:', err);
  }

  // 2. Local fallback against active traders list
  const allAvailable = getLocalTradersList();
  const authenticatedUser = allAvailable.find(t => {
    const tPhone = normalizePhone(t.phone);
    const tBiz = (t.businessName || '').toLowerCase().trim();
    const tName = (t.name || '').toLowerCase().trim();
    const matchPhone = cleanPhone && tPhone === cleanPhone;
    const matchBiz = rawInput && (tBiz === rawInput.toLowerCase() || tName === rawInput.toLowerCase());
    return matchPhone || matchBiz;
  });

  if (authenticatedUser) {
    const expectedPass = authenticatedUser.password || 'tradetrust';
    if (cleanPass !== expectedPass) {
      return {
        success: false,
        message: 'Incorrect password. Please verify and try again.'
      };
    }

    const mockToken = 'tt-session-' + Date.now();
    setAuthToken(mockToken);
    setCurrentUser(authenticatedUser);
    return {
      success: true,
      data: authenticatedUser,
      message: 'Login successful'
    };
  }

  return {
    success: false,
    message: 'Trader account not found. Please register your business or verify your trader card credentials.'
  };
}

export async function register(data) {
  const cleanPhoneNum = normalizePhone(data.phone) || String(data.phone || '').trim();
  const cleanPass = (data.password || '').trim();

  // 1. Attempt real Java backend registration
  try {
    const res = await apiClient('/api/auth/register', {
      method: 'POST',
      body: {
        ...data,
        phone: cleanPhoneNum,
        password: cleanPass
      }
    });

    if (res.success && res.data) {
      const user = res.data.user || res.data;
      const token = res.data.token;
      if (token) {
        setAuthToken(token);
      }
      setCurrentUser(user);
      return {
        success: true,
        data: user,
        message: res.message || 'Registration successful'
      };
    }

    if (res && (res.status === 409 || res.status === 400)) {
      return {
        success: false,
        message: res.message || 'Registration failed: Phone number already exists.'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend register attempt error:', err);
  }

  // 2. Local fallback: persist to registered traders
  const newTrader = {
    id: Date.now(),
    traderId: Date.now(),
    name: (data.name || '').trim(),
    phone: cleanPhoneNum,
    password: cleanPass,
    businessName: (data.businessName || '').trim(),
    businessDesc: (data.businessDesc || '').trim(),
    role: data.role || 'RETAILER',
    cluster: data.cluster || 'Zaveri Bazaar',
    sector: data.sector || 'General',
    trustScore: 10.00,
    isVerifiedBadge: false,
    scoreFrozen: false,
    initial: data.name && data.name.trim() ? data.name.trim()[0].toUpperCase() : 'T',
    createdAt: new Date().toISOString()
  };

  try {
    let registered = JSON.parse(localStorage.getItem('tradetrust_registered_traders') || '[]');
    const existingIdx = registered.findIndex(t => normalizePhone(t.phone) === cleanPhoneNum);
    if (existingIdx >= 0) {
      registered[existingIdx] = newTrader;
    } else {
      registered.unshift(newTrader);
    }
    localStorage.setItem('tradetrust_registered_traders', JSON.stringify(registered));
  } catch {}

  const mockToken = 'tt-session-' + Date.now();
  setAuthToken(mockToken);
  setCurrentUser(newTrader);

  return {
    success: true,
    data: newTrader,
    message: 'Registration successful'
  };
}

export async function logout() {
  try {
    await apiClient('/api/auth/logout', { method: 'POST' });
  } catch {}
  setAuthToken(null);
  setCurrentUser(null);
  return {
    success: true
  };
}

export async function updateCurrentUser(updates) {
  try {
    const res = await apiClient('/api/trader/profile', {
      method: 'POST',
      body: updates
    });

    if (res.success && res.data) {
      const current = getCurrentUser() || {};
      const updated = { ...current, ...res.data };
      setCurrentUser(updated);
      saveTraderOverride(updated.id || updated.traderId, res.data);
      return {
        success: true,
        data: updated
      };
    }
  } catch {}

  const current = getCurrentUser() || {};
  const updated = { ...current, ...updates };
  setCurrentUser(updated);
  saveTraderOverride(updated.id || updated.traderId, updates);

  return {
    success: true,
    data: updated
  };
}
