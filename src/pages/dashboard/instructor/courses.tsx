import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Users, DollarSign, Eye, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
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

export default function InstructorCourses() {
  const navigate = useNavigate();  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
              <Card key={course.id} className="overflow-hidden flex flex-col h-full">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={formatThumbnailUrl(course.thumbnail)}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                  <Badge 
                    variant={course.isActive ? "default" : "secondary"}
                    className="absolute top-2 right-2"
                  >
                    {course.isActive ? (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                        Published
                      </>
                    ) : (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5" />
                        Draft
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="flex flex-col flex-1">
                  <CardHeader className="p-4 pb-2 flex-shrink-0">
                    <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                    <div className="flex-1 min-h-[3rem] mb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden">
                        {course.description || "No description available"}
                      </p>
                    </div>
                    
                    {/* Course Status Badge - Fixed height section */}
                    <div className="min-h-[2rem] mb-3 flex items-start">
                      {course.courseStatus ? (
                        <Badge 
                          variant={
                            course.courseStatus === "Approved" ? "default" : 
                            course.courseStatus === "Pending" ? "secondary" : 
                            "destructive"
                          }
                          className={
                            course.courseStatus === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                            course.courseStatus === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                            "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {course.courseStatus === "Approved" && "✓ Approved"}
                          {course.courseStatus === "Pending" && "⏳ Pending Review"}
                          {course.courseStatus === "Rejected" && "✗ Rejected"}
                          {!["Approved", "Pending", "Rejected"].includes(course.courseStatus) && course.courseStatus}
                        </Badge>
                      ) : (
                        <div className="h-6"></div> /* Placeholder for consistent spacing */
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-auto">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{course.studentsCount?.toLocaleString() || 0} students</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{course.price === 0 ? "Free" : `${course.price} LE`}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="p-4 border-t">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
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
                    </div>
                    <Button 
                      variant="outline" 
                      className="hover:bg-blue-100 hover:text-blue-600" 
                      asChild
                    >
                      <Link to={`/courses/${course.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview & Manage
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