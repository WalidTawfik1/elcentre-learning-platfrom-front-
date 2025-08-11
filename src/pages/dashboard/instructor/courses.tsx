import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Users, DollarSign, Eye, Clock, AlertCircle, CheckCircle2, TrendingUp, Tag } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CouponCodeManager } from "@/components/admin/coupon-code-manager";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function InstructorCourses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [selectedCourseForCoupon, setSelectedCourseForCoupon] = useState<any | null>(null);

  // Redirect logic with early return
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || user?.userType !== "Instructor") {
      navigate("/login", { replace: true });
      return;
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Fetch courses with React Query for better caching and performance
  const { 
    data: courses = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['instructor-courses', user?.id],
    queryFn: async () => {
      const coursesData = await CourseService.getInstructorCourses();
      
      // Batch enrollment count requests with Promise.allSettled for better error handling
      const enrollmentPromises = coursesData.map(async (course: any) => {
        try {
          const enrollmentCount = await CourseService.getEnrollmentCount(course.id);
          return { courseId: course.id, count: enrollmentCount };
        } catch (error) {
          console.warn(`Failed to fetch enrollment for course ${course.id}:`, error);
          return { courseId: course.id, count: 0 };
        }
      });

      const enrollmentResults = await Promise.allSettled(enrollmentPromises);
      
      // Map enrollment counts back to courses
      const enrollmentMap = new Map<number, number>();
      enrollmentResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          enrollmentMap.set(result.value.courseId, result.value.count);
        }
      });

      return coursesData.map((course: any) => ({
        ...course,
        studentsCount: enrollmentMap.get(course.id) || 0
      }));
    },
    enabled: !authLoading && isAuthenticated && user?.userType === "Instructor",
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Memoized thumbnail URL formatter
  const formatThumbnailUrl = useCallback((thumbnail: string | undefined): string => {
    return getImageUrl(thumbnail);
  }, []);

  // Optimized delete handler with optimistic updates
  const handleDeleteCourse = useCallback(async (courseId: number) => {
    try {
      // Optimistic update
      queryClient.setQueryData(['instructor-courses', user?.id], (oldData: any[] = []) => 
        oldData.filter(course => course.id !== courseId)
      );

      await CourseService.deleteCourse(courseId);
      
      toast({
        title: "Course Deleted",
        description: "Your course has been deleted successfully.",
      });
    } catch (error) {
      // Revert optimistic update on error
      refetch();
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  }, [queryClient, user?.id, refetch]);

  const handleManageCoupons = useCallback((course: any) => {
    setSelectedCourseForCoupon(course);
    setCouponDialogOpen(true);
  }, []);

  // Don't render anything while auth is loading
  if (authLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-card">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Failed to load courses</h3>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Courses</h1>
            <p className="text-muted-foreground">Manage and track your created courses</p>
          </div>
          
          <Button asChild>
            <Link to="/dashboard/instructor/courses/new">
              <Plus className="h-4 w-4 mr-2" /> Create New Course
            </Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-card">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <div className="flex justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-medium mt-4 mb-2">No courses created yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start creating your first course and share your knowledge with students.
            </p>
            <Button asChild>
              <Link to="/dashboard/instructor/courses/new">Create Your First Course</Link>
            </Button>
          </div>        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onDelete={handleDeleteCourse}
                onManageCoupons={handleManageCoupons}
                formatThumbnailUrl={formatThumbnailUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Coupon Management Dialog */}
      {selectedCourseForCoupon && couponDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Coupon Codes for "{selectedCourseForCoupon.title}"
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Create and manage discount codes for this course
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCouponDialogOpen(false);
                    setSelectedCourseForCoupon(null);
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6">
              <CouponCodeManager
                courseId={selectedCourseForCoupon.id}
                courseName={selectedCourseForCoupon.title}
                coursePrice={selectedCourseForCoupon.price || 0}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// Memoized Course Card Component for better performance
const CourseCard = React.memo<{
  course: any;
  onDelete: (id: number) => void;
  onManageCoupons: (course: any) => void;
  formatThumbnailUrl: (thumbnail: string | undefined) => string;
}>(({ course, onDelete, onManageCoupons, formatThumbnailUrl }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      {/* Thumbnail Section */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={formatThumbnailUrl(course.thumbnail)}
          alt={course.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Status Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <StatusBadge isActive={course.isActive} />
        </div>

        {/* Course Status Badge - Top Right */}
        {course.courseStatus && (
          <div className="absolute top-3 right-3">
            <CourseStatusBadge status={course.courseStatus} />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        {/* Header Section */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
            {course.title}
          </h3>
          
          {/* Course Info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{course.durationInHours ? `${course.durationInHours} hours` : "Course"}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 mb-3">
          <div 
            className="text-sm text-gray-500 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
          />
        </div>

        {/* Stats Section */}
        <div className="mb-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{course.studentsCount?.toLocaleString() || 0} students</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{course.price === 0 ? "Free" : `${course.price} EGP`}</span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <CourseCardActions
          course={course}
          onDelete={onDelete}
          onManageCoupons={onManageCoupons}
        />
      </div>
    </div>
  );
});

// Memoized Action Buttons
const CourseCardActions = React.memo<{
  course: any;
  onDelete: (id: number) => void;
  onManageCoupons: (course: any) => void;
}>(({ course, onDelete, onManageCoupons }) => (
  <div className="flex items-center gap-2">
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 px-2 py-1.5 rounded-md transition-colors duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            course and remove all related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(course.id)}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Button 
      variant="outline" 
      size="sm"
      onClick={() => onManageCoupons(course)}
      title="Manage Coupon Codes"
      className="bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 px-2 py-1.5 rounded-md transition-colors duration-200"
    >
      <Tag className="h-4 w-4" />
    </Button>

    <Button className="flex-1" asChild>
      <Link to={`/my-courses/${course.id}/learn?instructor=true`}>
        <Eye className="h-4 w-4 mr-2" />
        View Course
      </Link>
    </Button>
    
    <Button
      className="flex-1 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 px-3"
      variant="outline"
      asChild
    >
      <Link to={`/courses/${course.id}`}>
        Manage
      </Link>
    </Button> 
  </div>
));

// Memoized Status Badge
const StatusBadge = React.memo<{ isActive: boolean }>(({ isActive }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
    isActive 
      ? 'bg-green-500 text-white' 
      : 'bg-gray-500 text-white'
  }`}>
    {isActive ? (
      <>
        <div className="inline-block h-1.5 w-1.5 rounded-full bg-white mr-1.5" />
        Published
      </>
    ) : (
      <>
        <div className="inline-block h-1.5 w-1.5 rounded-full bg-white mr-1.5" />
        Draft
      </>
    )}
  </span>
));

// Memoized Course Status Badge
const CourseStatusBadge = React.memo<{ status: string }>(({ status }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
    status === "Approved" ? "bg-green-500 text-white" :
    status === "Pending" ? "bg-yellow-500 text-white" :
    status === "Rejected" ? "bg-red-500 text-white" :
    "bg-gray-500 text-white"
  }`}>
    {status === "Approved" && "✓ Approved"}
    {status === "Pending" && "⏳ Pending"}
    {status === "Rejected" && "✗ Rejected"}
  </span>
));