import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StarIcon, ClockIcon, Globe } from "lucide-react";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import { getLanguageDisplayName } from "@/config/languages";

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
  language?: string; // Course language code
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
  language,
}: CourseCardProps) {
  // Helper function to render stars based on rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-3 w-3 ${
              i < Math.floor(rating) 
                ? "text-yellow-400 fill-yellow-400" 
                : i < rating 
                  ? "text-yellow-400 fill-yellow-400 opacity-50" 
                  : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600 font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Format the thumbnail URL correctly
  const formattedThumbnail = getImageUrl(thumbnail);

  // Handle avatar source properly
  const avatarSrc = (instructor.image || instructor.avatar) ? getImageUrl(instructor.image || instructor.avatar) : "";

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      {/* Thumbnail Section */}
      <Link to={`/courses/${id}`} className="block">
        <div className="aspect-video relative overflow-hidden">
          <img
            src={formattedThumbnail}
            alt={title}
            width={320}
            height={180}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <span className="bg-eduBlue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              {category}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        {/* Header Section */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
            <Link 
              to={`/courses/${id}`} 
              className="hover:text-eduBlue-600 transition-colors duration-200"
            >
              {title}
            </Link>
          </h3>
          
          {/* Instructor Info */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <AvatarImage 
                src={avatarSrc} 
                alt={instructor.name} 
              />
              <AvatarFallback className="bg-eduBlue-50 text-eduBlue-600 text-xs font-medium">
                {getInitials(instructor.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{instructor.name}</span>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 mb-3">
          <div 
            className="text-sm text-gray-500 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Stats Section */}
        <div className="mb-3 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">{duration}</span>
            </div>
            {renderRating(rating)}
          </div>
          
          {/* Language Display */}
          {language && (
            <div className="flex items-center gap-1 text-gray-500">
              <Globe className="h-4 w-4" />
              <span className="text-sm">{getLanguageDisplayName(language)}</span>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {price === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              <span className="text-gray-900">{price.toFixed(2)} EGP</span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="bg-eduBlue-50 border-eduBlue-200 text-eduBlue-600 hover:bg-eduBlue-100 hover:border-eduBlue-300 font-medium px-3 py-1.5 rounded-md transition-colors duration-200"
          >
            <Link to={`/courses/${id}`}>View Course</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
