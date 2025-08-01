import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
import { NotificationProvider } from "./hooks/use-notifications";
import { API_BASE_URL } from "./config/api-config";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import VerifyAccount from "./pages/auth/verify-account";
import ForgetPassword from "./pages/auth/forget-password";
import GoogleBridge from "./pages/auth/google-bridge";
import BlockedAccount from "./pages/auth/blocked";
import CoursesIndex from "./pages/courses/index";
import CourseDetail from "./pages/courses/course-detail";
import PreviewLesson from "./pages/courses/preview-lesson";
import ProfilePage from "./pages/profile";
import CategoriesIndex from "./pages/categories";
import MyCourses from "./pages/my-courses";
import CourseLearn from "./pages/my-courses/[id]/learn";
import StudentDashboard from "./pages/dashboard";
import InstructorCourses from "./pages/dashboard/instructor/courses";
import InstructorDashboard from "./pages/dashboard/instructor/index";
import AddCourse from "@/pages/dashboard/instructor/add-course";
import EditCourse from "@/pages/dashboard/instructor/edit-course";
import CourseContentManagement from "@/pages/dashboard/instructor/courses/[id]/content";
import MyCoursesRedirect from "@/components/navigation/my-courses-redirect";
import AdminDashboard from "@/pages/dashboard/admin/index";
import AdminCategories from "@/pages/dashboard/admin/categories";
import CreateAdminPage from "@/pages/dashboard/admin/create-admin";
import AdminPendingCoursesPage from "@/pages/admin/pending-courses";
import AdminDashboardNew from "@/pages/admin/index";
import UsersManagement from "@/pages/admin/users";
import CoursesManagement from "@/pages/admin/courses";
import AdminApiDocs from "@/pages/admin/api-docs";
import RequireAdminAuth from "@/components/auth/require-admin-auth";
import InstructorsPage from "@/pages/instructors/index";
import InstructorCoursesPage from "@/pages/instructors/[id]/courses";
import { NotificationDemo } from "@/components/notifications/notification-demo";
import { MainLayout } from "@/components/layouts/main-layout";

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
      <NotificationProvider>
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
            <Route path="/google-bridge" element={<GoogleBridge />} />
            <Route path="/auth/blocked" element={<BlockedAccount />} />
            
            {/* Student routes */}
            <Route path="/courses" element={<CoursesIndex />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/courses/:courseId/preview/:lessonId" element={<PreviewLesson />} />            <Route path="/categories" element={<CategoriesIndex />} />
            <Route path="/categories/:slug" element={<NotFound />} /> {/* Placeholder */}
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/instructors/:instructorId/courses" element={<InstructorCoursesPage />} />
              {/* Protected routes */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Notification demo route */}
            <Route path="/demo/notifications" element={
              <MainLayout>
                <div className="container py-8">
                  <NotificationDemo />
                </div>
              </MainLayout>
            } />
            
            {/* Dynamic My Courses redirection based on user role */}
            <Route path="/courses-redirect" element={<MyCoursesRedirect />} />
            
            {/* My Courses routes */}
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-courses/:id/learn" element={<CourseLearn />} />
            
            {/* Instructor routes */}
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/courses" element={<InstructorCourses/>} />
            <Route path="/dashboard/instructor/courses/new" element={<AddCourse />} />
            <Route path="/dashboard/instructor/courses/:id/edit" element={<EditCourse />} />
            <Route path="/dashboard/instructor/courses/:id/content" element={<CourseContentManagement />} />
              {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <RequireAdminAuth>
                <AdminDashboardNew />
              </RequireAdminAuth>
            } />
            <Route path="/admin/pending-courses" element={
              <RequireAdminAuth>
                <AdminPendingCoursesPage />
              </RequireAdminAuth>
            } />
            <Route path="/admin/users" element={
              <RequireAdminAuth>
                <UsersManagement />
              </RequireAdminAuth>
            } />
            <Route path="/admin/courses" element={
              <RequireAdminAuth>
                <CoursesManagement />
              </RequireAdminAuth>
            } />
            <Route path="/admin/api-docs" element={
              <RequireAdminAuth>
                <AdminApiDocs />
              </RequireAdminAuth>
            } />
            <Route path="/dashboard/admin" element={
              <RequireAdminAuth>
                <AdminDashboard />
              </RequireAdminAuth>
            } />
            <Route path="/dashboard/admin/categories" element={
              <RequireAdminAuth>
                <AdminCategories />
              </RequireAdminAuth>
            } />
            <Route path="/dashboard/admin/create-admin" element={
              <RequireAdminAuth>
                <CreateAdminPage />
              </RequireAdminAuth>            } />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <SpeedInsights />
        <Analytics />
      </TooltipProvider>
    </NotificationProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
