
import { CategoryList } from "@/components/home/category-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Category } from "@/types/api";

interface CategorySectionProps {
  categories: any[];
  isLoading: boolean;
  error: boolean;
  mockCategories: any[];
}

export function CategorySection({ categories, isLoading, error, mockCategories }: CategorySectionProps) {
  // Map API response to match the format expected by components
  const mappedCategories = categories?.length ? categories.map((category: Category) => ({
    id: `category-${category.id}`,
    name: category.name,
    slug: category.name.toLowerCase().replace(/\s+/g, '-'),
    description: `Explore ${category.name} courses`,
    courseCount: 0, // We don't have this info from the API
    icon: "book" as const, // Default to 'book' icon for all categories from API
  })) : mockCategories;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover courses in a variety of domains to enhance your skills and knowledge
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Could not connect to category data.</p>
            <CategoryList categories={mockCategories} />
          </div>
        ) : (
          <CategoryList categories={mappedCategories} />
        )}
      </div>
    </section>
  );
}
