import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCardSkeleton } from "@/components/courses/course-card-skeleton";
import { SEO } from "@/components/seo/seo";
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
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { useDebouncedSearch } from "@/hooks/use-debounced-actions";
import { RateLimitDebugPanel } from "@/components/debug/rate-limit-debug-panel";

export default function CoursesIndex() {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0); // 0 is "All Categories"
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<string>("default"); // Sort parameter: "PriceAsc", "PriceDesc", "Rating", or "default" for default
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;
  
  // Get URL parameters for initial filter state
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  const searchParam = queryParams.get('search');

  // Use React Query for data fetching
  const { 
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: ['courses', currentPage, selectedCategory, searchTerm, priceRange, sortBy],
    queryFn: async () => {
      // Only filter by category if not "All Categories"
      const categoryId = selectedCategory > 0 ? selectedCategory : undefined;
      
      // Convert string search term to a format the API expects
      const searchQuery = searchTerm.trim() || undefined;
      
      // Use sortBy parameter, pass null if "default" for default sorting
      const sortParam = sortBy === "default" ? null : sortBy;
      
      // Get all courses from the API
      const result = await CourseService.getAllCourses(
        currentPage, 
        coursesPerPage, 
        sortParam, // sort parameter
        categoryId,
        searchQuery,
        priceRange[0] > 0 ? priceRange[0] : undefined,
        priceRange[1] < 5000 ? priceRange[1] : undefined
      );
      
      
      // Check if the API returned valid data with items
      if (result && result.items && Array.isArray(result.items)) {
        return result;
      } else if (result && result.data && Array.isArray(result.data)) {
        // Handle alternative API response format (used in homepage)
        return { items: result.data, totalCount: result.data.length };
      } else {
        // Return empty results if API returned no data
        return { items: [], totalCount: 0 };
      }
    }
  });

  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading
  } = useQuery({
    queryKey: ['allCategories'],
    queryFn: async () => {
      const result = await CategoryService.getAllCategories();      
      // Add "All Categories" option at the beginning
      if (result && Array.isArray(result)) {
        return [{ id: 0, name: "All Categories" }, ...result];
      }
      
      // Return default categories array if API call fails
      return [{ id: 0, name: "All Categories" }];
    }
  });  // Prepare the course data to match the expected format for CourseCard
  const mapCourseData = (course: any) => {
    const instructorName = course.instructorName || course.instructor?.name || "Unknown Instructor";
    const instructorImage = course.instructorImage || course.instructor?.avatar || course.instructor?.image;
    
    return {
      id: course.id?.toString() || "",
      title: course.title || "Untitled Course",
      description: course.description || "No description available",
      thumbnail: course.thumbnail ? getImageUrl(course.thumbnail) : "/placeholder.svg",
      rating: course.rating || 0,
      price: course.price || 0,
      category: course.categoryName || course.category || "Uncategorized",
      instructor: {
        id: course.instructorId || course.instructor?.id || "",
        name: instructorName,
        avatar: instructorImage,
        image: instructorImage,
      },
      duration: course.durationInHours ? `${course.durationInHours} hours` : course.duration || "0 hours",
    };
  };

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
    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
    }
  }, [categoryParam, searchParam]);

  // Update filtered courses when data changes
  useEffect(() => {
    if (coursesData?.items) {
      setFilteredCourses(coursesData.items.map(mapCourseData));
    }
  }, [coursesData]);

  // Reset filters and show all courses
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(0);
    setPriceRange([0, 5000]);
    setSortBy("default");
    setCurrentPage(1);
  };

  // Use data from API responses
  const categories = categoriesData || [{ id: 0, name: "All Categories" }];
  const isLoading = isCoursesLoading || isCategoriesLoading;
  const hasError = !!coursesError;

  // SEO structured data for courses page
  const coursesPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Online Courses - ElCentre",
    "description": "Browse our comprehensive collection of online courses in web development, data science, mobile development, and more.",
    "url": "https://elcentre-learn.vercel.app/courses",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filteredCourses.length,
      "itemListElement": filteredCourses.slice(0, 10).map((course, index) => ({
        "@type": "Course",
        "position": index + 1,
        "name": course.title,
        "description": course.description,
        "provider": {
          "@type": "Organization",
          "name": "ElCentre"
        },
        "offers": {
          "@type": "Offer",
          "price": course.price,
          "priceCurrency": "USD"
        }
      }))
    }
  };

  return (
    <MainLayout>
      <SEO
        title="Online Courses - ElCentre | Web Development, Data Science & More"
        description="Browse our comprehensive collection of online courses in web development, data science, mobile development, and more. Learn from expert instructors and advance your career."
        keywords="online courses, web development courses, data science courses, mobile development, programming courses, skill development, professional training"
        url="https://elcentre-learn.vercel.app/courses"
        structuredData={coursesPageStructuredData}
      />
      <div className="container py-8">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Courses</h1>
            <p className="text-muted-foreground">Discover courses to enhance your skills</p>
            {hasError && (
              <p className="text-sm text-red-500 mt-1">
                Failed to fetch courses from server. Please try again later.
              </p>
            )}
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
              <h3 className="font-medium mb-4">Sort By</h3>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Title</SelectItem>
                  <SelectItem value="PriceAsc">Price: Low to High</SelectItem>
                  <SelectItem value="PriceDesc">Price: High to Low</SelectItem>
                  <SelectItem value="Rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Price Range</h3>
              <div className="px-2">
                <Slider
                  defaultValue={[0, 5000]}
                  min={0}
                  max={5000}
                  step={50}
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  className="mb-6"
                />
                <div className="flex items-center justify-between">
                  <span>{priceRange[0]} EGP</span>
                  <span>{priceRange[1]} EGP</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleResetFilters} variant="outline" className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
          
          {/* Course Listings */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 course-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search term
                </p>
                <Button onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 course-grid">
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
