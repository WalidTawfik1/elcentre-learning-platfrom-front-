import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

/**
 * Component that ensures the user is authenticated and has admin role
 * before allowing access to protected admin routes
 */
const RequireAdminAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // While authentication is being checked, show loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  // If authenticated but not an admin, redirect to home page
  if (user?.userType !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated and is an admin, render the protected content
  return <>{children}</>;
};

export default RequireAdminAuth;