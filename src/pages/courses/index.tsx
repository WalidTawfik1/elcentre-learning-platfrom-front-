
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { CategoryService } from "@/services/category-service";
import { Course, Category } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useQuery } from "@tanstack/react-query";

// Mock data for fallback when API is unavailable
const MOCK_COURSES = [
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
  {
    id: "course-5",
    title: "Python Programming for Beginners",
    description: "Start your programming journey with Python, perfect for beginners.",
    thumbnail: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&h=300&fit=crop",
    rating: 4.7,
    price: 44.99,
    category: "Programming",
    instructor: {
      id: "instructor-1",
      name: "John Doe",
    },
    duration: "8 hours",
  },
  {
    id: "course-6",
    title: "Graphic Design Fundamentals",
    description: "Learn the principles of great design and how to use design tools effectively.",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
    rating: 4.3,
    price: 49.99,
    category: "Design",
    instructor: {
      id: "instructor-5",
      name: "Emily Chen",
    },
    duration: "9 hours",
  },
];

const MOCK_CATEGORIES = [
  { id: "cat-1", name: "All Categories" },
  { id: "cat-2", name: "Web Development" },
  { id: "cat-3", name: "Data Science" },
  { id: "cat-4", name: "Business" },
  { id: "cat-5", name: "Design" },
  { id: "cat-6", name: "Marketing" },
  { id: "cat-7", name: "Personal Development" },
  { id: "cat-8", name: "Programming" },
  { id: "cat-9", name: "Mobile Development" },
];

export default function CoursesIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Number of courses per page

  // Use React Query for data fetching
  const { 
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError,
    refetch: refetchCourses
  } = useQuery({
    queryKey: ['courses', currentPage, selectedCategory, searchTerm],
    queryFn: async () => {
      try {
        const categoryId = selectedCategory ? parseInt(selectedCategory) : undefined;
        return await CourseService.getAllCourses(
          currentPage, 
          pageSize, 
          "rating_desc", 
          categoryId,
          searchTerm.length > 0 ? searchTerm : undefined
        );
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        throw error;
      }
    }
  });

  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        return await CategoryService.getAllCategories();
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
      }
    }
  });

  // Prepare courses data for display
  const courses = coursesData?.items || [];
  const totalPages = coursesData?.totalPages || 1;
  
  // Prepare categories for the select input
  const categories = categoriesData?.length 
    ? [{ id: 0, name: "All Categories" }, ...categoriesData]
    : MOCK_CATEGORIES;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    refetchCourses();
  };

  // Function to generate pagination links
  const generatePaginationLinks = () => {
    const links = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Add ellipsis at the beginning if needed
    if (startPage > 1) {
      links.push(
        <PaginationItem key="start">
          <PaginationLink onClick={() => setCurrentPage(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        links.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis at the end if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      links.push(
        <PaginationItem key="end">
          <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return links;
  };

  // Map API courses to the format expected by CourseCard
  const mapApiCourseToCardFormat = (course: Course) => {
    return {
      id: course.id.toString(),
      title: course.title,
      description: course.description,
      thumbnail: CourseService.getCourseThumbnailUrl(course.thumbnail),
      rating: course.rating || 0,
      price: course.price,
      category: course.categoryName || "Uncategorized",
      instructor: {
        id: course.instructorId?.toString() || "",
        name: course.instructorName || "Unknown Instructor",
      },
      duration: `${course.durationInHours} hours`,
    };
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Courses</h1>
            <p className="text-muted-foreground">Discover courses to enhance your skills</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-8 w-full md:w-[260px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {isCoursesLoading || isCategoriesLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        ) : courses.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...mapApiCourseToCardFormat(course)}
                />
              ))}
            </div>
            
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {generatePaginationLinks()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-8">
              We couldn't find any courses matching your search criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setCurrentPage(1);
                refetchCourses();
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
