'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, fetchCsrfToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      await fetchCsrfToken();
      const data = await api('/auth/me');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (loginField, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { login: loginField, password },
    });
    setUser(data.data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: userData,
    });
    setUser(data.data.user);
    return data;
  };

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
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
