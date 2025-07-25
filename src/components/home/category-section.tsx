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
    id: category.id,
    name: category.name,
    slug: category.name.toLowerCase().replace(/\s+/g, '-'),
    description: `Explore ${category.name} courses`,
    icon: "book" as const, // Default to 'book' icon for all categories from API
  })) : mockCategories;

  return (
    <section className="py-16 bg-muted/30" id="browse-categories">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover courses in a variety of domains to enhance your skills and knowledge
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 h-full flex flex-col animate-pulse">
                <div className="h-12 w-12 rounded-xl bg-gray-200 mb-4 flex-shrink-0"></div>
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="flex-1 mb-4">
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
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
