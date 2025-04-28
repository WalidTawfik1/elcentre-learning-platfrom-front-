import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Users, DollarSign } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";

// Backend base URL for serving static content
const API_BASE_URL = "http://elcentre.runasp.net";

export default function InstructorCourses() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated or not an instructor
    if (!isAuthenticated || user?.userType !== "Instructor") {
        navigate("/auth/login", { replace: true });
        return;
 }

    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const coursesData = await CourseService.getInstructorCourses();
        setCourses(Array.isArray(coursesData) ? coursesData : []);
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
    };

    fetchCourses();
  }, [isAuthenticated, user, navigate]);

  // Format the thumbnail URL properly
  const formatThumbnailUrl = (thumbnail: string | undefined): string => {
    if (!thumbnail) return "/placeholder.svg";
    if (thumbnail.startsWith('http')) return thumbnail;
    return `${API_BASE_URL}/${thumbnail.replace(/^\//, '')}`;
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={formatThumbnailUrl(course.thumbnail)}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                  <Badge className="absolute top-2 right-2">
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg line-clamp-1">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{course.enrollmentsCount || 0} students</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{course.price === 0 ? "Free" : `${course.price} LE`}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <div className="w-full flex justify-between items-center">
                    <Button variant="outline" asChild>
                      <Link to={`/dashboard/instructor/courses/${course.id}`}>
                        Manage Course
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to={`/courses/${course.id}`}>Preview</Link>
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