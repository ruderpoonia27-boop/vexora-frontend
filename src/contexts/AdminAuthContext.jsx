import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    if (admin) {
      setCurrentAdmin(JSON.parse(admin));
    }
    setInitialLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      if (!data.user.isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }
      apiClient.token = data.token;
      localStorage.setItem('admin', JSON.stringify(data.user));
      setCurrentAdmin(data.user);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Admin login failed');
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('admin');
    setCurrentAdmin(null);
    apiClient.token = null;
  };

  const value = {
    currentAdmin,
    isAdminAuthenticated: !!currentAdmin,
    adminLogin,
    adminLogout,
    initialLoading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!initialLoading && children}
    </AdminAuthContext.Provider>
  );
};