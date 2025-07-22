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
      console.log("Fetching my courses data...");
      try {
        const enrollmentsData = await EnrollmentService.getStudentEnrollments();
        console.log("Student enrollments received:", enrollmentsData);
        
        if (Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
          setEnrollments(enrollmentsData);
          
          // Fetch course details in parallel for better performance
          console.log("Fetching course details in parallel...");
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
          console.log("Course details loaded:", successfulCourses.length, "courses");
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
        ) : (          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesData.map((course) => (
              <Card key={course.id} className="overflow-hidden flex flex-col h-full">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader className="p-4 pb-2 flex-shrink-0">
                  <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
                    {course.title}
                  </CardTitle>                  {course.instructorName && (                    <div className="flex items-center mt-1 min-h-[1.5rem]">
                      <Avatar className="h-5 w-5 mr-1.5">
                        <AvatarImage src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} alt={course.instructorName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(course.instructorName)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{course.instructorName}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                  <div className="flex-1 min-h-[3rem] mb-3">
                    <div 
                      className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                  </div>
                  <div className="space-y-3 mt-auto">
                    <div className="text-sm flex items-center justify-between">
                      <span>Progress</span>
                      <span className="font-medium">{Math.round(course.progress)}%</span>
                    </div>
                    <Progress value={course.progress} />
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t mt-auto">
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