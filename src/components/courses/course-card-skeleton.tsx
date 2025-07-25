export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-video relative overflow-hidden bg-gray-200">
        <div className="absolute top-3 right-3 w-16 h-6 bg-gray-300 rounded-md"></div>
      </div>
      
      <div className="flex flex-col flex-1 p-4">
        {/* Header Section */}
        <div className="mb-3">
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          
          {/* Instructor info skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-gray-200"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="flex-1 mb-3">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Stats section skeleton */}
        <div className="flex items-center justify-between mb-3 py-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-3 bg-gray-200 rounded"></div>
            ))}
            <div className="h-4 w-8 bg-gray-200 rounded ml-1"></div>
          </div>
        </div>

        {/* Footer section skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}
