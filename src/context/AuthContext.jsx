import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as apiLogin, adminLogin as apiAdminLogin, register as apiRegister, logout as apiLogout, updateCurrentUser as apiUpdateUser } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const active = getCurrentUser();
    setUser(active);
    setLoading(false);
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
