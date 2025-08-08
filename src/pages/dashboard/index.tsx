import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  Clock, 
  Play, 
  GraduationCap, 
  BookMarked, 
  LightbulbIcon, 
  TrendingUp, 
  Heart, 
  HeartOff
} from "lucide-react";
import { EnrollmentService } from "@/services/enrollment-service";
import { CourseService } from "@/services/course-service";
import { WishlistService } from "@/services/wishlist-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import WeeklyProgressChart from "@/components/charts/weekly-progress-chart";

// Learning quotes and tips
const motivationalQuotes = [
  "The expert in anything was once a beginner.",
  "Education is the passport to the future.",
  "The beautiful thing about learning is nobody can take it away from you.",
  "Learning is a treasure that will follow its owner everywhere.",
  "The more that you read, the more things you will know.",
  "Education is not the filling of a pail, but the lighting of a fire.",
  "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
  "Never stop learning, because life never stops teaching.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "The only person who is educated is the one who has learned how to learn and change."
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [currentCourses, setCurrentCourses] = useState<any[]>([]);
  const [suggestedCourses, setSuggestedCourses] = useState<any[]>([]);
  const [wishlistCourses, setWishlistCourses] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<{
    lessonId: number;
    enrollmentId: number;
    completedDate: string;
  }[]>([]);
  const [greeting, setGreeting] = useState<string>("");
  const [quote, setQuote] = useState<string>("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  
  // Get time-based greeting
  useEffect(() => {
    const hours = new Date().getHours();
    let greetingText = "";
    
    if (hours < 12) {
      greetingText = "Good morning";
    } else if (hours >= 12 && hours < 17) {
      greetingText = "Good afternoon";
    } else {
      greetingText = "Good evening";
    }
    
    if (user) {
      greetingText = `${greetingText}, ${user.firstName}!`;
    } else {
      greetingText = `${greetingText}!`;
    }
    
    setGreeting(greetingText);
    
    // Set a random motivational quote
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setQuote(motivationalQuotes[randomIndex]);
  }, [user]);
  
  useEffect(() => {
    // Only redirect if authentication loading is complete AND user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login?redirect=/dashboard", { replace: true });
      return;
    }
    
    // Only fetch dashboard data if authentication is confirmed
    if (isAuthenticated) {
      const fetchDashboardData = async () => {
        setIsLoadingDashboard(true);
        try {
          // Fetch student enrollments first
          const enrollmentsData = await EnrollmentService.getStudentEnrollments();
          
          if (Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
            setEnrollments(enrollmentsData);
            
            // Fetch course details in parallel for better performance
            const coursesDetailedData = await Promise.allSettled(
              enrollmentsData.map(async (enrollment) => {
                const courseData = await CourseService.getCourseById(enrollment.courseId);
                return {
                  ...courseData,
                  enrollmentId: enrollment.id,
                  enrollmentStatus: enrollment.status,
                  progress: enrollment.progress || 0
                };
              })
            );
            
            // Filter successful results only
            const successfulCourses = coursesDetailedData
              .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
              .map(result => result.value);
            
            setCurrentCourses(successfulCourses);
            
            // Fetch completed lessons for all enrolled courses
            try {
              const allCompletedLessons = await Promise.allSettled(
                enrollmentsData.map(async (enrollment) => {
                  const lessons = await EnrollmentService.getCompletedLessons(enrollment.courseId);
                  return lessons;
                })
              );
              
              // Flatten all completed lessons into a single array
              const completedLessonsData = allCompletedLessons
                .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
                .flatMap(result => result.value);
              
              setCompletedLessons(completedLessonsData);
            } catch (error) {
              // Silently handle completed lessons error
              console.warn("Failed to fetch completed lessons:", error);
            }
            
            // Get suggested courses based on the first course's category (if available)
            if (successfulCourses.length > 0 && successfulCourses[0].categoryId) {
              try {
                const suggestedCoursesData = await CourseService.getAllCourses(
                  1, // page number
                  4, // page size
                  undefined, // sort
                  successfulCourses[0].categoryId // categoryId
                );
                
                if (Array.isArray(suggestedCoursesData.items)) {
                  // Filter out courses the student is already enrolled in
                  const enrolledCourseIds = new Set(enrollmentsData.map(e => e.courseId));
                  const filteredSuggestions = suggestedCoursesData.items.filter(
                    course => !enrolledCourseIds.has(course.id)
                  );
                  setSuggestedCourses(filteredSuggestions.slice(0, 3));
                }
              } catch (error) {
                // Silently handle suggested courses error
              }
            }
          } else {
            setEnrollments([]);
            setCurrentCourses([]);
            
            // If no enrollments, get popular courses as suggestions
            try {
              const popularCoursesData = await CourseService.getAllCourses(
                1, // page number
                4, // page size
                "popular" // sort by popularity
              );
              
              if (Array.isArray(popularCoursesData.items)) {
                setSuggestedCourses(popularCoursesData.items.slice(0, 3));
              }
            } catch (error) {
              // Silently handle popular courses error
            }
          }
          
          // Get wishlist data from local storage
          const wishlistData = WishlistService.getWishlist();
          setWishlistCourses(wishlistData);
          
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load your dashboard. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingDashboard(false);
        }
      };
      
      fetchDashboardData();
    }
  }, [isAuthenticated, navigate, isLoading]);
  
  // Format the thumbnail URL properly using getImageUrl function
  const formatThumbnailUrl = (thumbnail: string | undefined): string => {
    return getImageUrl(thumbnail);
  };

  // Toggle course in wishlist
  const toggleWishlist = (course: any) => {
    WishlistService.toggleWishlist(course);
    
    // Update the local state after toggling in localStorage
    setWishlistCourses(WishlistService.getWishlist());
  };

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header Section with Greeting and Quote */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{greeting}</h1>
          <div className="flex items-center bg-muted p-4 rounded-lg">
            <LightbulbIcon className="h-6 w-6 mr-3 text-yellow-500" />
            <p className="text-muted-foreground italic">{quote}</p>
          </div>
        </div>

        {/* Weekly Progress Chart - Show even during loading with empty data */}
        <div className="mb-8">
          <WeeklyProgressChart completedLessons={completedLessons} />
        </div>

        {isLoading || isLoadingDashboard ? (
          <div className="space-y-8">
            {/* Skeleton loaders for all sections */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg overflow-hidden bg-card">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-2 w-full" />
                      <div className="flex justify-between items-center pt-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-9 w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Current Courses Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold flex items-center">
                  <BookOpen className="mr-2" />
                  Current Courses
                </h2>
                <Button asChild variant="outline">
                  <Link to="/my-courses">View All</Link>
                </Button>
              </div>
              
              {currentCourses.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <div className="flex justify-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-medium mt-4 mb-2">You're not enrolled in any courses yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start your learning journey by exploring our course catalog.
                  </p>
                  <Button asChild>
                    <Link to="/courses">Browse Courses</Link>
                  </Button>
                </div>              ) : (                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCourses.slice(0, 3).map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      {/* Thumbnail Section */}
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={formatThumbnailUrl(course.thumbnail)}
                          alt={course.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        {/* Progress Badge */}
                        <div className="absolute top-3 right-3">
                          <span className="bg-eduBlue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                            {Math.round(course.progress)}% Complete
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 p-4">
                        {/* Header Section */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
                            {course.title}
                          </h3>
                          
                          {/* Instructor Info */}
                          {course.instructorName && (
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage 
                                  src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} 
                                  alt={course.instructorName} 
                                />
                                <AvatarFallback className="bg-eduBlue-500 text-white text-xs font-medium">
                                  {getInitials(course.instructorName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-600">{course.instructorName}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div className="flex-1 mb-3">
                          <div 
                            className="text-sm text-gray-500 line-clamp-2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                          />
                        </div>

                        {/* Progress Section */}
                        <div className="mb-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-bold text-eduBlue-600">{Math.round(course.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-eduBlue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Status Section */}
                        <div className="flex items-center justify-between mb-3 py-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-gray-500">
                            {course.enrollmentStatus === "Completed" ? (
                              <>
                                <BookOpen className="h-4 w-4" />
                                <span className="text-sm font-medium text-green-600">Completed</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{course.durationInHours ? `${course.durationInHours} hours` : "In Progress"}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Footer Section */}
                        <div className="flex items-center justify-center">
                          <Button 
                            className="w-full bg-eduBlue-500 hover:bg-eduBlue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200" 
                            asChild
                          >
                            <Link to={`/my-courses/${course.id}/learn`}>
                              <Play className="h-4 w-4 mr-2" /> 
                              {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Suggested Courses Section */}
            {suggestedCourses.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold flex items-center">
                    <TrendingUp className="mr-2" />
                    Suggested For You
                  </h2>
                  <Button asChild variant="outline">
                    <Link to="/courses">Browse More</Link>
                  </Button>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suggestedCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      {/* Thumbnail Section */}
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={formatThumbnailUrl(course.thumbnail)}
                          alt={course.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <button 
                          onClick={() => toggleWishlist(course)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          aria-label={WishlistService.isInWishlist(course.id) ? "Remove from wishlist" : "Add to wishlist"}
                          title={WishlistService.isInWishlist(course.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {WishlistService.isInWishlist(course.id) 
                            ? <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
                            : <Heart className="h-5 w-5" />
                          }
                        </button>
                      </div>
                      
                      <div className="flex flex-col flex-1 p-4">
                        {/* Header Section */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
                            {course.title}
                          </h3>
                          
                          {/* Instructor Info */}
                          {course.instructorName && (
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage 
                                  src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} 
                                  alt={course.instructorName} 
                                />
                                <AvatarFallback className="bg-eduBlue-500 text-white text-xs font-medium">
                                  {getInitials(course.instructorName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-600">{course.instructorName}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div className="flex-1 mb-3">
                          <div 
                            className="text-sm text-gray-500 line-clamp-2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                          />
                        </div>

                        {/* Recommendation reason - Fixed height section */}
                        <div className="mb-3 py-2 px-3 bg-eduBlue-50 rounded-lg border border-eduBlue-100">
                          {currentCourses.length > 0 && currentCourses[0].categoryId === course.categoryId ? (
                            <div className="text-xs text-eduBlue-600 font-medium text-center">
                              <span>Because you're learning {currentCourses[0].title}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-eduBlue-600 font-medium text-center">
                              <span>Recommended for you</span>
                            </div>
                          )}
                        </div>

                        {/* Status Section */}
                        <div className="flex items-center justify-between mb-3 py-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-gray-500">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-sm">{course.durationInHours ? `${course.durationInHours} hours` : "Course"}</span>
                          </div>
                        </div>

                        {/* Footer Section */}
                        <div className="flex items-center justify-center">
                          <Button 
                            className="w-full bg-eduBlue-500 hover:bg-eduBlue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200" 
                            asChild
                          >
                            <Link to={`/courses/${course.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Wishlist Courses Section */}
            {wishlistCourses.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold flex items-center">
                    <BookMarked className="mr-2" />
                    Your Wishlist
                  </h2>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      WishlistService.clearWishlist();
                      setWishlistCourses([]);
                    }}
                  >
                    Clear Wishlist
                  </Button>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-lg">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={formatThumbnailUrl(course.thumbnail)}
                          alt={course.title}
                          className="object-cover w-full h-full"
                        />                        <button 
                          onClick={() => toggleWishlist(course)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                          aria-label="Remove from wishlist"
                          title="Remove from wishlist"
                        >
                          <HeartOff className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                      
                      <div className="flex flex-col flex-1 p-6">
                        <div className="flex-shrink-0 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 min-h-[1.75rem]">
                            {course.title}
                          </h3>
                          <div className="min-h-[1.5rem] flex items-center">
                            {course.instructorName && (
                              <div className="flex items-center mt-1">
                                <Avatar className="h-5 w-5 mr-1.5">
                                  <AvatarImage src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} alt={course.instructorName} />
                                  <AvatarFallback className="bg-eduBlue-500 text-white text-xs">{getInitials(course.instructorName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-500">{course.instructorName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1 min-h-[3rem] mb-3">
                            <div 
                              className="text-sm text-gray-500 line-clamp-2 h-10 overflow-hidden prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                            />
                          </div>
                          
                          {/* Price section - Fixed height */}
                          <div className="min-h-[1.5rem] mb-4 flex items-start">
                            {course.price !== undefined ? (
                              <div className="mb-3">
                                <span className="font-semibold text-gray-900">
                                  {course.price === 0 ? "Free" : `${course.price} EGP`}
                                </span>
                              </div>
                            ) : (
                              <div className="h-6"></div> /* Placeholder for consistent spacing */
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-4">
                          <div className="w-full flex justify-between items-center">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Added {new Date().toLocaleDateString()}</span>
                            </div>
                            <Button asChild>
                              <Link to={`/courses/${course.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}