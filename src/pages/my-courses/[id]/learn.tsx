import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarIcon, Play, Clock, Book, Video, CheckCircle, FileText, ArrowLeft, Check, HelpCircle, Trophy } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { InstructorService } from "@/services/instructor-service";
import { QuizTaking } from "@/components/quiz/quiz-taking";
import { QuizService } from "@/services/quiz-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";

import { DIRECT_API_URL } from "@/config/api-config";

// Backend base URL for serving static content
const API_BASE_URL = DIRECT_API_URL;

export default function CourseLearn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);  const [instructor, setInstructor] = useState<any>(null);
  const [isLoadingInstructor, setIsLoadingInstructor] = useState(false);  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [showQuizzes, setShowQuizzes] = useState(false);
  const [quizScore, setQuizScore] = useState<any>(null);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    // Redirect to login if user is not authenticated after loading is complete
    if (!isAuthenticated) {
      navigate(`/login?redirect=/my-courses/${id}/learn`, { replace: true });
      return;
    }
    
    const fetchCourse = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {        // Fetch course data
        const courseData = await CourseService.getCourseById(id);
        setCourse(courseData);
        
        // Get user's enrollment ID for this course
        try {
          const enrollments = await EnrollmentService.getStudentEnrollments();
          const currentEnrollment = enrollments.find((enrollment: any) => enrollment.courseId === Number(id));
          if (currentEnrollment) {
            setEnrollmentId(currentEnrollment.id);
          }
        } catch (error) {
          console.error("Error fetching enrollment ID:", error);
        }
          // Get modules and lessons for this course
        const modulesData = await CourseService.getModules(id);
          // Fetch course quizzes
        try {
          
          const quizzesData = await QuizService.getAllCourseQuizzes(Number(id));
          
          setCourseQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        } catch (error) {
          console.error("Error fetching course quizzes:", error);
          setCourseQuizzes([]);
          toast({
            title: "Warning",
            description: "Could not load quizzes for this course.",
            variant: "destructive",
          });
        }
        
        // If we have modules, fetch lessons for each module
        if (modulesData && Array.isArray(modulesData)) {
          const modulesWithLessons = await Promise.all(
            modulesData.map(async (module) => {
              try {
                const lessons = await CourseService.getLessons(id, module.id);
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
          
          // Set the first lesson as active if there are any
          if (modulesWithLessons.length > 0 && modulesWithLessons[0].lessons.length > 0) {
            setActiveLesson(modulesWithLessons[0].lessons[0]);
          }
          
          // Get completed lessons
          try {
            const completed = await EnrollmentService.getCompletedLessons(Number(id));
            setCompletedLessons(Array.isArray(completed) ? completed : []);
            
            // Calculate progress
            const totalLessons = modulesWithLessons.reduce(
              (total, module) => total + (module.lessons?.length || 0),
              0
            );
            
            if (totalLessons > 0 && Array.isArray(completed)) {
              const progress = Math.round((completed.length / totalLessons) * 100);
              setCourseProgress(progress);
            }
          } catch (error) {
            console.error("Error fetching completed lessons:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast({
          title: "Error",
          description: "Failed to load course content. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };    
    fetchCourse();  }, [id, isAuthenticated, authLoading, navigate]);
  
  // Fetch detailed instructor information
  const fetchInstructorDetails = async (instructorId: string) => {
    if (!instructorId || instructor) return; // Don't fetch if we already have instructor data
    
    setIsLoadingInstructor(true);
    try {
      const instructorData = await InstructorService.getInstructorById(instructorId);
      setInstructor(instructorData);
    } catch (error) {
      console.error("Error fetching instructor details:", error);
    } finally {
      setIsLoadingInstructor(false);
    }
  };
  
  // Fetch instructor details when course is loaded
  useEffect(() => {
    if (course?.instructorId && !instructor) {
      fetchInstructorDetails(course.instructorId);
    }
  }, [course?.instructorId, instructor]);
  
  // Fetch course reviews when the reviews tab is clicked
  const handleFetchReviews = async () => {
    if (!id || reviews.length > 0) return; // Don't fetch if we already have reviews
    
    setIsLoadingReviews(true);
    try {
      const reviewsData = await CourseService.getCourseReviews(id);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error("Error fetching course reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load course reviews. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };
    // Handle lesson completion
  const handleCompleteLesson = async (lessonId: number) => {
    if (completedLessons.includes(lessonId)) {
      // Lesson already completed
      return;
    }
    
    try {
      await EnrollmentService.completeLesson(lessonId);
      
      // Update the completed lessons list
      setCompletedLessons((prev) => [...prev, lessonId]);
      
      // Recalculate progress using the backend endpoint if we have the enrollment ID
      if (enrollmentId) {
        try {
          const result = await EnrollmentService.recalculateProgress(enrollmentId);
          setCourseProgress(result.progress);
        } catch (error) {
          console.error("Error recalculating progress:", error);
          // Fallback to local calculation if API call fails
          if (modules.length > 0) {
            const totalLessons = modules.reduce(
              (total, module) => total + (module.lessons?.length || 0),
              0
            );
            
            if (totalLessons > 0) {
              const progress = Math.round(((completedLessons.length + 1) / totalLessons) * 100);
              setCourseProgress(progress);
            }
          }
        }
      } else {
        // Fallback to local calculation if no enrollment ID
        if (modules.length > 0) {
          const totalLessons = modules.reduce(
            (total, module) => total + (module.lessons?.length || 0),
            0
          );
          
          if (totalLessons > 0) {
            const progress = Math.round(((completedLessons.length + 1) / totalLessons) * 100);
            setCourseProgress(progress);
          }
        }
      }
      
      toast({
        title: "Lesson Completed",
        description: "Your progress has been updated!",
      });
    } catch (error) {
      console.error("Error marking lesson as completed:", error);
      toast({
        title: "Error",
        description: "Could not mark lesson as completed. Please try again.",
        variant: "destructive",
      });
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
  // Helper function to check if a lesson has quizzes
  const lessonHasQuizzes = (lessonId: number) => {
    return courseQuizzes.some(quiz => quiz.lessonId === lessonId);
  };

  // Handle quiz completion and update progress
  const handleQuizComplete = (score: any) => {
    setQuizScore(score);
    toast({
      title: "Quiz Completed!",
      description: `You scored ${score.correctAnswers} out of ${score.totalQuizzes} questions.`,
    });

    // Optionally recalculate course progress including quiz completion
    if (enrollmentId) {
      EnrollmentService.recalculateProgress(enrollmentId)
        .then((result) => {
          setCourseProgress(result.progress);
        })
        .catch((error) => {
          console.error("Error recalculating progress after quiz:", error);
        });
    }
  };

  // Determine lesson content based on type
  const renderLessonContent = (lesson: any) => {
    if (!lesson) return <div className="text-center py-8">No lesson selected</div>;
    
    switch (lesson.contentType) {
      case 'video':
        return (
          <div className="space-y-6">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              {lesson.content ? (
                <video 
                  src={lesson.content} 
                  controls 
                  className="w-full h-full rounded-lg"
                />
              ) : (
                <div className="text-white text-center p-8">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Video content unavailable</p>
                </div>
              )}
            </div>
            <div className="prose max-w-none">
              <h1>{lesson.title}</h1>
              <p>{lesson.description || "No description available for this lesson."}</p>
            </div>
          </div>
        );
        
      case 'article':
      case 'text':
      default:
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h1>{lesson.title}</h1>
              <div>
                {lesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : (
                  <p>No content available for this lesson.</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  // Debug function to check JWT token status
  const debugJwtToken = () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='))
      ?.split('=')[1];
    
    
    
    if (token) {
      
      
      
      try {
        const parts = token.split('.');
        
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', {
            userId: payload.sub || payload.id,
            email: payload.email,
            exp: new Date(payload.exp * 1000).toISOString(),
            iat: new Date(payload.iat * 1000).toISOString(),
            isExpired: payload.exp < Math.floor(Date.now() / 1000)
          });
        }
      } catch (error) {
        // Silent error handling for token parsing
      }
    }
    
    
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eduBlue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Course Header */}
      <div className="bg-muted/30 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/my-courses" className="text-sm text-eduBlue-500 mb-2 inline-flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Courses
              </Link>
              <h1 className="text-2xl font-bold">{course?.title || "Course"}</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Progress value={courseProgress} className="w-32 h-2" />
                <span>{courseProgress}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Course Curriculum */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="border rounded-lg bg-card overflow-hidden sticky top-24">
              <div className="p-4 border-b bg-muted/50">
                <h2 className="font-semibold">Course Content</h2>                <div className="text-xs text-muted-foreground mt-1">
                  {modules.length} modules • {getTotalLessons()} lessons • {courseQuizzes.length} quizzes • {calculateTotalDuration()} total
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                <Accordion type="single" collapsible defaultValue={activeLesson ? String(activeLesson.moduleId) : undefined}>
                  {modules.map((module, moduleIndex) => (
                    <AccordionItem key={module.id} value={String(module.id)}>
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center text-left">
                          <span className="mr-2 font-semibold">{moduleIndex + 1}.</span>
                          <span>{module.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-1">
                          {module.lessons?.map((lesson: any, lessonIndex: number) => {
                            const isCompleted = completedLessons.includes(lesson.id);
                            const isActive = activeLesson?.id === lesson.id;
                            
                            return (
                              <li key={lesson.id}>
                                <button
                                  onClick={() => setActiveLesson(lesson)}
                                  className={`w-full px-6 py-2 text-left flex items-start gap-2 hover:bg-muted transition-colors ${
                                    isActive ? 'bg-muted/70 font-medium' : ''
                                  }`}
                                >
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isCompleted ? (
                                      <div className="h-5 w-5 rounded-full bg-eduBlue-500 text-white flex items-center justify-center">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-xs">
                                        {moduleIndex + 1}.{lessonIndex + 1}
                                      </div>
                                    )}
                                  </div>                                  <div className="flex-1">
                                    <div className="text-sm flex items-center justify-between">
                                      <span>{lesson.title}</span>                                      {lessonHasQuizzes(lesson.id) && (
                                        <HelpCircle className="h-3 w-3 text-eduBlue-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                                      {lesson.contentType === 'video' ? (
                                        <Play className="h-3 w-3 mr-1" />
                                      ) : (
                                        <FileText className="h-3 w-3 mr-1" />
                                      )}
                                      <span>{lesson.durationInMinutes} min</span>
                                    </div>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Lesson Content */}
            <div className="mb-8">
              <div className="border rounded-lg p-6">
                {renderLessonContent(activeLesson)}
                  {activeLesson && (
                  <div className="mt-8 space-y-4">
                    {/* Quiz indicator for current lesson */}
                    {lessonHasQuizzes(activeLesson.id) && (
                      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            This lesson has quizzes available
                          </p>
                          <p className="text-xs text-blue-700">
                            Complete the lesson to unlock the quiz in the Quizzes tab
                          </p>
                        </div>
                        {completedLessons.includes(activeLesson.id) && (
                          <Badge variant="default" className="bg-blue-600">
                            Quiz Unlocked
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {activeLesson.contentType === 'video' ? (
                          <div className="flex items-center">
                            <Play className="h-4 w-4 mr-1" />
                            <span>Video • {activeLesson.durationInMinutes} min</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            <span>Reading • {activeLesson.durationInMinutes} min</span>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant={completedLessons.includes(activeLesson.id) ? "outline" : "default"}
                        onClick={() => handleCompleteLesson(activeLesson.id)}
                        disabled={completedLessons.includes(activeLesson.id)}
                        className={completedLessons.includes(activeLesson.id) ? "border-eduBlue-500 text-eduBlue-500" : ""}
                      >
                        {completedLessons.includes(activeLesson.id) ? (
                          <>
                            <Check className="h-4 w-4 mr-2" /> Completed
                          </>
                        ) : (
                          "Mark as Completed"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
              {/* Course Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start border-b rounded-none mb-6 px-0 h-auto">
                <TabsTrigger 
                  value="overview"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="quizzes"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-eduBlue-500 h-10"
                  onClick={handleFetchReviews}
                >
                  Reviews
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">About This Course</h2>
                    <p className="text-muted-foreground">{course?.description}</p>
                  </div>
                  
                  {course?.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What You'll Learn</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.whatYouWillLearn.map((item: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 mr-2 text-eduBlue-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {course?.requirements && course.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Requirements</h3>
                      <ul className="space-y-2">
                        {course.requirements.map((requirement: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}                  <div>
                    <h3 className="text-lg font-semibold mb-4">Instructor</h3>
                    {isLoadingInstructor ? (
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-48 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>                    ) : instructor ? (
                      <div className="flex items-start gap-4">
                        <Link to={`/instructors/${instructor.id}/courses`} className="flex-shrink-0">
                          <Avatar className="h-16 w-16 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                            <AvatarImage src={instructor.avatar || instructor.profilePicture ? getImageUrl(instructor.avatar || instructor.profilePicture) : ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {getInitials(`${instructor.firstName || ''} ${instructor.lastName || ''}` || instructor.name || 'Unknown')}
                            </AvatarFallback>
                          </Avatar>
                        </Link>                        <div className="flex-1">
                          <Link to={`/instructors/${instructor.id}/courses`} className="group">
                            <h4 className="text-lg font-medium group-hover:text-primary transition-colors cursor-pointer">
                              {instructor.name || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Unknown Instructor'}
                            </h4>
                          </Link>
                          {instructor.bio && (
                            <p className="text-sm text-muted-foreground">
                              {instructor.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : course?.instructorName ? (
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={course.instructorImage ? getImageUrl(course.instructorImage) : ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(course.instructorName || 'Unknown')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{course.instructorName}</h4>
                          <p className="text-sm text-muted-foreground">Instructor details not available</p>
                        </div>
                      </div>                    ) : (
                      <p className="text-muted-foreground">Instructor information not available.</p>
                    )}
                  </div>
                  
                  {/* Course Progress Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700">Lessons</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {completedLessons.length}/{getTotalLessons()}
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700">Quizzes Available</p>
                            <p className="text-2xl font-bold text-green-900">
                              {courseQuizzes.length}
                            </p>
                          </div>
                          <HelpCircle className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-700">Overall Progress</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {courseProgress}%
                            </p>
                          </div>
                          <Trophy className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
                <TabsContent value="quizzes">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Course Quizzes</h2>
                    {quizScore && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Last Score: {quizScore.correctAnswers}/{quizScore.totalQuizzes}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {courseQuizzes.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Complete lessons to unlock their quizzes and test your knowledge.
                      </p>
                      
                      {modules.map((module) => 
                        module.lessons?.map((lesson: any) => {
                          const lessonQuizzes = courseQuizzes.filter(quiz => quiz.lessonId === lesson.id);
                          const isCompleted = completedLessons.includes(lesson.id);
                          
                          if (lessonQuizzes.length === 0) return null;
                          
                          return (
                            <Card key={lesson.id} className="overflow-hidden">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                      {lessonQuizzes.length} quiz{lessonQuizzes.length > 1 ? 'es' : ''} available
                                    </p>
                                  </div>
                                  <Badge variant={isCompleted ? "default" : "secondary"}>
                                    {isCompleted ? "Unlocked" : "Complete lesson to unlock"}
                                  </Badge>
                                </div>
                              </CardHeader>                              {isCompleted && (                                <CardContent className="pt-0">
                                  <QuizTaking 
                                    lessonId={lesson.id}
                                    courseId={Number(id)}
                                    onQuizComplete={handleQuizComplete}
                                  />
                                </CardContent>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Quizzes Available</h3>
                      <p className="text-muted-foreground">
                        This course doesn't have any quizzes yet. Check back later!
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="max-w-3xl">                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Student Reviews</h2>
                  </div>
                  
                  <div className="flex items-center mb-8">
                    <div className="text-center mr-8">
                      <p className="text-5xl font-bold">{course?.rating || 0}</p>
                      <div className="flex items-center justify-center my-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={`course-rating-star-${i}`}
                            className={`h-5 w-5 ${
                              i < Math.floor(course?.rating || 0) 
                                ? "text-yellow-400 fill-yellow-400" 
                                : i < (course?.rating || 0) 
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
                  
                  {isLoadingReviews ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eduBlue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews && reviews.length > 0 ? (
                        reviews.map((review: any) => (
                          <div key={review.id} className="border-b pb-6 last:border-0">
                            <div className="flex items-start">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={(review.studentImage) ? getImageUrl(review.studentImage) : ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">{getInitials(review.studentName || review.userName || 'Anonymous')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{review.studentName || "Anonymous Student"}</h4>
                                  <span className="text-sm text-muted-foreground">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</span>
                                </div>
                                <div className="flex items-center my-1">
                                  {[...Array(5)].map((_, i) => (
                                    <StarIcon
                                      key={`review-star-${review.id}-${i}`}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>                                <p className="text-muted-foreground mt-2">{review.reviewContent}</p>
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
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>    </MainLayout>
  );
}