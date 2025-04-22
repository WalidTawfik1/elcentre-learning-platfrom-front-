
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types/user";

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if specified
  if (allowedRoles && user && !allowedRoles.includes(user.userType)) {
    // Redirect based on role
    if (user.userType === "student") {
      return <Navigate to="/dashboard" replace />;
    } else if (user.userType === "instructor") {
      return <Navigate to="/instructor/dashboard" replace />;
    } else if (user.userType === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Fallback
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
