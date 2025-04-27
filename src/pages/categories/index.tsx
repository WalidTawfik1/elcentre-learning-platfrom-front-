import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { CategoryService } from "@/services/category-service";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

// Mock categories data for fallback when API is unavailable
const MOCK_CATEGORIES = [
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

// Helper function to get icon component based on icon name
const getIcon = (iconName?: string) => {
  switch (iconName) {
    case "video":
      return <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
      </div>;
    case "users":
      return <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>;
    case "book":
    default:
      return <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
      </div>;
  }
};

export default function CategoriesIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  
  // Use React Query for data fetching
  const { 
    data: categoriesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['allCategories'],
    queryFn: async () => {
      try {
        const result = await CategoryService.getAllCategories();
        return result || [];
      } catch (error) {
        console.error("Failed to fetch categories, using mock data:", error);
        return MOCK_CATEGORIES;
      }
    }
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter categories based on search term
  useEffect(() => {
    if (categoriesData) {
      const categories = categoriesData.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: typeof category.name === 'string' ? category.name.toLowerCase().replace(/\s+/g, '-') : '',
        description: `Explore ${category.name} courses`,
        icon: "book" as const,
      }));

      if (searchTerm) {
        setFilteredCategories(
          categories.filter((category: any) =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      } else {
        setFilteredCategories(categories);
      }
    }
  }, [categoriesData, searchTerm]);

  // Use mock data if API fetch fails
  const categories = categoriesData?.length ? filteredCategories : 
    searchTerm ? MOCK_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())) : MOCK_CATEGORIES;

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Categories</h1>
          <p className="text-muted-foreground">Browse our course categories and find the right one for you</p>
        </div>

        <div className="mb-8">
          <div className="flex space-x-2 max-w-md">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-md"
            />
            <Button type="submit" variant="default">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-card rounded-lg p-6 border shadow-sm">
                <Skeleton className="h-12 w-12 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-xl text-red-500 mb-4">Could not connect to server.</p>
            <p className="mb-6">We're showing mock categories instead.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-medium mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search term
            </p>
            <Button onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

interface CategoryCardProps {
  category: {
    id: string | number;
    name: string;
    slug?: string;
    description?: string;
    courseCount?: number;
    icon?: "book" | "video" | "users";
  };
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/courses?category=${category.id}`} className="block p-6">
        <div className="flex flex-col items-center text-center">
          {getIcon(category.icon)}
          <h3 className="mt-4 text-xl font-semibold">{category.name}</h3>
          <p className="mt-2 text-muted-foreground text-sm">{category.description}</p>
          <div className="mt-4 text-sm text-primary">
            {category.courseCount !== undefined ? (
              <span>{category.courseCount} {category.courseCount === 1 ? "course" : "courses"}</span>
            ) : (
              "Browse courses"
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}