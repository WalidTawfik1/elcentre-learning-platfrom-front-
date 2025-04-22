
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCourses } from "@/components/home/featured-courses";
import { CategoryList } from "@/components/home/category-list";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CourseService } from "@/services/course-service";
import { CategoryService } from "@/services/category-service";
import { Course, Category } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { LoadingIndicator } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for fallback when API is unavailable
const mockCourses = [
  {
    id: "1",
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript.",
    thumbnail: "/placeholder.svg",
    rating: 4.5,
    price: 49.99,
    category: "Web Development",
    instructor: {
      id: "1",
      name: "John Doe",
    },
    duration: "12 hours",
  },
  {
    id: "2",
    title: "Data Science Fundamentals",
    description: "Master the basics of data science, statistics, and machine learning algorithms.",
    thumbnail: "/placeholder.svg",
    rating: 4.8,
    price: 69.99,
    category: "Data Science",
    instructor: {
      id: "2",
      name: "Jane Smith",
    },
    duration: "15 hours",
  },
  {
    id: "3",
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile applications using React Native.",
    thumbnail: "/placeholder.svg",
    rating: 4.2,
    price: 59.99,
    category: "Mobile Development",
    instructor: {
      id: "3",
      name: "David Johnson",
    },
    duration: "10 hours",
  },
  {
    id: "4",
    title: "Advanced JavaScript Concepts",
    description: "Deep dive into advanced JavaScript concepts like closures, prototypes, and async/await.",
    thumbnail: "/placeholder.svg",
    rating: 4.7,
    price: 54.99,
    category: "Web Development",
    instructor: {
      id: "1",
      name: "John Doe",
    },
    duration: "8 hours",
  },
];

const mockCategories = [
  {
    id: "category-1",
    name: "Web Development",
    slug: "web-development",
    description: "Explore Web Development courses",
    courseCount: 24,
    icon: "book" as const,
  },
  {
    id: "category-2",
    name: "Data Science",
    slug: "data-science",
    description: "Explore Data Science courses",
    courseCount: 18,
    icon: "video" as const,
  },
  {
    id: "category-3",
    name: "Mobile Development",
    slug: "mobile-development",
    description: "Explore Mobile Development courses",
    courseCount: 12,
    icon: "users" as const,
  },
  {
    id: "category-4",
    name: "Cloud Computing",
    slug: "cloud-computing",
    description: "Explore Cloud Computing courses",
    courseCount: 15,
    icon: "book" as const,
  },
];

export default function Index() {
  // Use React Query for data fetching with fallback to mock data
  const { 
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: ['featuredCourses'],
    queryFn: async () => {
      try {
        // Get first page of courses, sorted by rating (descending)
        const result = await CourseService.getAllCourses(1, 4, "rating_desc");
        return result.items;
      } catch (error) {
        console.error("Failed to fetch courses, using mock data:", error);
        return [];
      }
    }
  });

  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        return await CategoryService.getAllCategories();
      } catch (error) {
        console.error("Failed to fetch categories, using mock data:", error);
        return [];
      }
    }
  });

  // Prepare data for components, fallback to mock data if needed
  const categories = categoriesData?.length ? categoriesData : [];
  const courses = coursesData?.length ? coursesData : [];

  // Use mock data when API fails
  const hasCourseData = courses && courses.length > 0;
  const hasCategoryData = categories && categories.length > 0;

  // Map API response to match the format expected by components
  const mappedCourses = hasCourseData ? courses.map((course: Course) => ({
    id: course.id.toString(),
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail || "/placeholder.svg",
    rating: course.rating || 0,
    price: course.price,
    category: course.categoryName || "Uncategorized",
    instructor: {
      id: course.instructorId || "",
      name: course.instructorName || "Unknown Instructor",
    },
    duration: `${course.durationInHours} hours`,
  })) : mockCourses;

  const mappedCategories = hasCategoryData ? categories.map((category: Category) => ({
    id: `category-${category.id}`,
    name: category.name,
    slug: category.name.toLowerCase().replace(/\s+/g, '-'),
    description: `Explore ${category.name} courses`,
    courseCount: 0, // We don't have this info from the API
    icon: "book" as const, // Default to 'book' icon for all categories from API
  })) : mockCategories;

  return (
    <MainLayout>
      <HeroSection />
      
      <section className="py-16 container">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <p className="text-muted-foreground">Explore our most popular courses</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses">View All</Link>
          </Button>
        </div>
        
        {isCoursesLoading ? (
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
        ) : coursesError ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Could not connect to course data.</p>
            <FeaturedCourses courses={mockCourses} />
          </div>
        ) : (
          <FeaturedCourses courses={mappedCourses} />
        )}
      </section>
      
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover courses in a variety of domains to enhance your skills and knowledge
            </p>
          </div>
          
          {isCategoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 text-center">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Could not connect to category data.</p>
              <CategoryList categories={mockCategories} />
            </div>
          ) : (
            <CategoryList categories={mappedCategories} />
          )}
        </div>
      </section>
      
      <section className="py-16 container">
        <div className="bg-eduBlue-500 text-white rounded-xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to start your learning journey?
              </h2>
              <p className="text-eduBlue-100 md:text-lg max-w-2xl">
                Join thousands of students already learning on our platform. 
                Get unlimited access to all courses with a membership.
              </p>
            </div>
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-eduBlue-500 hover:bg-eduBlue-50"
              asChild
            >
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
