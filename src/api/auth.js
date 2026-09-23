const AUTH_USER_KEY = 'tradetrust_current_user';

export function getCurrentUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure we don't hold the old default Mehta user
      if (parsed && parsed.name === 'Rajesh Mehta') {
        localStorage.removeItem(AUTH_USER_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  }
  return null;
}

export async function login({ phone, password }) {
  // Demonstration mode: frontend only
  return {
    success: false,
    message: "Coming Soon 🔧"
  };
}

export async function register(data) {
  // Demonstration mode: frontend only
  return {
    success: false,
    message: "Coming Soon 🔧"
  };
}

export async function logout() {
  localStorage.removeItem(AUTH_USER_KEY);
  return {
    success: true
  };
}

export async function updateCurrentUser(updates) {
  const current = getCurrentUser();
  if (!current) return { success: false };
  const updated = { ...current, ...updates };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  return {
    success: true,
    data: updated
  };
}
