
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
import CoursesIndex from "./pages/courses/index";
import CourseDetail from "./pages/courses/course-detail";

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
            
            {/* Student routes */}
            <Route path="/courses" element={<CoursesIndex />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/categories" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/categories/:slug" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/instructors" element={<NotFound />} /> {/* Placeholder */}
            
            {/* Protected routes - will be implemented later */}
            <Route path="/dashboard" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/profile" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/my-courses" element={<NotFound />} /> {/* Placeholder */}
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
