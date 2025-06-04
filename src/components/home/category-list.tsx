import { Button } from "@/components/ui/button";
import { Book, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";

interface Category {
  id: string | number;
  name: string;
  slug?: string;
  description?: string;
  courseCount?: number;
  icon?: "book" | "video" | "users";
}

interface CategoryListProps {
  categories: Category[];
}

// Helper function to get icon component based on icon name
const getIcon = (iconName?: string) => {
  switch (iconName) {
    case "video":
      return <Video className="h-5 w-5" />;
    case "users":
      return <Users className="h-5 w-5" />;
    case "book":
    default:
      return <Book className="h-5 w-5" />;
  }
};

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/courses?category=${category.id}`}
          className="group block h-full"
        >
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md h-full flex flex-col">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
              {getIcon(category.icon)}
            </div>
            <div className="mb-2 text-lg font-medium min-h-[1.75rem] flex items-center">
              {category.name}
            </div>
            <div className="flex-1 min-h-[3rem] mb-4 flex items-start">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {category.description || `Explore ${category.name} courses`}
              </p>
            </div>
            <div className="text-sm text-muted-foreground mt-auto flex-shrink-0">
              {category.courseCount !== undefined ? (
                `${category.courseCount} ${category.courseCount === 1 ? "course" : "courses"}`
              ) : (
                "Browse courses"
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
