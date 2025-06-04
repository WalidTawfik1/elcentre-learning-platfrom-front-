import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  BookOpen, 
  Clock,
  Star,
  DollarSign,
  Users,
  Calendar,
  Tag
} from "lucide-react";
import { InstructorService } from "@/services/instructor-service";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";

interface InstructorCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  durationInHours: number;
  rating?: number;
  studentsCount?: number;
  categoryName?: string;
  createdAt?: string;
  isActive: boolean;
}

export default function InstructorCoursesPage() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [instructorName, setInstructorName] = useState<string>("");

  useEffect(() => {
    if (!instructorId) return;

    const fetchInstructorCourses = async () => {
      setIsLoading(true);
      try {
        const coursesData = await InstructorService.getInstructorCourses(instructorId);
        setCourses(coursesData);
        
        // Set instructor name from the first course if available
        if (coursesData.length > 0 && coursesData[0].instructorName) {
          setInstructorName(coursesData[0].instructorName);
        }
      } catch (error) {
        console.error("Error fetching instructor courses:", error);
        toast({
          title: "Error",
          description: "Failed to load instructor courses. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorCourses();
  }, [instructorId]);

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `${price} LE`;
  };

  const formatDuration = (hours: number) => {
    if (hours === 0) return "Self-paced";
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  };

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/instructors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Instructors
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              {isLoading ? (
                <Skeleton className="h-10 w-64 mx-auto" />
              ) : (
                `Courses by ${instructorName || "Instructor"}`
              )}
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore all courses created by this instructor
            </p>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-medium mb-2">No Courses Found</h3>
            <p className="text-muted-foreground">
              This instructor hasn't published any courses yet.
            </p>
          </div>
        ) : (
          <>
            {/* Course Count */}
            <div className="mb-6">
              <p className="text-lg text-muted-foreground">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
              </p>
            </div>

            {/* Courses Grid */}            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
                  {/* Course Thumbnail */}
                  <div className="aspect-video relative overflow-hidden flex-shrink-0">
                    <img
                      src={course.thumbnail ? getImageUrl(course.thumbnail) : "/placeholder.svg"}
                      alt={course.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge 
                      variant={course.isActive ? "default" : "secondary"}
                      className="absolute top-2 right-2"
                    >
                      {course.isActive ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <div className="flex flex-col flex-1">
                    <CardHeader className="pb-4 flex-shrink-0">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                        {course.title}
                      </CardTitle>
                      <div className="min-h-[1.5rem] flex items-center">
                        {course.categoryName && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Tag className="h-4 w-4" />
                            <span>{course.categoryName}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1 min-h-[4rem] mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {course.description}
                        </p>
                      </div>                      {/* Course Stats */}
                      <div className="grid grid-cols-2 gap-4 py-2 border-t border-b mb-4 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(course.durationInHours)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className={`h-4 w-4 ${course.rating && course.rating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          <span>{course.rating && course.rating > 0 ? course.rating.toFixed(1) : 'No rating'}</span>
                        </div>
                        {course.studentsCount !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{course.studentsCount} students</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(course.price)}</span>
                        </div>
                      </div>

                      {/* View Course Button */}
                      <div className="mt-auto flex-shrink-0">
                        <Button 
                          className="w-full" 
                          asChild
                          variant={course.isActive ? "default" : "secondary"}
                        >
                          <Link to={`/courses/${course.id}`}>
                            View Course Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Back to Instructors */}
        {!isLoading && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/instructors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse All Instructors
              </Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
