import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {/* Thumbnail skeleton with exact aspect ratio */}
      <div className="aspect-video relative overflow-hidden bg-gray-200 animate-pulse">
        <div className="absolute top-2 right-2 w-16 h-6 bg-gray-300 rounded animate-pulse"></div>
      </div>
      
      <div className="flex flex-col flex-1">
        <CardHeader className="p-4 flex-shrink-0">
          {/* Title skeleton */}
          <div className="h-7 bg-gray-200 rounded animate-pulse mb-2"></div>
          
          {/* Instructor info skeleton */}
          <div className="flex items-center mt-1 min-h-[1.5rem]">
            <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse mr-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 flex-1 flex flex-col">
          {/* Description skeleton */}
          <div className="flex-1 min-h-[3rem] mb-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
          
          {/* Duration and rating skeleton */}
          <div className="flex justify-between text-xs mt-auto">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse ml-2"></div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 flex justify-between items-center border-t mt-auto">
          {/* Price skeleton */}
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          
          {/* Button skeleton */}
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </CardFooter>
      </div>
    </Card>
  );
}
