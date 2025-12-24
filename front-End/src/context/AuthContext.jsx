
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = useCallback((authToken, authUser) => {
    localStorage.setItem('token', authToken);
    if (authUser) {
      localStorage.setItem('user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('user');
    }
    setToken(authToken);
    setUser(authUser || null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((newUser) => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
    setUser(newUser || null);
  }, []);

  // Global response interceptor: auto-logout on 401 Unauthorized
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      API.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  const value = { token, user, login, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
