import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import VerifyAccount from "./pages/auth/verify-account";
import ForgetPassword from "./pages/auth/forget-password";
import CoursesIndex from "./pages/courses/index";
import CourseDetail from "./pages/courses/course-detail";
import ProfilePage from "./pages/profile";
import CategoriesIndex from "./pages/categories";
import MyCourses from "./pages/my-courses";
import CourseLearn from "./pages/my-courses/[id]/learn";
import StudentDashboard from "./pages/dashboard";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            <Route path="/forgot-password" element={<ForgetPassword />} />
            
            {/* Student routes */}
            <Route path="/courses" element={<CoursesIndex />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/categories" element={<CategoriesIndex />} />
            <Route path="/categories/:slug" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/instructors" element={<NotFound />} /> {/* Placeholder */}
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* My Courses routes */}
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-courses/:id/learn" element={<CourseLearn />} />
            
            <Route path="/instructor/dashboard" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/admin/dashboard" element={<NotFound />} /> {/* Placeholder */}
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
