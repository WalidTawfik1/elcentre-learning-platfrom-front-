import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

/**
 * Component that redirects users to their appropriate courses page based on their role:
 * - Students go to /my-courses
 * - Instructors go to /instructor/courses
 * - Admins are redirected to dashboard
 */
export default function MyCoursesRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    return <Navigate to="/login?redirect=/my-courses" replace />;
  }

  // Redirect based on user type
  if (user?.userType === "Instructor") {
    return <Navigate to="/instructor/courses" replace />;
  } else if (user?.userType === "Admin") {
    return <Navigate to="/dashboard" replace />;
  } else {
    // Default for students
    return <Navigate to="/my-courses" replace />;
  }
}