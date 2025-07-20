import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarIcon, Play, Clock, User, Book, Video, CheckCircle } from "lucide-react";
import { API } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import { CourseStructuredData } from "@/components/seo/course-structured-data";
import { SEO } from "@/components/seo/seo";

// Component for course description with show more/less functionality
interface CourseDescriptionWithToggleProps {
  description: string;
}

const CourseDescriptionWithToggle = ({ description }: CourseDescriptionWithToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Set character limit for truncation
  const CHARACTER_LIMIT = 300;
  
  // Check if description needs truncation
  const shouldTruncate = description.length > CHARACTER_LIMIT;
  
  // Get displayed text based on state
  const displayedText = shouldTruncate && !isExpanded 
    ? description.slice(0, CHARACTER_LIMIT) + "..."
    : description;
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">About This Course</h2>
      <div className="text-muted-foreground whitespace-pre-wrap">
        {displayedText}
        {shouldTruncate && (
          <Button
            variant="link"
            className="p-0 h-auto text-primary hover:text-primary/80 font-medium ml-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
    </div>
  );
};

// Mock course data for development
const MOCK_COURSE = {
  id: "course-1",
  title: "Introduction to Web Development",
  description: `Learn the fundamentals of web development, including HTML, CSS, and JavaScript. 

This comprehensive course takes you from a beginner to building complete websites. You'll understand how the web works, create responsive layouts, add interactivity, and deploy your sites to the internet.

Perfect for beginners who want to start their web development journey!`,
  thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=500&fit=crop",
  rating: 4.7,
  reviewCount: 128,
  price: 49.99,
  category: "Web Development",
  instructor: {
    id: "instructor-1",
    name: "John Doe",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Web development expert with 10+ years of experience. Former senior developer at Google and Meta.",
    coursesCount: 12,
    studentsCount: 10240,
    rating: 4.8,
  },
  duration: "10 hours",
  studentsCount: 2450,
  lastUpdated: "2023-12-10",
  modules: [
    {
      id: "module-1",
      title: "Getting Started with HTML",
      lessons: [
        { id: "lesson-1-1", title: "Introduction to HTML", duration: "15 mins", contentType: "video" },
        { id: "lesson-1-2", title: "HTML Document Structure", duration: "20 mins", contentType: "video" },
        { id: "lesson-1-3", title: "HTML Elements and Attributes", duration: "25 mins", contentType: "video" },
        { id: "lesson-1-4", title: "Practice: Your First HTML Page", duration: "15 mins", contentType: "article" },
      ],
    },
    {
      id: "module-2",
      title: "Styling with CSS",
      lessons: [
        { id: "lesson-2-1", title: "Introduction to CSS", duration: "18 mins", contentType: "video" },
        { id: "lesson-2-2", title: "CSS Selectors", duration: "22 mins", contentType: "video" },
        { id: "lesson-2-3", title: "Box Model", duration: "20 mins", contentType: "video" },
        { id: "lesson-2-4", title: "Flexbox Layout", duration: "30 mins", contentType: "video" },
        { id: "lesson-2-5", title: "CSS Grid", duration: "28 mins", contentType: "video" },
        { id: "lesson-2-6", title: "Practice: Styling Your HTML Page", duration: "20 mins", contentType: "article" },
      ],
    },
    {
      id: "module-3",
      title: "JavaScript Fundamentals",
      lessons: [
        { id: "lesson-3-1", title: "Introduction to JavaScript", duration: "15 mins", contentType: "video" },
        { id: "lesson-3-2", title: "Variables and Data Types", duration: "25 mins", contentType: "video" },
        { id: "lesson-3-3", title: "Functions and Scope", duration: "30 mins", contentType: "video" },
        { id: "lesson-3-4", title: "DOM Manipulation", duration: "35 mins", contentType: "video" },
        { id: "lesson-3-5", title: "Events and Event Handling", duration: "25 mins", contentType: "video" },
        { id: "lesson-3-6", title: "Practice: Adding Interactivity", duration: "25 mins", contentType: "article" },
      ],
    },
  ],
  requirements: `Basic computer skills
No prior programming experience needed
A computer with internet access
Text editor (recommended: VS Code, will be covered in the course)`,
  whatYouWillLearn: [
    "Build complete, responsive websites from scratch",
    "Write clean, semantic HTML",
    "Style websites using CSS and modern layout techniques",
    "Add interactivity to websites with JavaScript",
    "Understand web development best practices",
    "Deploy websites to the internet"
  ],
  reviews: [
    {
      id: "review-1",
      user: { id: "user-1", name: "Alice Smith", avatar: "https://randomuser.me/api/portraits/women/12.jpg" },
      rating: 5,
      content: "This course was exactly what I needed to start my web development journey. Very clear explanations and practical examples.",
      createdAt: "2023-11-15",
    },
    {
      id: "review-2",
      user: { id: "user-2", name: "Bob Johnson", avatar: "https://randomuser.me/api/portraits/men/23.jpg" },
      rating: 4,
      content: "Great content overall. Some sections could use more examples, but I learned a lot and was able to build my first website.",
      createdAt: "2023-10-22",
    },
    {
      id: "review-3",
      user: { id: "user-3", name: "Carol Williams", avatar: "https://randomuser.me/api/portraits/women/35.jpg" },
      rating: 5,
      content: "John is an excellent instructor! He explains complex concepts in a way that's easy to understand. Highly recommended!",
      createdAt: "2023-09-18",
    },
  ],
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Determine if current user is the instructor of this course
  const isInstructor = user?.userType === 'Instructor' && course?.instructorId === user?.id;

  // Fetch real course data
  useEffect(() => {
    if (!id) return;
    
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        // Import CourseService
        const { CourseService } = await import('@/services/course-service');
        const courseData = await CourseService.getCourseById(id);
        setCourse(courseData);
        
        // Check if user is enrolled (only for students)
        if (isAuthenticated && user?.userType === 'Student') {
          const { EnrollmentService } = await import('@/services/enrollment-service');
          const enrollments = await EnrollmentService.getStudentEnrollments();
          setIsEnrolled(enrollments.some((enrollment: any) => enrollment.courseId === parseInt(id)));
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        // Fallback to mock data if API fails
        setCourse(MOCK_COURSE);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [id, isAuthenticated, user]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `/login?redirect=/courses/${id}`;
      return;
    }
    
    if (!course) return;
    
    setIsEnrolling(true);
    try {
      const { CourseService } = await import('@/services/course-service');
      
      // If course is free, enroll directly using the simple endpoint
      if (course.price === 0) {
        await CourseService.freeEnroll(id!);
        setIsEnrolled(true);
        // Show success toast
        const { toast } = await import('@/components/ui/use-toast');
        toast({
          title: "Success!",
          description: "You have successfully enrolled in this course for free.",
        });
      } else {
        // For paid courses, use the payment flow
        await CourseService.enroll(id!);
        setIsEnrolled(true);
        const { toast } = await import('@/components/ui/use-toast');
        toast({
          title: "Success!",
          description: "You have successfully enrolled in this course.",
        });
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
      const { toast } = await import('@/components/ui/use-toast');
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
    let totalMinutes = 0;
    
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        // Extract just the number from durations like "15 mins"
        const mins = parseInt(lesson.duration.split(" ")[0], 10);
        if (!isNaN(mins)) {
          totalMinutes += mins;
        }
      });
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Helper function to count total lessons
  const getTotalLessons = () => {
    return course.modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={`${course.title} - ElCentre | Online Course`}
        description={course.description}
        keywords={`${course.title}, ${course.category}, online course, ${course.instructor.name}, learning, education`}
        url={`https://elcentre-learn.vercel.app/courses/${id}`}
        image={course.thumbnail}
      />
      
      <CourseStructuredData 
        course={course} 
        url={`https://elcentre-learn.vercel.app/courses/${id}`}
      />

      {/* Course Header */}
      <div className="bg-muted/30 border-b">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <Link to="/courses" className="text-sm text-primary mb-4 inline-block">
                &larr; Back to Courses
              </Link>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
                  {course.category}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span>{course.rating} ({course.reviewCount} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                <div className="flex items-center mb-6">
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={course.instructor.avatar ? getImageUrl(course.instructor.avatar) : ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">{getInitials(course.instructor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Created by {course.instructor.name}</p>
                  <p className="text-sm text-muted-foreground">Last updated: {course.lastUpdated}</p>
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
                  <span>{course.studentsCount.toLocaleString()} students</span>
                </div>
              </div>
              
              <div className="hidden md:block">
                {isInstructor ? (
                  <div className="flex gap-4">
                    <Button asChild>
                      <Link to={`/my-courses/${course.id}/learn?instructor=true`}>
                        View Course
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={`/dashboard/instructor/courses/${course.id}/content`}>
                        Manage Content
                      </Link>
                    </Button>
                  </div>
                ) : isEnrolled ? (
                  <div className="flex gap-4">
                    <Button asChild>
                      <Link to={`/my-courses/${course.id}/learn`}>
                        Continue Learning
                      </Link>
                    </Button>
                    <Button variant="outline">
                      View Course Materials
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <Button onClick={handleEnroll} disabled={isEnrolling}>
                      {isEnrolling ? "Enrolling..." : course.price === 0 ? "Enroll for Free" : `Enroll for ${course.price}EGP`}
                    </Button>
                    <Button variant="outline">
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
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-2xl font-bold mb-2">
                      {course.price === 0 ? (
                        <span className="text-eduAccent">Free</span>
                      ) : (
                        <span>${course.price}</span>
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
                      <Book className="h-5 w-5 text-primary mb-2" />
                      <div>
                        <p className="font-medium">Total Lessons</p>
                        <p className="text-sm text-muted-foreground">{getTotalLessons()} lessons</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <User className="h-5 w-5 text-primary mb-2" />
                      <div>
                        <p className="font-medium">Students Enrolled</p>
                        <p className="text-sm text-muted-foreground">{course.studentsCount.toLocaleString()} students</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:hidden mb-6">
                    {isInstructor ? (
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                          <Link to={`/my-courses/${course.id}/learn?instructor=true`}>
                            View Course
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                          <Link to={`/dashboard/instructor/courses/${course.id}/content`}>
                            Manage Content
                          </Link>
                        </Button>
                      </div>
                    ) : isEnrolled ? (
                      <div className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                          <Link to={`/my-courses/${course.id}/learn`}>
                            Continue Learning
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full">
                          View Course Materials
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full">
                          {isEnrolling ? "Enrolling..." : course.price === 0 ? "Enroll for Free" : `Enroll for ${course.price}EGP`}
                        </Button>
                        <Button variant="outline" className="w-full">
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
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
            >
              Curriculum
            </TabsTrigger>
            <TabsTrigger 
              value="overview"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="instructor"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
            >
              Instructor
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="curriculum">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
              
              <div className="text-sm text-muted-foreground flex items-center justify-between mb-6">
                <span>{course.modules.length} modules • {getTotalLessons()} lessons • {calculateTotalDuration()} total length</span>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {course.modules.map((module, moduleIndex) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center text-left">
                        <span className="mr-2 font-bold">{moduleIndex + 1}.</span>
                        <span className="font-medium">{module.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 ml-4 text-sm text-muted-foreground">
                        <span>{module.lessons.length} lessons</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1 pl-6">
                        {module.lessons.map((lesson, lessonIndex) => (
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
                                <span>{lesson.duration}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="max-w-3xl">
              <CourseDescriptionWithToggle description={course.description} />
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.whatYouWillLearn.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                {course.requirements && course.requirements.trim() ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{course.requirements}</p>
                ) : (
                  <p className="text-muted-foreground">No specific requirements for this course.</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="instructor">
            <div className="max-w-3xl">              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={course.instructor.avatar ? getImageUrl(course.instructor.avatar) : ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">{getInitials(course.instructor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{course.instructor.name}</h2>
                  <p className="text-muted-foreground">{course.instructor.bio}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <StarIcon className="h-8 w-8 text-yellow-400 fill-yellow-400 mb-2" />
                  <p className="text-2xl font-bold">{course.instructor.rating}</p>
                  <p className="text-sm text-muted-foreground">Instructor Rating</p>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Book className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{course.instructor.coursesCount}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <User className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{course.instructor.studentsCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
              
              <div>
                <Button variant="outline" asChild>
                  <Link to={`/instructors/${course.instructor.id}`}>
                    View All Courses by {course.instructor.name}
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Student Reviews</h2>
                {isAuthenticated && isEnrolled && (
                  <Button>Write a Review</Button>
                )}
              </div>
              
              <div className="flex items-center mb-8">
                <div className="text-center mr-8">
                  <p className="text-5xl font-bold">{course.rating}</p>
                  <div className="flex items-center justify-center my-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(course.rating) 
                            ? "text-yellow-400 fill-yellow-400" 
                            : i < course.rating 
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
                {course.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-0">                    <div className="flex items-start">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={review.user.avatar ? getImageUrl(review.user.avatar) : ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">{getInitials(review.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{review.user.name}</h4>
                          <span className="text-sm text-muted-foreground">{review.createdAt}</span>
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
                        <p className="text-muted-foreground mt-2">{review.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
