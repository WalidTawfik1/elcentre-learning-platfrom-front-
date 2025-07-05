import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StarIcon } from "lucide-react";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";

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
    image?: string; // Support for instructorImage field
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
  };  // Format the thumbnail URL correctly
  const formattedThumbnail = getImageUrl(thumbnail);

  // Handle avatar source properly
  const avatarSrc = (instructor.image || instructor.avatar) ? getImageUrl(instructor.image || instructor.avatar) : "";
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow h-full flex flex-col">
      <Link to={`/courses/${id}`}>
        <div className="aspect-video relative overflow-hidden">
          <img
            src={formattedThumbnail}
            alt={title}
            width={320}
            height={180}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <Badge className="absolute top-2 right-2 bg-primary/90">{category}</Badge>
        </div>
      </Link>
      <div className="flex flex-col flex-1">
        <CardHeader className="p-4 flex-shrink-0">
          <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
            <Link to={`/courses/${id}`} className="hover:text-primary transition-colors">
              {title}
            </Link>
          </CardTitle>
          <div className="flex items-center mt-1 min-h-[1.5rem]">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage 
                src={avatarSrc} 
                alt={instructor.name} 
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(instructor.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{instructor.name}</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-1 flex flex-col">
          <div className="flex-1 min-h-[3rem] mb-2">
            <p className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden">{description}</p>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-auto">
            <span>{duration}</span>
            {renderRating(rating)}
          </div>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center border-t mt-auto">
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
      </div>
    </Card>
  );
}
