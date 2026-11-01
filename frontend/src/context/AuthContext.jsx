import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, tokens } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const access = tokens.getAccess();
      if (access) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          localStorage.setItem('user_cache', JSON.stringify(profile));
        } catch (err) {
          console.warn('Auth token expired or invalid:', err.message);
          tokens.clear();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const { user: profile } = await authApi.login(username, password);
    setUser(profile);
    return profile;
  };

  const register = async (payload) => {
    return await authApi.register(payload);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const updated = await authApi.updateProfile(payload);
    setUser(updated);
    localStorage.setItem('user_cache', JSON.stringify(updated));
    return updated;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSeller: user?.role === 'seller',
    isCustomer: user?.role === 'customer',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
