import { CourseCard } from "@/components/courses/course-card";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  rating: number;
  price: number;
  category: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  duration: string;
  language?: string; // Course language code
}

interface FeaturedCoursesProps {
  courses: Course[];
  showHeader?: boolean; // Optional prop to control header display
}

export function FeaturedCourses({ courses, showHeader = true }: FeaturedCoursesProps) {
  if (!courses || courses.length === 0) {
    return showHeader ? (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Featured Courses</h2>
          <p className="text-center text-gray-600">No courses available at the moment.</p>
        </div>
      </section>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-600">No courses available at the moment.</p>
      </div>
    );
  }

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          description={course.description}
          thumbnail={course.thumbnail}
          rating={course.rating}
          price={course.price}
          category={course.category}
          instructor={course.instructor}
          duration={course.duration}
          language={course.language}
        />
      ))}
    </div>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Courses</h2>
            <p className="text-gray-600 mt-2">Discover our highest-rated courses from expert instructors</p>
          </div>
          <button className="text-blue-500 font-medium hover:text-blue-600 transition-colors">
            View All
          </button>
        </div>
        {content}
      </div>
    </section>
  );
}
