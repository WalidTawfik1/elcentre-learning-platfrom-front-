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
          // Fetch student enrollments
          const enrollmentsData = await EnrollmentService.getStudentEnrollments();
          
          if (Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
            setEnrollments(enrollmentsData);
              // Fetch detailed course data for current enrollments
            const coursesDetailedData = await Promise.all(
              enrollmentsData.map(async (enrollment) => {
                try {
                  const courseData = await CourseService.getCourseById(enrollment.courseId);
                  
                  // Recalculate progress for accurate display
                  let updatedProgress = enrollment.progress || 0;
                  if (enrollment.id) {
                    try {
                      const result = await EnrollmentService.recalculateProgress(enrollment.id);
                      updatedProgress = result.progress;
                    } catch (error) {
                      console.error(`Error recalculating progress for enrollment ${enrollment.id}:`, error);
                    }
                  }
                  
                  return {
                    ...courseData,
                    enrollmentId: enrollment.id,
                    enrollmentStatus: enrollment.status,
                    progress: updatedProgress
                  };
                } catch (error) {
                  console.error(`Error fetching course ${enrollment.courseId}:`, error);
                  return {
                    id: enrollment.courseId,
                    title: enrollment.courseName || "Unknown Course",
                    description: "Course details could not be loaded.",
                    thumbnail: "/placeholder.svg",
                    enrollmentId: enrollment.id,
                    enrollmentStatus: enrollment.status,
                    progress: enrollment.progress || 0
                  };
                }
              })
            );
            
            setCurrentCourses(coursesDetailedData);
            
            // Use the first enrollment's category to get suggested courses
            if (coursesDetailedData.length > 0) {
              const primaryCourse = coursesDetailedData[0];
              const primaryCategoryId = primaryCourse.categoryId;
              
              // Fetch suggested courses based on category
              try {
                const suggestedCoursesData = await CourseService.getAllCourses(
                  1, // page number
                  4, // page size
                  undefined, // sort
                  primaryCategoryId // categoryId
                );
                
                // Filter out courses the student is already enrolled in
                const filteredSuggestions = Array.isArray(suggestedCoursesData.items) 
                  ? suggestedCoursesData.items.filter((course: any) => 
                      !enrollmentsData.some(enrollment => enrollment.courseId === course.id)
                    ).slice(0, 3) // Limit to 3 suggestions
                  : [];
                  
                setSuggestedCourses(filteredSuggestions);
              } catch (error) {
                console.error("Error fetching suggested courses:", error);
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
              console.error("Error fetching popular courses:", error);
            }
          }
          
          // Get wishlist data from local storage
          const wishlistData = WishlistService.getWishlist();
          setWishlistCourses(wishlistData);
          
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
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
                    <Card key={course.id} className="overflow-hidden flex flex-col h-full">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={formatThumbnailUrl(course.thumbnail)}
                          alt={course.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      
                      <div className="flex flex-col flex-1">
                        <CardHeader className="p-4 pb-2 flex-shrink-0">
                          <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
                            {course.title}
                          </CardTitle>
                          <div className="min-h-[1.5rem] flex items-center">
                            {course.instructorName && (
                              <div className="flex items-center mt-1">
                                <Avatar className="h-5 w-5 mr-1.5">
                                  <AvatarImage src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} alt={course.instructorName} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(course.instructorName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{course.instructorName}</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                          <div className="flex-1 min-h-[3rem] mb-3">
                            <div 
                              className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                            />
                          </div>
                          
                          <div className="space-y-3 mt-auto">
                            <div className="text-sm flex items-center justify-between">
                              <span>Progress</span>
                              <span className="font-medium">{Math.round(course.progress)}%</span>
                            </div>
                            <Progress value={course.progress} />
                          </div>
                        </CardContent>
                      </div>
                      <CardFooter className="p-4 border-t">
                        <div className="w-full flex justify-between items-center">
                          <div className="flex items-center text-xs text-muted-foreground">
                            {course.enrollmentStatus === "Completed" ? (
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                <span>Completed</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{course.durationInHours ? `${course.durationInHours} hours` : "In Progress"}</span>
                              </div>
                            )}
                          </div>
                          <Button asChild>
                            <Link to={`/my-courses/${course.id}/learn`}>
                              <Play className="h-4 w-4 mr-2" /> Continue
                            </Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
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
                    <Card key={course.id} className="overflow-hidden flex flex-col h-full">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={formatThumbnailUrl(course.thumbnail)}
                          alt={course.title}
                          className="object-cover w-full h-full"
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
                      
                      <div className="flex flex-col flex-1">
                        <CardHeader className="p-4 pb-2 flex-shrink-0">
                          <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
                            {course.title}
                          </CardTitle>
                          <div className="min-h-[1.5rem] flex items-center">
                            {course.instructorName && (
                              <div className="flex items-center mt-1">
                                <Avatar className="h-5 w-5 mr-1.5">
                                  <AvatarImage src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} alt={course.instructorName} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(course.instructorName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{course.instructorName}</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                          <div className="flex-1 min-h-[3rem] mb-3">
                            <div 
                              className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                            />
                          </div>
                          
                          {/* Recommendation reason - Fixed height section */}
                          <div className="min-h-[1.5rem] mb-3 flex items-start">
                            {currentCourses.length > 0 && currentCourses[0].categoryId === course.categoryId ? (
                              <div className="text-xs px-3 py-1 bg-muted rounded-full inline-flex items-center">
                                <span>Because you're learning {currentCourses[0].title}</span>
                              </div>
                            ) : (
                              <div className="h-6"></div> /* Placeholder for consistent spacing */
                            )}
                          </div>
                        </CardContent>
                      </div>
                      <CardFooter className="p-4 border-t">
                        <div className="w-full flex justify-between items-center">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <span>{course.durationInHours ? `${course.durationInHours} hours` : "Course"}</span>
                          </div>
                          <Button asChild>
                            <Link to={`/courses/${course.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
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
                    <Card key={course.id} className="overflow-hidden flex flex-col h-full">
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
                      
                      <div className="flex flex-col flex-1">
                        <CardHeader className="p-4 pb-2 flex-shrink-0">
                          <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
                            {course.title}
                          </CardTitle>
                          <div className="min-h-[1.5rem] flex items-center">
                            {course.instructorName && (
                              <div className="flex items-center mt-1">
                                <Avatar className="h-5 w-5 mr-1.5">
                                  <AvatarImage src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} alt={course.instructorName} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(course.instructorName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{course.instructorName}</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                          <div className="flex-1 min-h-[3rem] mb-3">
                            <div 
                              className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                            />
                          </div>
                          
                          {/* Price section - Fixed height */}
                          <div className="min-h-[1.5rem] mb-3 flex items-start">
                            {course.price !== undefined ? (
                              <div className="mb-3">
                                <span className="font-semibold">
                                  {course.price === 0 ? "Free" : `${course.price} EGP`}
                                </span>
                              </div>
                            ) : (
                              <div className="h-6"></div> /* Placeholder for consistent spacing */
                            )}
                          </div>
                        </CardContent>
                      </div>
                      <CardFooter className="p-4 border-t">
                        <div className="w-full flex justify-between items-center">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Added {new Date().toLocaleDateString()}</span>
                          </div>
                          <Button asChild>
                            <Link to={`/courses/${course.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
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