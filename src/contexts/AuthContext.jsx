import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'currentUser';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    apiClient.token = token;
    try {
      const data = await apiClient.get('/auth/me');
      setCurrentUser(data.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        apiClient.token = null;
        localStorage.removeItem(USER_STORAGE_KEY);
        setCurrentUser(null);
      }
      return null;
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const cachedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (cachedUser && localStorage.getItem('token')) {
        try {
          setCurrentUser(JSON.parse(cachedUser));
        } catch {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      await refreshUser();
      setInitialLoading(false);
    };

    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        refreshUser();
      }
    };

    restoreSession();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      apiClient.token = data.token;
      setCurrentUser(data.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (data) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      apiClient.token = response.token;
      setCurrentUser(response.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      return response;
    } catch (error) {
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    apiClient.token = null;
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    signup,
    logout,
    refreshUser,
    initialLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};
