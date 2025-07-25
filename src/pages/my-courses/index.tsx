import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, Play, GraduationCap } from "lucide-react";
import { EnrollmentService } from "@/services/enrollment-service";
import { CourseService } from "@/services/course-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";

export default function MyCourses() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [coursesData, setCoursesData] = useState<any[]>([]);  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    // Redirect to login if not authenticated after loading is complete
    if (!isAuthenticated) {
      navigate("/login?redirect=/my-courses", { replace: true });
      return;
    }

  // Function to fetch enrollments 
  const fetchEnrollments = async () => {
      setIsLoading(true);
      try {
        const enrollmentsData = await EnrollmentService.getStudentEnrollments();
        
        if (Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
          setEnrollments(enrollmentsData);
          
          // Fetch course details in parallel for better performance
          const coursesDetailedData = await Promise.allSettled(
            enrollmentsData.map(async (enrollment) => {
              const courseData = await CourseService.getCourseById(enrollment.courseId);
              return {
                ...courseData,
                enrollmentId: enrollment.id,
                enrollmentStatus: enrollment.status,
                progress: enrollment.progress || 0
              };
            })
          );
          
          // Filter successful results only
          const successfulCourses = coursesDetailedData
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value);
          
          setCoursesData(successfulCourses);
        } else {
          setEnrollments([]);
          setCoursesData([]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your enrolled courses. Please try again.",
          variant: "destructive",
        });
        setEnrollments([]);
        setCoursesData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEnrollments();
  }, [isAuthenticated, authLoading, navigate]);

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">          <div>
            <h1 className="text-3xl font-bold mb-2">My Courses</h1>
            <p className="text-muted-foreground">Continue learning and track your progress</p>
          </div>
          
          <Button asChild>
            <Link to="/courses">Browse More Courses</Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="flex flex-col flex-1 p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-9 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-center">
              <GraduationCap className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">You're not enrolled in any courses yet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Explore our course catalog to find courses that match your interests and career goals.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesData.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                {/* Thumbnail Section */}
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Progress Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      {Math.round(course.progress)}% Complete
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-4">
                  {/* Header Section */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
                      {course.title}
                    </h3>
                    
                    {/* Instructor Info */}
                    {course.instructorName && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage 
                            src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} 
                            alt={course.instructorName} 
                          />
                          <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-medium">
                            {getInitials(course.instructorName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{course.instructorName}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex-1 mb-3">
                    <div 
                      className="text-sm text-gray-500 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  </div>

                  {/* Progress Section */}
                  <div className="mb-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-blue-600">{Math.round(course.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="flex items-center justify-between mb-3 py-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-500">
                      {course.enrollmentStatus === "Completed" ? (
                        <>
                          <BookOpen className="h-4 w-4" />
                          <span className="text-sm font-medium text-green-600">Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{course.durationInHours ? `${course.durationInHours} hours` : "In Progress"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="flex items-center justify-center">
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200" 
                      asChild
                    >
                      <Link to={`/my-courses/${course.id}/learn`}>
                        <Play className="h-4 w-4 mr-2" /> 
                        {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}