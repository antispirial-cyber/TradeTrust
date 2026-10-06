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

export function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function login({ phone, password }) {
  const cleanPhone = normalizePhone(phone);
  const cleanPass = (password || '').trim();

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

    // If backend is active and responded with 401 Unauthorized or 400 Bad Request
    if (res && (res.status === 401 || res.status === 400)) {
      return {
        success: false,
        message: res.message || 'Invalid phone number or password'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend login attempt error:', err);
  }

  // 2. Seamless Static / Vercel fallback (when backend server is not running on the static host)
  let authenticatedUser = null;

  // Check seed trader: Rajesh Mehta (9820012345 / password123)
  if (cleanPhone === '9820012345') {
    if (cleanPass && cleanPass !== 'password123') {
      return {
        success: false,
        message: 'Incorrect password for seed trader account.'
      };
    }
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
    let storedTraders = [];
    try {
      storedTraders = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
      authenticatedUser = storedTraders.find(t => normalizePhone(t.phone) === cleanPhone);
    } catch {}

    if (authenticatedUser) {
      if (authenticatedUser.password && cleanPass && authenticatedUser.password !== cleanPass) {
        return {
          success: false,
          message: 'Incorrect password. Please verify and try again.'
        };
      }
    } else {
      // Check initial mock traders
      authenticatedUser = INITIAL_TRADERS.find(t => normalizePhone(t.phone) === cleanPhone);
      if (authenticatedUser) {
        if (cleanPass && cleanPass !== 'password123') {
          return {
            success: false,
            message: 'Incorrect password. Demo accounts use password: password123'
          };
        }
      }
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
    message: 'Trader account not found. Please register your business or use Demo Login.'
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

    // If backend is active and returned 409 Conflict (phone already exists) or 400 Bad Request
    if (res && (res.status === 409 || res.status === 400)) {
      return {
        success: false,
        message: res.message || 'Registration failed: Phone number already exists.'
      };
    }
  } catch (err) {
    console.warn('[TradeTrust] Backend register attempt error:', err);
  }

  // 2. Seamless Static / Vercel fallback
  const newTrader = {
    id: Date.now(),
    traderId: Date.now(),
    name: (data.name || '').trim(),
    phone: cleanPhoneNum,
    password: cleanPass, // Persist password so login checks work seamlessly on Vercel
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
    let storedTraders = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
    const existingIdx = storedTraders.findIndex(t => normalizePhone(t.phone) === cleanPhoneNum);
    if (existingIdx >= 0) {
      storedTraders[existingIdx] = newTrader;
    } else {
      storedTraders.unshift(newTrader);
    }
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

      try {
        const stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
        const idx = stored.findIndex(t => String(t.id || t.traderId) === String(updated.id || updated.traderId));
        if (idx >= 0) {
          stored[idx] = { ...stored[idx], ...res.data };
          localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
        }
      } catch {}

      return {
        success: true,
        data: updated
      };
    }
  } catch {}

  const current = getCurrentUser() || {};
  const updated = { ...current, ...updates };
  setCurrentUser(updated);

  try {
    const stored = JSON.parse(localStorage.getItem('tradetrust_traders') || '[]');
    const idx = stored.findIndex(t => String(t.id || t.traderId) === String(updated.id || updated.traderId));
    if (idx >= 0) {
      stored[idx] = { ...stored[idx], ...updates };
      localStorage.setItem('tradetrust_traders', JSON.stringify(stored));
    }
  } catch {}

  return {
    success: true,
    data: updated
  };
}
