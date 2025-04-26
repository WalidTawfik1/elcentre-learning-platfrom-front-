import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { CategoryService } from "@/services/category-service";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "react-router-dom";

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

// Replace the mock categories with a simplified version that includes "All Categories"
const MOCK_CATEGORIES = [
  { id: 0, name: "All Categories" },
  { id: 1, name: "Web Development" },
  { id: 2, name: "Data Science" },
  { id: 3, name: "Business" },
  { id: 4, name: "Design" },
  { id: 5, name: "Marketing" },
  { id: 6, name: "Personal Development" },
  { id: 7, name: "Programming" },
  { id: 8, name: "Mobile Development" },
];

export default function CoursesIndex() {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0); // 0 is "All Categories"
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;
  
  // Get URL parameters for initial filter state
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');

  // Use React Query for data fetching
  const { 
    data: coursesData,
    isLoading: isCoursesLoading
  } = useQuery({
    queryKey: ['courses', currentPage, selectedCategory, searchTerm, priceRange],
    queryFn: async () => {
      try {
        // Only filter by category if not "All Categories"
        const categoryId = selectedCategory > 0 ? selectedCategory : undefined;
        
        // Convert string search term to a format the API expects
        const searchQuery = searchTerm.trim() || undefined;
        
        const result = await CourseService.getAllCourses(
          currentPage, 
          coursesPerPage, 
          undefined, // sort parameter
          categoryId,
          searchQuery,
          priceRange[0] > 0 ? priceRange[0] : undefined,
          priceRange[1] < 1000 ? priceRange[1] : undefined
        );
        
        console.log("API response for courses:", result);
        return result || { items: [], totalCount: 0 };
      } catch (error) {
        console.error("Failed to fetch courses, using mock data:", error);
        return { items: MOCK_COURSES, totalCount: MOCK_COURSES.length };
      }
    }
  });

  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading
  } = useQuery({
    queryKey: ['allCategories'],
    queryFn: async () => {
      try {
        const result = await CategoryService.getAllCategories();
        console.log("API response for all categories:", result);
        return [{ id: 0, name: "All Categories" }, ...(result || [])];
      } catch (error) {
        console.error("Failed to fetch categories, using mock data:", error);
        return MOCK_CATEGORIES;
      }
    }
  });

  // Prepare the course data to match the expected format for CourseCard
  const mapCourseData = (course: any) => ({
    id: course.id.toString(),
    title: course.title || "Untitled Course",
    description: course.description || "No description available",
    thumbnail: course.thumbnail || "/placeholder.svg",
    rating: course.rating || 0,
    price: course.price || 0,
    category: course.categoryName || "Uncategorized",
    instructor: {
      id: course.instructorId || "",
      name: course.instructorName || "Unknown Instructor",
    },
    duration: `${course.durationInHours || 0} hours`,
  });

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    const categoryId = parseInt(value);
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to page 1 when changing category
  };

  // Apply price filter
  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1); // Reset to page 1 when changing price
  };

  // Calculate pagination
  const totalCourses = coursesData?.totalCount || 0;
  const totalPages = Math.ceil(totalCourses / coursesPerPage);

  // Initialize filters from URL parameters when component mounts
  useEffect(() => {
    if (categoryParam) {
      const categoryId = parseInt(categoryParam);
      if (!isNaN(categoryId)) {
        setSelectedCategory(categoryId);
      }
    }
  }, [categoryParam]);

  // Update filtered courses when data changes
  useEffect(() => {
    if (coursesData?.items) {
      setFilteredCourses(coursesData.items.map(mapCourseData));
    }
  }, [coursesData]);

  // Use mock data if API fetch fails
  const categories = categoriesData || MOCK_CATEGORIES;
  const isLoading = isCoursesLoading || isCategoriesLoading;

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Courses</h1>
            <p className="text-muted-foreground">Discover courses to enhance your skills</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              type="search"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[200px] lg:w-[300px]"
            />
            <Button type="submit" variant="default">
              Search
            </Button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">Filter by Category</h3>
              <Select value={selectedCategory.toString()} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Price Range</h3>
              <div className="px-2">
                <Slider
                  defaultValue={[0, 1000]}
                  min={0}
                  max={1000}
                  step={50}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  className="mb-6"
                />
                <div className="flex items-center justify-between">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>
            
            {/* Additional filters can be added here */}
          </div>
          
          {/* Course Listings */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-[300px] rounded border bg-card">
                    <div className="h-[150px] bg-muted" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex justify-between items-center mt-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search term
                </p>
                <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(0);
                  setPriceRange([0, 1000]);
                }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} 
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      thumbnail={course.thumbnail}
                      rating={course.rating}
                      price={course.price}
                      category={course.category}
                      instructor={course.instructor}
                      duration={course.duration}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
