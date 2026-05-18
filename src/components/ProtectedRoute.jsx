
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const RedirectWithToast = ({ to, message }) => {
  useEffect(() => {
    toast.error(message);
  }, [message]);
  
  return <Navigate to={to} replace />;
};

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, currentUser, initialLoading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !currentUser?.isAdmin) {
    return <RedirectWithToast 
      to="/home" 
      message="Access denied. Admin panel is only available to authorized administrators." 
    />;
  }

  return children;
};
