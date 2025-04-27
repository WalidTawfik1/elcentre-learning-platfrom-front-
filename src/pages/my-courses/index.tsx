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

// Backend base URL for serving static content
const API_BASE_URL = "http://elcentre.runasp.net";

export default function MyCourses() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/auth/login?redirect=/my-courses", { replace: true });
      return;
    }
    
    // Fetch enrollments
    const fetchEnrollments = async () => {
      setIsLoading(true);
      try {
        const enrollmentsData = await EnrollmentService.getStudentEnrollments();
                
        if (Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
          setEnrollments(enrollmentsData);
          
          // Fetch detailed course data for each enrollment
          const coursesDetailedData = await Promise.all(
            enrollmentsData.map(async (enrollment) => {
              try {
                const courseData = await CourseService.getCourseById(enrollment.courseId);
                return {
                  ...courseData,
                  enrollmentId: enrollment.id,
                  enrollmentStatus: enrollment.status,
                  progress: enrollment.progress || 0
                };
              } catch (error) {
                console.error(`Error fetching course ${enrollment.courseId}:`, error);
                return {
                  id: enrollment.courseId,
                  title: enrollment.courseName || "Unknown Course",
                  description: "Course details could not be loaded.",
                  thumbnail: "/placeholder.svg",
                  enrollmentId: enrollment.id,
                  enrollmentStatus: enrollment.status,
                  progress: enrollment.progress || 0
                };
              }
            })
          );
          
          setCoursesData(coursesDetailedData);
        } else {
          setEnrollments([]);
          setCoursesData([]);
        }
      } catch (error) {
        console.error("Error fetching enrollments:", error);
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
  }, [isAuthenticated, navigate]);
  
  // Format the thumbnail URL properly
  const formatThumbnailUrl = (thumbnail: string | undefined): string => {
    if (!thumbnail) return "/placeholder.svg";
    
    // If it's already a full URL, use it as is
    if (thumbnail.startsWith('http')) return thumbnail;
    
    // Otherwise, prefix with API base URL and ensure no double slashes
    return `${API_BASE_URL}/${thumbnail.replace(/^\//, '')}`;
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Courses</h1>
            <p className="text-muted-foreground">Continue learning and track your progress</p>
          </div>
          
          <Button asChild>
            <Link to="/courses">Browse More Courses</Link>
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
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <div className="flex justify-center">
              <GraduationCap className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-medium mt-4 mb-2">You're not enrolled in any courses yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Explore our course catalog to find courses that match your interests and career goals.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesData.map((course) => (
              <Card key={course.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={formatThumbnailUrl(course.thumbnail)}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg line-clamp-1">
                    {course.title}
                  </CardTitle>
                  {course.instructorName && (
                    <div className="flex items-center mt-1">
                      <Avatar className="h-5 w-5 mr-1.5">
                        <AvatarImage src={course.instructor?.avatar} alt={course.instructorName} />
                        <AvatarFallback>{course.instructorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{course.instructorName}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  <div className="space-y-3">
                    <div className="text-sm flex items-center justify-between">
                      <span>Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} />
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center text-xs text-muted-foreground">
                      {course.enrollmentStatus === "Completed" ? (
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{course.durationInHours ? `${course.durationInHours} hours` : "In Progress"}</span>
                        </div>
                      )}
                    </div>
                    <Button className="bg-eduBlue-500 hover:bg-eduBlue-600" asChild>
                      <Link to={`/my-courses/${course.id}/learn`}>
                        <Play className="h-4 w-4 mr-2" /> Continue Learning
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}