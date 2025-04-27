import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { CourseSection } from "@/components/home/course-section";
import { CategorySection } from "@/components/home/category-section";
import { CTASection } from "@/components/home/cta-section";
import { CourseService } from "@/services/course-service";
import { CategoryService } from "@/services/category-service";
import { Course, Category } from "@/types/api";
import { useQuery } from "@tanstack/react-query";

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
    courseCount: 15,
    icon: "book" as const,
  },
  {
    id: "category-4",
    name: "Business",
    slug: "business",
    description: "Explore Business courses",
    courseCount: 22,
    icon: "users" as const,
  },
  {
    id: "category-5",
    name: "Marketing",
    slug: "marketing",
    description: "Explore Marketing courses",
    courseCount: 10,
    icon: "users" as const,
  },
  {
    id: "category-6",
    name: "Design",
    slug: "design",
    description: "Explore Design courses",
    courseCount: 16,
    icon: "video" as const,
  },
  {
    id: "category-7",
    name: "Personal Development",
    slug: "personal-development",
    description: "Explore Personal Development courses",
    courseCount: 12,
    icon: "users" as const,
  },
  {
    id: "category-8",
    name: "Photography",
    slug: "photography",
    description: "Explore Photography courses",
    courseCount: 8,
    icon: "video" as const,
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
        // Fetch all courses using the specified endpoint with pagination
        const result = await CourseService.getAllCourses(1, 16);
        return result?.data || [];
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
        // Fetch all categories from the Category/get-all-categories endpoint
        const result = await CategoryService.getAllCategories();
        return result || [];
      } catch (error) {
        console.error("Failed to fetch categories, using mock data:", error);
        return [];
      }
    }
  });

  // Prepare data for components, fallback to mock data if needed
  const categories = categoriesData?.length ? categoriesData : mockCategories;
  const courses = coursesData?.length ? coursesData : mockCourses;

  return (
    <MainLayout>
      <HeroSection />
      <CourseSection 
        courses={courses} 
        isLoading={isCoursesLoading} 
        error={!!coursesError}
        mockCourses={mockCourses}
      />
      <CategorySection 
        categories={categories}
        isLoading={isCategoriesLoading}
        error={!!categoriesError}
        mockCategories={mockCategories}
      />
      <CTASection />
    </MainLayout>
  );
}
