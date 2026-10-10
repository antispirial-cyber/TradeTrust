import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser,
  login as apiLogin,
  adminLogin as apiAdminLogin,
  register as apiRegister,
  logout as apiLogout,
  updateCurrentUser as apiUpdateUser,
  fetchMe as apiFetchMe
} from '../api/auth';
import { getAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial hydration from local storage
    const active = getCurrentUser();
    setUser(active);
    setLoading(false);

    // 2. Fetch fresh user state from MySQL if session token exists
    const token = getAuthToken();
    if (token) {
      apiFetchMe()
        .then((fresh) => {
          if (fresh) {
            setUser(fresh);
          }
        })
        .catch(() => {
          // If token was invalid, apiClient 401 handler already fires session_expired
        });
    }

    const handleSync = () => {
      const refreshed = getCurrentUser();
      setUser(refreshed);
    };

    const handleScoreUpdated = () => {
      apiFetchMe().then((fresh) => {
        if (fresh) {
          setUser(fresh);
        } else {
          handleSync();
        }
      });
    };

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('tradetrust_score_updated', handleScoreUpdated);
    window.addEventListener('tradetrust_session_expired', handleSessionExpired);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('tradetrust_score_updated', handleScoreUpdated);
      window.removeEventListener('tradetrust_session_expired', handleSessionExpired);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res.success) {
      setUser(res.data);
    }
    return res;
  };

  const adminLogin = async (credentials) => {
    const res = await apiAdminLogin(credentials);
    if (res.success) {
      setUser(res.data);
    }
    return res;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    if (res.success) {
      setUser(res.data);
    }
    return res;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const res = await apiUpdateUser(updates);
    if (res.success) {
      setUser(res.data);
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
