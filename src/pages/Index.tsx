
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

export default function Index() {
  // Use React Query for data fetching
  const { 
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: ['featuredCourses'],
    queryFn: async () => {
      // Get first page of courses, sorted by rating (descending)
      const result = await CourseService.getAllCourses(1, 4, "rating_desc");
      return result.items;
    }
  });

  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return await CategoryService.getAllCategories();
    }
  });

  // Prepare data for components
  const categories = categoriesData || [];
  const courses = coursesData || [];

  // Map API response to match the format expected by components
  const mappedCourses = courses.map((course: Course) => ({
    id: course.id.toString(),
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    rating: course.rating || 0,
    price: course.price,
    category: course.categoryName || "Uncategorized",
    instructor: {
      id: course.instructorId || "",
      name: course.instructorName || "Unknown Instructor",
    },
    duration: `${course.durationInHours} hours`,
  }));

  const mappedCategories = categories.map((category: Category) => ({
    id: `category-${category.id}`,
    name: category.name,
    slug: category.name.toLowerCase().replace(/\s+/g, '-'),
    description: `Explore ${category.name} courses`,
    courseCount: 0, // We don't have this info from the API
    icon: "book" as const,
  }));

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
          <div className="flex justify-center py-12">
            <p>Loading courses...</p>
          </div>
        ) : coursesError ? (
          <div className="text-center py-8 text-red-500">
            <p>Failed to load courses. Please try again later.</p>
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
            <div className="flex justify-center py-12">
              <p>Loading categories...</p>
            </div>
          ) : categoriesError ? (
            <div className="text-center py-8 text-red-500">
              <p>Failed to load categories. Please try again later.</p>
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
