import { apiClient, setAuthToken } from './client';

const AUTH_USER_KEY = 'tradetrust_current_user';

export function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function formatUser(user) {
  if (!user) return null;
  const photo = user.photoPath || user.photoUrl || null;
  const initial = user.initial || (user.businessName ? user.businessName[0].toUpperCase() : (user.name ? user.name[0].toUpperCase() : 'U'));
  return {
    ...user,
    id: user.traderId || user.id,
    traderId: user.traderId || user.id,
    photoPath: photo,
    photoUrl: photo,
    initial
  };
}

export function getCurrentUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return formatUser(parsed);
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }
  return null;
}

export function setCurrentUser(user) {
  if (user) {
    const formatted = formatUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(formatted));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export async function login({ phone, password }) {
  const cleanPhone = normalizePhone(phone) || (phone || '').trim();
  const cleanPass = (password || '').trim();

  if (cleanPhone.toLowerCase() === 'admin') {
    return adminLogin({ username: cleanPhone, password: cleanPass });
  }

  const res = await apiClient('/api/auth/login', {
    method: 'POST',
    body: { phone: cleanPhone, password: cleanPass }
  });

  if (res.success && res.data) {
    const rawUser = res.data.user || res.data;
    const user = formatUser(rawUser);
    const token = res.data.token;
    if (token) setAuthToken(token);
    setCurrentUser(user);
    return {
      success: true,
      data: user,
      message: res.message || 'Login successful'
    };
  }

  return {
    success: false,
    message: res.message || 'Invalid credentials'
  };
}

export async function adminLogin({ username, password }) {
  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  const res = await apiClient('/api/auth/admin-login', {
    method: 'POST',
    body: { username: cleanUser, password: cleanPass }
  });

  if (res.success && res.data) {
    const rawUser = res.data.user || res.data;
    const user = formatUser(rawUser);
    const token = res.data.token;
    if (token) setAuthToken(token);
    setCurrentUser(user);
    return {
      success: true,
      data: user,
      message: res.message || 'Admin login successful'
    };
  }

  return {
    success: false,
    message: res.message || 'Invalid admin credentials'
  };
}

export async function register(data) {
  const res = await apiClient('/api/auth/register', {
    method: 'POST',
    body: {
      ...data,
      phone: normalizePhone(data.phone) || String(data.phone || '').trim(),
      password: (data.password || '').trim()
    }
  });

  if (res.success && res.data) {
    const rawUser = res.data.user || res.data;
    const user = formatUser(rawUser);
    const token = res.data.token;
    if (token) setAuthToken(token);
    setCurrentUser(user);
    return {
      success: true,
      data: user,
      message: res.message || 'Registration successful'
    };
  }

  return {
    success: false,
    message: res.message || 'Registration failed'
  };
}

export async function logout() {
  try {
    await apiClient('/api/auth/logout', { method: 'POST' });
  } catch {}
  setAuthToken(null);
  setCurrentUser(null);
  return { success: true };
}

export async function fetchMe() {
  const res = await apiClient('/api/auth/me');
  if (res.success && res.data) {
    const user = formatUser(res.data);
    setCurrentUser(user);
    return user;
  }
  return null;
}

export async function updateCurrentUser(updates) {
  const res = await apiClient('/api/trader/profile', {
    method: 'POST',
    body: updates
  });

  if (res.success && res.data) {
    const current = getCurrentUser() || {};
    const updated = formatUser({ ...current, ...res.data });
    setCurrentUser(updated);
    window.dispatchEvent(new Event('tradetrust_score_updated'));
    return {
      success: true,
      data: updated
    };
  }

  return {
    success: false,
    message: res.message || 'Failed to update profile'
  };
}

export async function changePassword(newPassword) {
  const res = await apiClient('/api/trader/password', {
    method: 'POST',
    body: { newPassword, password: newPassword }
  });
  return res;
}

