import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StarIcon } from "lucide-react";
import { getImageUrl, API_BASE_URL } from "@/config/api-config";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  rating: number;
  price: number;
  category: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  duration: string;
}

export function CourseCard({
  id,
  title,
  description,
  thumbnail,
  rating,
  price,
  category,
  instructor,
  duration,
}: CourseCardProps) {
  // Helper function to render stars based on rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? "text-yellow-400 fill-yellow-400" 
                : i < rating 
                  ? "text-yellow-400 fill-yellow-400 opacity-50" 
                  : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Format the thumbnail URL correctly - ensure consistent formatting
  const formatThumbnailUrl = (thumbnailPath: string): string => {
    if (!thumbnailPath) return "/placeholder.svg";
    
    // If it's already a full URL, use it as is
    if (thumbnailPath.startsWith('http')) return thumbnailPath;
    
    // Otherwise, in production use the API proxy route, in development use direct URL
    return `${API_BASE_URL}/${thumbnailPath.replace(/^\//, '')}`;
  };

  // Use the consistent formatting function
  const formattedThumbnail = formatThumbnailUrl(thumbnail);

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <Link to={`/courses/${id}`}>
        <div className="aspect-video relative overflow-hidden">
          <img
            src={formattedThumbnail}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-2 right-2 bg-primary/90">{category}</Badge>
        </div>
      </Link>
      <CardHeader className="p-4">
        <CardTitle className="text-lg line-clamp-1">
          <Link to={`/courses/${id}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </CardTitle>
        <div className="flex items-center mt-1">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={instructor.avatar} alt={instructor.name} />
            <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{instructor.name}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground h-10 line-clamp-2 mb-2">{description}</p>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{duration}</span>
          {renderRating(rating)}
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <div className="font-semibold">
          {price === 0 ? (
            <span className="text-eduAccent">Free</span>
          ) : (
            <span>{price.toFixed(2)} LE</span>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/courses/${id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
