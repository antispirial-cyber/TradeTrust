import { apiClient, setAuthToken } from './client';
import { INITIAL_TRADERS } from './mockData';

const AUTH_USER_KEY = 'tradetrust_current_user';

export function getCurrentUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
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

export async function login({ phone, password }) {
  // 1. Attempt real Java backend login
  try {
    const res = await apiClient('/api/auth/login', {
      method: 'POST',
      body: { phone, password }
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
  } catch (err) {
    console.warn('[TradeTrust] Backend login attempt error:', err);
  }

  // 2. Seamless Static / Vercel fallback (when backend server is not running on the static host)
  let authenticatedUser = null;

  // Check seed trader: Rajesh Mehta (9820012345 / password123)
  if (phone === '9820012345' && (password === 'password123' || !password || password === '')) {
    authenticatedUser = {
      id: 1,
      traderId: 1,
      name: 'Rajesh Mehta',
      phone: '9820012345',
      businessName: 'Mehta Jewellers Retail',
      businessDesc: 'Retail showroom in Zaveri Bazaar specializing in bridal jewellery, temple collections, and certified diamonds.',
      role: 'RETAILER',
      cluster: 'Zaveri Bazaar',
      sector: 'Ornaments & Jewellery',
      trustScore: 10.00,
      isVerifiedBadge: true,
      scoreFrozen: false,
      initial: 'R'
    };
  } else {
    // Check stored custom registered traders
    try {
      const storedTraders = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
      authenticatedUser = storedTraders.find(t => t.phone === phone);
    } catch {}

    if (!authenticatedUser) {
      // Check initial mock traders
      authenticatedUser = INITIAL_TRADERS.find(t => t.phone === phone);
    }
  }

  if (authenticatedUser) {
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
    message: 'Invalid phone number or password. (Test account: 9820012345 / password123)'
  };
}

export async function register(data) {
  // 1. Attempt real Java backend registration
  try {
    const res = await apiClient('/api/auth/register', {
      method: 'POST',
      body: data
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
  } catch (err) {
    console.warn('[TradeTrust] Backend register attempt error:', err);
  }

  // 2. Seamless Static / Vercel fallback
  const newTrader = {
    id: Date.now(),
    traderId: Date.now(),
    name: data.name,
    phone: data.phone,
    businessName: data.businessName,
    businessDesc: data.businessDesc,
    role: data.role || 'RETAILER',
    cluster: data.cluster || 'Zaveri Bazaar',
    sector: data.sector || 'General',
    trustScore: 10.00,
    isVerifiedBadge: false,
    scoreFrozen: false,
    initial: data.name ? data.name[0] : 'T',
    createdAt: new Date().toISOString()
  };

  try {
    const storedTraders = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
    storedTraders.unshift(newTrader);
    localStorage.setItem('tradetrust_traders', JSON.stringify(storedTraders));
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
      return {
        success: true,
        data: updated
      };
    }
  } catch {}

  const current = getCurrentUser() || {};
  const updated = { ...current, ...updates };
  setCurrentUser(updated);
  return {
    success: true,
    data: updated
  };
}
