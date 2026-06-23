import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success) {
            setUser(res.data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Failed to load user profile:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser({
          _id: res._id,
          name: res.name,
          email: res.email,
          role: res.role
        });
        setLoading(false);
        return { success: true };
      } else {
        setError(res.message);
        setLoading(false);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = 'Connection to server failed. Please try again.';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.register(name, email, password);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser({
          _id: res._id,
          name: res.name,
          email: res.email,
          role: res.role
        });
        setLoading(false);
        return { success: true };
      } else {
        setError(res.message);
        setLoading(false);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = 'Registration failed. Check connection and try again.';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
