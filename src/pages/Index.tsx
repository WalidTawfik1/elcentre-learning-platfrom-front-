import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { CourseSection } from "@/components/home/course-section";
import { CategorySection } from "@/components/home/category-section";
import { CTASection } from "@/components/home/cta-section";
import { SEO } from "@/components/seo/seo";
import { CourseService } from "@/services/course-service";
import { CategoryService } from "@/services/category-service";
import { Course, Category } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = isAuthenticated && user?.userType === "Admin";
  
  // Redirect logged-in users to their appropriate dashboard only on initial mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Only redirect if referrer is NOT empty and NOT from this site
      const isExternal =
        document.referrer &&
        !document.referrer.includes(window.location.origin);

      if (isExternal) {
        switch (user.userType) {
          case "Admin":
            navigate("/admin/dashboard", { replace: true });
            break;
          case "Instructor":
            navigate("/instructor/dashboard", { replace: true });
            break;
          case "Student":
          default:
            navigate("/dashboard", { replace: true });
            break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Use React Query for data fetching with fallback to mock data
  const { 
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: ['featuredCourses'],
    queryFn: async () => {
      try {
        // Fetch featured courses sorted by rating using the new endpoint
        const result = await CourseService.getFeaturedCourses(16);
        return result?.data || [];
      } catch (error) {
        console.error("Failed to fetch featured courses, using mock data:", error);
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

  const homePageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "ElCentre - Online Learning Platform",
    "description": "Discover thousands of courses in web development, data science, mobile development, and more. Learn from expert instructors and advance your career.",
    "url": "https://elcentre-learn.vercel.app/",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Top Rated Courses",
      "itemListElement": courses.slice(0, 6).map((course, index) => ({
        "@type": "Course",
        "position": index + 1,
        "name": course.title,
        "description": course.description,
        "provider": {
          "@type": "Organization",
          "name": "ElCentre"
        },
        "instructor": {
          "@type": "Person",
          "name": course.instructor?.name || "Expert Instructor"
        },
        "aggregateRating": course.rating ? {
          "@type": "AggregateRating",
          "ratingValue": course.rating,
          "bestRating": "5"
        } : undefined
      }))
    }
  };

  return (
    <MainLayout>
      <SEO
        title="ElCentre - Online Learning Platform | Courses, Skills & Career Development"
        description="Discover thousands of courses in web development, data science, mobile development, and more. Learn from expert instructors and advance your career with ElCentre."
        keywords="online learning, courses, education, web development, data science, mobile development, programming, skills, career development, ElCentre, tutorials"
        url="https://elcentre-learn.vercel.app/"
        structuredData={homePageStructuredData}
      />
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
