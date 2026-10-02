import { apiClient, setAuthToken } from './client';

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

  return {
    success: false,
    message: res.message || 'Invalid credentials'
  };
}

export async function register(data) {
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

  return {
    success: false,
    message: res.message || 'Registration failed'
  };
}

export async function logout() {
  await apiClient('/api/auth/logout', { method: 'POST' });
  setAuthToken(null);
  setCurrentUser(null);
  return {
    success: true
  };
}

export async function updateCurrentUser(updates) {
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

  return {
    success: false,
    message: res.message || 'Failed to update profile'
  };
}
