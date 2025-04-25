
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FeaturedCourses } from "@/components/home/featured-courses";
import { Skeleton } from "@/components/ui/skeleton";
import { Course } from "@/types/api";
import { CourseService } from "@/services/course-service";
import { API_BASE_URL } from "@/services/api";

interface CourseSectionProps {
  courses: any[];
  isLoading: boolean;
  error: boolean;
  mockCourses: any[];
}

export function CourseSection({ courses, isLoading, error, mockCourses }: CourseSectionProps) {
  // Map API response to match the format expected by components
  const mappedCourses = courses?.length ? courses.map((course: Course) => {
    let thumbnailUrl = course.thumbnail || "/placeholder.svg";
    
    // If the thumbnail path is relative, make it absolute
    if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/placeholder')) {
      thumbnailUrl = `${API_BASE_URL}${thumbnailUrl}`;
    }
    
    return {
      id: course.id.toString(),
      title: course.title,
      description: course.description,
      thumbnail: thumbnailUrl,
      rating: course.rating || 0,
      price: course.price,
      category: course.categoryName || "Uncategorized",
      instructor: {
        id: course.instructorId?.toString() || "",
        name: course.instructorName || "Unknown Instructor",
      },
      duration: `${course.durationInHours} hours`,
    };
  }) : mockCourses;

  return (
    <section className="py-16 container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Featured Courses</h2>
          <p className="text-muted-foreground">Explore our most popular courses</p>
        </div>
        <Button 
          variant="outline" 
          className="border-eduPurple-500 text-eduPurple-500 hover:bg-eduPurple-50" 
          asChild
        >
          <Link to="/courses">View All</Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden border">
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Could not connect to course data.</p>
          <FeaturedCourses courses={mockCourses} />
        </div>
      ) : (
        <FeaturedCourses courses={mappedCourses} />
      )}
    </section>
  );
}
