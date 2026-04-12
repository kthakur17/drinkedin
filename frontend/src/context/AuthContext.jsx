/**
 * Auth Context
 * Provides current user, login/logout, and token management
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('drinkedin_token');
    const cached = localStorage.getItem('drinkedin_user');
    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (_) {}
    }
    if (token) {
      // Refresh user data
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('drinkedin_user', JSON.stringify(res.data.user));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('drinkedin_token', token);
    localStorage.setItem('drinkedin_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('drinkedin_token');
    localStorage.removeItem('drinkedin_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('drinkedin_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
