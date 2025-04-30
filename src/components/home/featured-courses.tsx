import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StarIcon } from "lucide-react";
import { getImageUrl } from "@/config/api-config";

interface Course {
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

interface FeaturedCoursesProps {
  courses: Course[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
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

  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden group hover:shadow-md transition-shadow">
          <Link to={`/courses/${course.id}`}>
            <div className="aspect-video relative overflow-hidden">
              <img
                src={getImageUrl(course.thumbnail)}
                alt={course.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <Badge className="absolute top-2 right-2 bg-primary/90">{course.category}</Badge>
            </div>
          </Link>
          <CardHeader className="p-4">
            <CardTitle className="text-lg line-clamp-1">
              <Link to={`/courses/${course.id}`} className="hover:text-primary transition-colors">
                {course.title}
              </Link>
            </CardTitle>
            <div className="flex items-center mt-1">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
                <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardDescription className="text-xs">{course.instructor.name}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{course.description}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{course.duration}</span>
              {renderRating(course.rating)}
            </div>
          </CardContent>
          <CardFooter className="p-4 flex justify-between items-center border-t">
            <div className="font-semibold">
              {course.price === 0 ? (
                <span className="text-eduAccent">Free</span>
              ) : (
                <span>{course.price.toFixed(2)} LE</span>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/courses/${course.id}`}>View Course</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
