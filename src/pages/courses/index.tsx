
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { API } from "@/lib/api";

// Mock data for development
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
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [filteredCourses, setFilteredCourses] = useState(MOCK_COURSES);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, we would fetch actual data from the API
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setIsLoading(true);
  //     try {
  //       const [coursesData, categoriesData] = await Promise.all([
  //         API.courses.getAll(),
  //         API.categories.getAll()
  //       ]);
  //       
  //       setCourses(coursesData);
  //       setFilteredCourses(coursesData);
  //       setCategories([{ id: "all", name: "All Categories" }, ...categoriesData]);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //
  //   fetchData();
  // }, []);

  // Filter courses when search term or category changes
  useEffect(() => {
    let filtered = courses;
    
    // Apply category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.title.toLowerCase().includes(search) || 
          course.description.toLowerCase().includes(search)
      );
    }
    
    setFilteredCourses(filtered);
  }, [searchTerm, selectedCategory, courses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The filtering is already handled by the useEffect
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
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredCourses.map((course) => (
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
              />
            ))}
          </div>
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
                setSelectedCategory("All Categories");
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
