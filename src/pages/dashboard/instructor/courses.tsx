import { useState, useEffect } from "react";
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

export default function InstructorCourses() {
  const navigate = useNavigate();  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [selectedCourseForCoupon, setSelectedCourseForCoupon] = useState<any | null>(null);

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    // Redirect if not authenticated or not an instructor
    if (!isAuthenticated || user?.userType !== "Instructor") {
        navigate("/login", { replace: true });
        return;
    }

    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const coursesData = await CourseService.getInstructorCourses();
        
        // Fetch enrollment counts for each course
        const coursesWithEnrollments = await Promise.all(
          coursesData.map(async (course: any) => {
            try {
              const enrollmentCount = await CourseService.getEnrollmentCount(course.id);
              return {
                ...course,
                studentsCount: enrollmentCount
              };
            } catch (error) {
              console.error(`Error fetching enrollment count for course ${course.id}:`, error);
              return {
                ...course,
                studentsCount: 0
              };
            }
          })
        );

        setCourses(Array.isArray(coursesWithEnrollments) ? coursesWithEnrollments : []);
      } catch (error) {
        console.error("Error fetching instructor courses:", error);
        toast({
          title: "Error",
          description: "Failed to load your courses. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };    fetchCourses();
  }, [isAuthenticated, authLoading, user, navigate]);

  // Format the thumbnail URL properly using getImageUrl function
  const formatThumbnailUrl = (thumbnail: string | undefined): string => {
    return getImageUrl(thumbnail);
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await CourseService.deleteCourse(courseId);
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      toast({
        title: "Course Deleted",
        description: "Your course has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageCoupons = (course: any) => {
    setSelectedCourseForCoupon(course);
    setCouponDialogOpen(true);
  };

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
              <div key={course.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                {/* Thumbnail Section */}
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={formatThumbnailUrl(course.thumbnail)}
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Status Badge - Top Left */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      course.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {course.isActive ? (
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
                  </div>

                  {/* Course Status Badge - Top Right */}
                  {course.courseStatus && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {course.courseStatus === "Approved" && "✓ Approved"}
                        {course.courseStatus === "Pending" && "⏳ Pending"}
                        {course.courseStatus === "Rejected" && "✗ Rejected"}
                      </span>
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
                            onClick={() => handleDeleteCourse(course.id)}
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
                      onClick={() => handleManageCoupons(course)}
                      title="Manage Coupon Codes"
                      className="bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 px-2 py-1.5 rounded-md transition-colors duration-200"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>

                    <Button 
                      className="flex-1"
                      asChild
                    >
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
                </div>
              </div>
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
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}