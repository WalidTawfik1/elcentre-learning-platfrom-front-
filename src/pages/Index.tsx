
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedCourses } from "@/components/home/featured-courses";
import { CategoryList } from "@/components/home/category-list";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Mock data for development
const MOCK_FEATURED_COURSES = [
  {
    id: "course-1",
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of web development, including HTML, CSS, and JavaScript.",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=300&fit=crop",
    rating: 4.7,
    price: 49.99,
    category: "Web Development",
    instructor: {
      id: "instructor-1",
      name: "John Doe",
    },
    duration: "10 hours",
  },
  {
    id: "course-2",
    title: "Data Science Fundamentals",
    description: "Master the basics of data science, statistics, and machine learning algorithms.",
    thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=300&fit=crop",
    rating: 4.5,
    price: 59.99,
    category: "Data Science",
    instructor: {
      id: "instructor-2",
      name: "Jane Smith",
    },
    duration: "12 hours",
  },
  {
    id: "course-3",
    title: "Digital Marketing Masterclass",
    description: "Learn effective digital marketing strategies for businesses of all sizes.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
    rating: 4.8,
    price: 0,
    category: "Marketing",
    instructor: {
      id: "instructor-3",
      name: "Sarah Johnson",
    },
    duration: "8 hours",
  },
  {
    id: "course-4",
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile apps using React Native and JavaScript.",
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=300&fit=crop",
    rating: 4.6,
    price: 69.99,
    category: "Mobile Development",
    instructor: {
      id: "instructor-4",
      name: "Michael Brown",
    },
    duration: "15 hours",
  },
];

const MOCK_CATEGORIES = [
  {
    id: "category-1",
    name: "Web Development",
    slug: "web-development",
    description: "Learn to build dynamic websites and web applications",
    courseCount: 42,
    icon: "book" as const,
  },
  {
    id: "category-2",
    name: "Data Science",
    slug: "data-science",
    description: "Master data analysis and machine learning",
    courseCount: 35,
    icon: "users" as const,
  },
  {
    id: "category-3",
    name: "Business",
    slug: "business",
    description: "Develop essential business and management skills",
    courseCount: 28,
    icon: "users" as const,
  },
  {
    id: "category-4",
    name: "Design",
    slug: "design",
    description: "Create stunning visual content and user interfaces",
    courseCount: 24,
    icon: "video" as const,
  },
  {
    id: "category-5",
    name: "Marketing",
    slug: "marketing",
    description: "Learn effective digital and traditional marketing strategies",
    courseCount: 19,
    icon: "book" as const,
  },
  {
    id: "category-6",
    name: "Personal Development",
    slug: "personal-development",
    description: "Improve your personal and professional skills",
    courseCount: 31,
    icon: "users" as const,
  },
];

export default function Index() {
  // In a real app, we would fetch this data from the API
  const [featuredCourses, setFeaturedCourses] = useState(MOCK_FEATURED_COURSES);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);

  // You would use useEffect to fetch real data here
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const coursesResponse = await fetch("http://elcentre.runasp.net/courses/featured");
  //       const coursesData = await coursesResponse.json();
  //       setFeaturedCourses(coursesData);
  //
  //       const categoriesResponse = await fetch("http://elcentre.runasp.net/categories");
  //       const categoriesData = await categoriesResponse.json();
  //       setCategories(categoriesData);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   
  //   fetchData();
  // }, []);

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
        <FeaturedCourses courses={featuredCourses} />
      </section>
      
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover courses in a variety of domains to enhance your skills and knowledge
            </p>
          </div>
          <CategoryList categories={categories} />
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
