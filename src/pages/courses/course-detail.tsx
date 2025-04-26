import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarIcon, Play, Clock, User, Book, Video, CheckCircle } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching course with id:", id);
        const courseData = await CourseService.getCourseById(id);
        console.log("Course data received:", courseData);
        setCourse(courseData);
        
        // Get modules and lessons for this course
        const modulesData = await CourseService.getModules(id);
        console.log("Modules data received:", modulesData);
        
        // If we have modules, fetch lessons for each module
        if (modulesData && Array.isArray(modulesData)) {
          const modulesWithLessons = await Promise.all(
            modulesData.map(async (module) => {
              try {
                const lessons = await CourseService.getLessons(id, module.id);
                console.log(`Lessons for module ${module.id}:`, lessons);
                return {
                  ...module,
                  lessons: Array.isArray(lessons) ? lessons : []
                };
              } catch (error) {
                console.error(`Error fetching lessons for module ${module.id}:`, error);
                return { ...module, lessons: [] };
              }
            })
          );
          
          setModules(modulesWithLessons);
        }
        
        // Check if user is enrolled
        if (isAuthenticated) {
          try {
            const isUserEnrolled = await CourseService.isEnrolled(id);
            setIsEnrolled(!!isUserEnrolled);
          } catch (error) {
            console.error("Error checking enrollment:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast({
          title: "Error",
          description: "Failed to load course details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [id, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `/auth/login?redirect=/courses/${id}`;
      return;
    }
    
    setIsEnrolling(true);
    try {
      await CourseService.enroll(id!);
      setIsEnrolled(true);
      toast({
        title: "Success!",
        description: "You have successfully enrolled in this course.",
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Enrollment Failed",
        description: "There was a problem with your enrollment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Helper function to calculate total duration
  const calculateTotalDuration = () => {
    if (!modules || modules.length === 0) return "0h 0m";
    
    let totalMinutes = 0;
    
    modules.forEach(module => {
      if (module.lessons && Array.isArray(module.lessons)) {
        module.lessons.forEach(lesson => {
          if (lesson.durationInMinutes) {
            totalMinutes += lesson.durationInMinutes;
          }
        });
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Helper function to count total lessons
  const getTotalLessons = () => {
    if (!modules || modules.length === 0) return 0;
    return modules.reduce((total, module) => {
      return total + (module.lessons ? module.lessons.length : 0);
    }, 0);
  };

  // Fallback for when the API fails to load data
  const useFallbackData = !course;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eduBlue-500"></div>
        </div>
      </MainLayout>
    );
  }

  // Use fallback data if API call failed
  const courseData = useFallbackData ? {
    id: id,
    title: "Course Not Found",
    description: "We couldn't load this course's details. Please try again later.",
    thumbnail: "/placeholder.svg",
    rating: 0,
    reviewCount: 0,
    price: 0,
    category: "Uncategorized",
    instructor: {
      id: "unknown",
      name: "Unknown Instructor",
      avatar: "",
    },
    durationInHours: 0,
    studentsCount: 0,
    lastUpdated: new Date().toISOString().split('T')[0],
    requirements: ["No requirements available"],
    whatYouWillLearn: ["Content not available"],
    reviews: [],
  } : course;

  return (
    <MainLayout>
      {/* Course Header */}
      <div className="bg-muted/30 border-b">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <Link to="/courses" className="text-sm text-eduBlue-500 mb-4 inline-block">
                &larr; Back to Courses
              </Link>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-eduBlue-500/10 hover:bg-eduBlue-500/20">
                  {courseData.categoryName || courseData.category || "Uncategorized"}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span>{courseData.rating || 0} ({courseData.reviewCount || 0} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{courseData.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{courseData.description}</p>
              
              <div className="flex items-center mb-6">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={courseData.instructor?.avatar || ''} />
                  <AvatarFallback>{courseData.instructorName?.charAt(0) || courseData.instructor?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Created by {courseData.instructorName || courseData.instructor?.name || "Unknown Instructor"}</p>
                  <p className="text-sm text-muted-foreground">Last updated: {courseData.lastUpdated || new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{calculateTotalDuration()} total</span>
                </div>
                <div className="flex items-center">
                  <Video className="h-4 w-4 mr-1" />
                  <span>{getTotalLessons()} lessons</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{courseData.enrollmentCount?.toLocaleString() || courseData.studentsCount?.toLocaleString() || 0} students</span>
                </div>
              </div>
              
              <div className="hidden md:block">
                {isEnrolled ? (
                  <div className="flex gap-4">
                    <Button asChild className="bg-eduBlue-500 hover:bg-eduBlue-600">
                      <Link to={`/my-courses/${courseData.id}/learn`}>
                        Continue Learning
                      </Link>
                    </Button>
                    <Button variant="outline" className="border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50">
                      View Course Materials
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <Button onClick={handleEnroll} disabled={isEnrolling} className="bg-eduBlue-500 hover:bg-eduBlue-600">
                      {isEnrolling ? "Enrolling..." : courseData.price === 0 ? "Enroll for Free" : `Enroll for $${courseData.price}`}
                    </Button>
                    <Button variant="outline" className="border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50">
                      Add to Wishlist
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-96">
              <div className="rounded-lg border overflow-hidden bg-card">
                <div className="aspect-video">
                  <img 
                    src={courseData.thumbnail || "/placeholder.svg"} 
                    alt={courseData.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-2xl font-bold mb-2">
                      {courseData.price === 0 ? (
                        <span className="text-eduAccent">Free</span>
                      ) : (
                        <span>${courseData.price}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Course Length</p>
                        <p className="text-sm text-muted-foreground">{calculateTotalDuration()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Book className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Total Lessons</p>
                        <p className="text-sm text-muted-foreground">{getTotalLessons()} lessons</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <User className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">Students Enrolled</p>
                        <p className="text-sm text-muted-foreground">{courseData.enrollmentCount?.toLocaleString() || courseData.studentsCount?.toLocaleString() || 0} students</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:hidden mb-6">
                    {isEnrolled ? (
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full bg-eduBlue-500 hover:bg-eduBlue-600">
                          <Link to={`/my-courses/${courseData.id}/learn`}>
                            Continue Learning
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50">
                          View Course Materials
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full bg-eduBlue-500 hover:bg-eduBlue-600">
                          {isEnrolling ? "Enrolling..." : courseData.price === 0 ? "Enroll for Free" : `Enroll for $${courseData.price}`}
                        </Button>
                        <Button variant="outline" className="w-full border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50">
                          Add to Wishlist
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    30-Day Money-Back Guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Content Tabs */}
      <div className="container py-8">
        <Tabs defaultValue="curriculum">
          <TabsList className="w-full justify-start border-b rounded-none mb-8 px-0 h-auto">
            <TabsTrigger 
              value="curriculum"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
            >
              Curriculum
            </TabsTrigger>
            <TabsTrigger 
              value="overview"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="instructor"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
            >
              Instructor
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="curriculum">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
              
              <div className="text-sm text-muted-foreground flex items-center justify-between mb-6">
                <span>{modules.length} modules • {getTotalLessons()} lessons • {calculateTotalDuration()} total length</span>
              </div>
              
              {modules.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {modules.map((module, moduleIndex) => (
                    <AccordionItem key={module.id} value={module.id.toString()}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center text-left">
                          <span className="mr-2 font-bold">{moduleIndex + 1}.</span>
                          <span className="font-medium">{module.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4 text-sm text-muted-foreground">
                          <span>{module.lessons?.length || 0} lessons</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {module.lessons && module.lessons.length > 0 ? (
                          <ul className="space-y-1 pl-6">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <li key={lesson.id} className="py-3 border-b last:border-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    {lesson.contentType === "video" ? (
                                      <Play className="h-4 w-4 mr-2 text-muted-foreground" />
                                    ) : (
                                      <Book className="h-4 w-4 mr-2 text-muted-foreground" />
                                    )}
                                    <span>
                                      <span className="font-medium">{moduleIndex + 1}.{lessonIndex + 1}</span>
                                      <span className="ml-2">{lesson.title}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <span>{lesson.durationInMinutes} min</span>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="pl-6 text-muted-foreground">No lessons available in this module.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-6 border rounded-lg">
                  <p className="text-muted-foreground">No curriculum available for this course yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="max-w-3xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
                {courseData.whatYouWillLearn && Array.isArray(courseData.whatYouWillLearn) && courseData.whatYouWillLearn.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courseData.whatYouWillLearn.map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 text-eduBlue-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No learning outcomes have been specified for this course yet.</p>
                )}
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                {courseData.requirements && Array.isArray(courseData.requirements) && courseData.requirements.length > 0 ? (
                  <ul className="space-y-2">
                    {courseData.requirements.map((requirement: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No specific requirements for this course.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="instructor">
            <div className="max-w-3xl">
              {courseData.instructor ? (
                <>
                  <div className="flex items-start gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={courseData.instructor.avatar || ''} />
                      <AvatarFallback>{courseData.instructorName?.charAt(0) || courseData.instructor?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{courseData.instructorName || courseData.instructor.name}</h2>
                      <p className="text-muted-foreground">{courseData.instructor.bio || "No instructor biography available."}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <StarIcon className="h-8 w-8 text-yellow-400 fill-yellow-400 mb-2" />
                      <p className="text-2xl font-bold">{courseData.instructor.rating || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">Instructor Rating</p>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Book className="h-8 w-8 text-eduBlue-500 mb-2" />
                      <p className="text-2xl font-bold">{courseData.instructor.coursesCount || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">Courses</p>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <User className="h-8 w-8 text-eduBlue-500 mb-2" />
                      <p className="text-2xl font-bold">{courseData.instructor.studentsCount?.toLocaleString() || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">Students</p>
                    </div>
                  </div>
                  
                  <div>
                    <Button variant="outline" asChild className="border-eduBlue-500 text-eduBlue-500 hover:bg-eduBlue-50">
                      <Link to={`/instructors/${courseData.instructorId || courseData.instructor.id}`}>
                        View All Courses by {courseData.instructorName || courseData.instructor.name}
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Instructor information not available.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Student Reviews</h2>
                {isAuthenticated && isEnrolled && (
                  <Button className="bg-eduBlue-500 hover:bg-eduBlue-600">Write a Review</Button>
                )}
              </div>
              
              <div className="flex items-center mb-8">
                <div className="text-center mr-8">
                  <p className="text-5xl font-bold">{courseData.rating || 0}</p>
                  <div className="flex items-center justify-center my-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(courseData.rating || 0) 
                            ? "text-yellow-400 fill-yellow-400" 
                            : i < (courseData.rating || 0) 
                              ? "text-yellow-400 fill-yellow-400 opacity-50" 
                              : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Course Rating</p>
                </div>
                <div className="flex-1">
                  {/* Could add rating distribution bars here */}
                </div>
              </div>
              
              <div className="space-y-6">
                {courseData.reviews && Array.isArray(courseData.reviews) && courseData.reviews.length > 0 ? (
                  courseData.reviews.map((review: any) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-start">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={review.user?.avatar || ''} />
                          <AvatarFallback>{review.userName?.charAt(0) || review.user?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{review.userName || review.user?.name}</h4>
                            <span className="text-sm text-muted-foreground">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</span>
                          </div>
                          <div className="flex items-center my-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground mt-2">{review.reviewContent || review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border rounded-lg">
                    <p className="text-muted-foreground">No reviews yet. Be the first to review this course!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
