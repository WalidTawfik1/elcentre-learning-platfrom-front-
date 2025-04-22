
import { Button } from "@/components/ui/button";
import { Book, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  courseCount: number;
  icon: "book" | "video" | "users";
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  // Map the icon string to the actual Icon component
  const getIcon = (icon: Category["icon"]) => {
    switch (icon) {
      case "book":
        return <Book className="h-6 w-6" />;
      case "video":
        return <Video className="h-6 w-6" />;
      case "users":
        return <Users className="h-6 w-6" />;
      default:
        return <Book className="h-6 w-6" />;
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {categories.map((category) => (
        <Link 
          key={category.id} 
          to={`/categories/${category.slug}`}
          className="group"
        >
          <div className="flex flex-col h-full p-6 border rounded-lg bg-card hover:bg-accent/10 transition-colors group-hover:border-primary/50">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {getIcon(category.icon)}
            </div>
            <div className="mb-2 text-lg font-medium">{category.name}</div>
            <p className="mb-4 flex-1 text-sm text-muted-foreground">
              {category.description}
            </p>
            <div className="text-sm text-muted-foreground">
              {category.courseCount} {category.courseCount === 1 ? "course" : "courses"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
