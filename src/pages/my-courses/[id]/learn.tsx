import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StarIcon, Play, Clock, Book, Video, CheckCircle, FileText, ArrowLeft, Check, HelpCircle, Trophy, Bell, MessageSquare, Bot, X } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { InstructorService } from "@/services/instructor-service";
import { QuizTaking } from "@/components/quiz/quiz-taking";
import { QuizService } from "@/services/quiz-service";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { useVideoTranscription } from "@/hooks/use-video-transcription";
import { useRateLimitedAction } from "@/hooks/use-debounced-actions";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { SecureVideoPlayer } from "@/components/ui/secure-video-player";
import { SimpleLessonViewer } from "@/components/lessons/simple-lesson-viewer";
import { QAComponent } from "@/components/qa";
import { CreateNotificationForm } from "@/components/notifications/create-notification-form";
import { AIAssistant } from "@/components/ai-assistant/ai-assistant";
import { RichTextLessonViewer } from "@/components/lessons/rich-text-lesson-viewer";
import "@/styles/secure-video.css";

import { DIRECT_API_URL } from "@/config/api-config";

// Backend base URL for serving static content
const API_BASE_URL = DIRECT_API_URL;

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
    <div>
      <h2 className="text-xl font-semibold mb-4">About This Course</h2>
      <div 
        className="text-muted-foreground prose max-w-none"
        dangerouslySetInnerHTML={{ __html: displayedText }}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      />
      {shouldTruncate && (
        <Button
          variant="link"
          className="p-0 h-auto text-eduBlue-500 hover:text-eduBlue-600 font-medium mt-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
};

export default function CourseLearn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { joinCourseGroup, leaveCourseGroup, isSubscribedToCourse, notifications, markAsRead, refreshNotifications } = useNotifications();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<{
    lessonId: number;
    enrollmentId: number;
    completedDate: string;
  }[]>([]);
  const [courseProgress, setCourseProgress] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);  const [instructor, setInstructor] = useState<any>(null);
  const [isLoadingInstructor, setIsLoadingInstructor] = useState(false);  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [showQuizzes, setShowQuizzes] = useState(false);
  const [quizScore, setQuizScore] = useState<any>(null);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [qaTargetQuestionId, setQaTargetQuestionId] = useState<number | undefined>(undefined);
  const [qaTargetAnswerId, setQaTargetAnswerId] = useState<number | undefined>(undefined);
  
  // Content processing state for AI Assistant
  const [lessonTranscript, setLessonTranscript] = useState('');
  const [isProcessingContent, setIsProcessingContent] = useState(false);
  
  // Use course language for transcription instead of detecting from lesson title
  const { transcribeVideo, isTranscribing, error: transcriptionError } = useVideoTranscription({
    courseLanguage: 'auto' // Use auto-detection, override will be provided when calling transcribeVideo
  });
  
  // Use course language for video transcription
  const transcribeVideoWithCourseLanguage = useCallback(async (videoUrl: string) => {
    // Use the course's configured language - get it fresh from the current course state
    const courseLanguage = course?.CourseLanguage || course?.courseLanguage || 'ar'; // Default to Arabic if no course language detected
    // Pass the course language to the transcription service
    return await transcribeVideo(videoUrl, courseLanguage);
  }, [transcribeVideo, course?.CourseLanguage, course?.courseLanguage, course]);
  
  // Helper function to check if a lesson is completed
  const isLessonCompleted = useCallback((lessonId: number) => {
    return completedLessons.some(completed => completed.lessonId === lessonId);
  }, [completedLessons]);
  
  // Check if instructor is viewing the course
  const isInstructorViewing = new URLSearchParams(location.search).get('instructor') === 'true' && user?.userType === 'Instructor';
  
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    // Redirect to login if user is not authenticated after loading is complete
    if (!isAuthenticated) {
      const currentUrl = `/my-courses/${id}/learn${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
      return;
    }
    
    const fetchCourse = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {        // Fetch course data
        const courseData = await CourseService.getCourseById(id);
        setCourse(courseData);
        
        // Get user's enrollment ID for this course (skip for instructor viewing)
        if (!isInstructorViewing) {
          try {
            const enrollments = await EnrollmentService.getStudentEnrollments();
            const currentEnrollment = enrollments.find((enrollment: any) => enrollment.courseId === Number(id));
            if (currentEnrollment) {
              setEnrollmentId(currentEnrollment.id);
            }
          } catch (error) {
            console.error("Error fetching enrollment ID:", error);
          }
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
                
                // Filter lessons based on publish status
                let filteredLessons = Array.isArray(lessons) ? lessons : [];
                
                // Hide unpublished lessons for all users (instructors can manage them in content management)
                filteredLessons = filteredLessons.filter(lesson => lesson.isPublished);
                
                return {
                  ...module,
                  lessons: filteredLessons
                };
              } catch (error) {
                console.error(`Error fetching lessons for module ${module.id}:`, error);
                return { ...module, lessons: [] };
              }
            })
          );
          
          // Filter modules based on publish status
          let filteredModules = modulesWithLessons;
          
          // Hide unpublished modules or modules with no published lessons for all users
          filteredModules = modulesWithLessons.filter(module => 
            module.isPublished && module.lessons.length > 0
          );
          
          setModules(filteredModules);
          
          // Set the first lesson as active if there are any
          if (filteredModules.length > 0 && filteredModules[0].lessons.length > 0) {
            setActiveLesson(filteredModules[0].lessons[0]);
          }
          
          // Get completed lessons (skip for instructor viewing)
          if (!isInstructorViewing) {
            try {
              const completed = await EnrollmentService.getCompletedLessons(Number(id));
              setCompletedLessons(Array.isArray(completed) ? completed : []);
              
              // Calculate progress
              const totalLessons = filteredModules.reduce(
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
          } else {
            // For instructor viewing, show all lessons as viewable but not completed
            setCompletedLessons([]);
            setCourseProgress(0);
          }
        }
        
        // Preload reviews for faster access
        try {
          const reviewsData = await CourseService.getCourseReviews(id);
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        } catch (error) {
          // Silent error handling for reviews preloading
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
    fetchCourse();  }, [id, isAuthenticated, authLoading, navigate, isInstructorViewing]);
  
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

  // Process lesson content for AI Assistant when active lesson changes
  useEffect(() => {
    const processLessonContent = async () => {
      if (!activeLesson) {
        setLessonTranscript('');
        setIsProcessingContent(false);
        return;
      }

      // Check if we already have cached content for this lesson
      const cachedContent = localStorage.getItem(`lesson-content-${activeLesson.id}`);
      if (cachedContent) {
        setLessonTranscript(cachedContent);
        setIsProcessingContent(false);
        return;
      }

      setIsProcessingContent(true);

      try {
        let lessonContent = '';

        if (activeLesson.contentType === 'text' || activeLesson.contentType === 'article') {
          // For text lessons, use the content directly
          if (activeLesson.content) {
            // Strip HTML tags to get clean text for AI
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = activeLesson.content;
            lessonContent = tempDiv.textContent || tempDiv.innerText || '';
            
            // Add lesson title and description for better context
            lessonContent = `Lesson Title: ${activeLesson.title}\n\n` +
                          (activeLesson.description ? `Description: ${activeLesson.description}\n\n` : '') +
                          `Content:\n${lessonContent}`;
          }
        } else if (activeLesson.contentType === 'video') {
          // For video lessons, transcribe the video
          let videoUrl = null;
          if (activeLesson.content) {
            if (activeLesson.content.startsWith('http')) {
              videoUrl = activeLesson.content;
            } else {
              const contentPath = activeLesson.content.replace(/^\//, '');
              videoUrl = `${DIRECT_API_URL}/${contentPath}`;
            }
          }

          if (videoUrl) {
            const result = await transcribeVideoWithCourseLanguage(videoUrl);
            if (result && result.text) {
              lessonContent = `Lesson Title: ${activeLesson.title}\n\n` +
                            (activeLesson.description ? `Description: ${activeLesson.description}\n\n` : '') +
                            `Video Transcript:\n${result.text}`;
            }
          }
        }

        if (lessonContent) {
          setLessonTranscript(lessonContent);
          // Cache the processed content
          localStorage.setItem(`lesson-content-${activeLesson.id}`, lessonContent);
        } else {
          setLessonTranscript('');
        }
      } catch (error) {
        console.error('Error processing lesson content:', error);
        // Show a subtle error notification
        if (transcriptionError && activeLesson.contentType === 'video') {
          toast({
            title: "Transcription Unavailable",
            description: "AI Assistant will work with limited context for this lesson.",
            variant: "default",
          });
        }
      } finally {
        setIsProcessingContent(false);
      }
    };

    processLessonContent();
  }, [activeLesson, transcribeVideoWithCourseLanguage, transcriptionError]);

  // Join course notification group when course is loaded and user is subscribed
  useEffect(() => {
    if (course?.id && isAuthenticated && (user?.userType === "Student" || isInstructorViewing)) {
      // Auto-join if subscribed to notifications for this course
      if (isSubscribedToCourse(course.id)) {
        joinCourseGroup(course.id);
      }
      
      // Leave the group when component unmounts or course changes
      return () => {
        leaveCourseGroup(course.id);
      };
    }
  }, [course?.id, isAuthenticated, user?.userType, isSubscribedToCourse, joinCourseGroup, leaveCourseGroup, isInstructorViewing]);

  // Global keyboard protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts that could be used to save or inspect content
      // but allow some video control shortcuts
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || // Ctrl+Shift+I (Developer Tools)
        (e.key === 'F12') || // F12 (Developer Tools)
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) || // Ctrl+Shift+C (Inspect Element)
        (e.ctrlKey && (e.key === 'U' || e.key === 'u')) || // Ctrl+U (View Source)
        (e.ctrlKey && (e.key === 'S' || e.key === 's')) || // Ctrl+S (Save)
        (e.ctrlKey && (e.key === 'P' || e.key === 'p')) // Ctrl+P (Print)
      ) {
        // Only prevent if not in a video container
        const target = e.target as HTMLElement;
        if (!target.closest('.secure-video-container')) {
          e.preventDefault();
          e.stopPropagation();
          toast({
            title: "Action Restricted",
            description: "This action is not allowed on protected content.",
            variant: "destructive",
          });
          return false;
        }
      }
    };

    const handleRightClick = (e: MouseEvent) => {
      // Check if the target is within a video element or its container
      const target = e.target as HTMLElement;
      if (target.closest('.secure-video-container') || target.tagName === 'VIDEO') {
        e.preventDefault();
        toast({
          title: "Action Restricted",
          description: "Right-click is disabled on video content.",
          variant: "destructive",
        });
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleRightClick);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);

  // Handle notification navigation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#notification-')) {
      setActiveTab('notifications');
      // Scroll to the notification after a short delay to ensure the tab content is rendered
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (hash.startsWith('#question-')) {
      // Navigate to Q&A tab for question notifications
      setActiveTab('qa');
      const questionId = parseInt(hash.split('#question-')[1]);
      setQaTargetQuestionId(questionId);
      setQaTargetAnswerId(undefined);
    } else if (hash.startsWith('#answer-')) {
      // Navigate to Q&A tab for answer notifications
      setActiveTab('qa');
      const answerId = parseInt(hash.split('#answer-')[1]);
      setQaTargetAnswerId(answerId);
      setQaTargetQuestionId(undefined);
    }
  }, [location.hash]);

  // Clear Q&A navigation targets when switching tabs
  useEffect(() => {
    if (activeTab !== 'qa') {
      setQaTargetQuestionId(undefined);
      setQaTargetAnswerId(undefined);
    }
  }, [activeTab]);

  // Handle state-based navigation from notification bell (higher priority)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state to prevent repeated navigation, but preserve search params and hash
      navigate(location.pathname + location.search + location.hash, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, location.search, location.hash]);

  // Handle AI Assistant being disabled - redirect from ai-assistant tab if it's disabled
  useEffect(() => {
    if (activeTab === 'ai-assistant' && !course?.useAIAssistant && !isInstructorViewing) {
      setActiveTab('overview');
    }
  }, [activeTab, course?.useAIAssistant, isInstructorViewing]);
  
  // Fetch course reviews when the reviews tab is clicked (if not already loaded)
  const handleFetchReviews = async () => {
    if (!id || reviews.length > 0) return; // Don't fetch if we already have reviews
    
    setIsLoadingReviews(true);
    try {
      const reviewsData = await CourseService.getCourseReviews(id);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course reviews. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Handle notification click for Q&A navigation
  const handleNotificationClick = (notification: any) => {

    if (notification.notificationType === 'NewQuestion' || notification.notificationType === 'NewAnswer') {
      // Navigate to Q&A tab
      setActiveTab('qa');
      
      // Set the target IDs for navigation
      if (notification.questionId) {
        setQaTargetQuestionId(notification.questionId);
        setQaTargetAnswerId(undefined);
      } else if (notification.answerId) {
        setQaTargetAnswerId(notification.answerId);
        setQaTargetQuestionId(undefined);
      }
      
      // Extract question/answer ID from notification
      // The backend should include questionId or answerId in the notification data
      if (notification.questionId) {
        // Navigate to specific question
        setTimeout(() => {
          window.location.hash = `#question-${notification.questionId}`;
        }, 100);
      } else if (notification.answerId) {
        // Navigate to specific answer
        setTimeout(() => {
          window.location.hash = `#answer-${notification.answerId}`;
        }, 100);
      }
    } else {
      // For non-Q&A notifications, if instructor is viewing, preserve instructor mode
      if (isInstructorViewing) {
        // Stay in instructor viewing mode for announcements
        setActiveTab('notifications');
        setTimeout(() => {
          window.location.hash = `#notification-${notification.id}`;
        }, 100);
      } else {
        // For students, normal navigation
        setActiveTab('notifications');
        setTimeout(() => {
          window.location.hash = `#notification-${notification.id}`;
        }, 100);
      }
    }
    
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  // Handle notification creation success (for instructors)
  const handleNotificationCreated = () => {
    // Refresh notifications to show the new announcement
    refreshNotifications();
    toast({
      title: "Announcement Created",
      description: "Your announcement has been sent to all students.",
    });
  };
  
  // Handle lesson completion
  // Rate-limited lesson completion to prevent spam
  const { executeAction: completeLesson, isOnCooldown: isCompletingLesson } = useRateLimitedAction(
    async () => {
      if (!activeLesson || isLessonCompleted(activeLesson.id)) return;
      
      await handleCompleteLesson(activeLesson.id);
    },
    2000 // 2 second cooldown between lesson completions
  );

  // Rate-limited lesson uncomplete to prevent spam
  const { executeAction: uncompleteLesson, isOnCooldown: isUncompletingLesson } = useRateLimitedAction(
    async () => {
      if (!activeLesson || !isLessonCompleted(activeLesson.id)) return;
      
      await handleUncompleteLesson(activeLesson.id);
    },
    2000 // 2 second cooldown between lesson operations
  );

  const handleCompleteLesson = async (lessonId: number) => {
    if (isLessonCompleted(lessonId)) {
      // Lesson already completed
      return;
    }
    
    try {
      await EnrollmentService.completeLesson(lessonId);
      
      // Update the completed lessons list with new format
      // We'll add a temporary completion object and refresh from server for accurate data
      const tempCompletion = {
        lessonId: lessonId,
        enrollmentId: enrollmentId || 0,
        completedDate: new Date().toISOString()
      };
      setCompletedLessons((prev) => [...prev, tempCompletion]);
      
      // Refresh completed lessons from server to get accurate data
      if (id) {
        try {
          const completed = await EnrollmentService.getCompletedLessons(Number(id));
          setCompletedLessons(Array.isArray(completed) ? completed : []);
        } catch (error) {
          console.error("Error refreshing completed lessons:", error);
        }
      }
      
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

  const handleUncompleteLesson = async (lessonId: number) => {
    if (!isLessonCompleted(lessonId)) {
      // Lesson is not completed
      return;
    }
    
    try {
      await EnrollmentService.uncompleteLesson(lessonId);
      
      // Since backend handles deletion and progress recalculation,
      // we just need to refresh the data from server
      if (id) {
        try {
          // Refresh completed lessons from server
          const completed = await EnrollmentService.getCompletedLessons(Number(id));
          setCompletedLessons(Array.isArray(completed) ? completed : []);
          
          // Refresh progress from server if we have enrollment ID
          if (enrollmentId) {
            const result = await EnrollmentService.recalculateProgress(enrollmentId);
            setCourseProgress(result.progress);
          } else {
            // Fallback: calculate progress locally if no enrollment ID
            if (modules.length > 0) {
              const totalLessons = modules.reduce(
                (total, module) => total + (module.lessons?.length || 0),
                0
              );
              
              if (totalLessons > 0) {
                const progress = Math.round((completed.length / totalLessons) * 100);
                setCourseProgress(Math.max(0, progress));
              }
            }
          }
        } catch (error) {
          console.error("Error refreshing data after uncompleting lesson:", error);
        }
      }
      
      toast({
        title: "Lesson Uncompleted",
        description: "Your progress has been updated!",
      });
    } catch (error) {
      console.error("Error marking lesson as uncompleted:", error);
      toast({
        title: "Error",
        description: "Could not mark lesson as uncompleted. Please try again.",
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
        // Construct the proper video URL using the lesson content
        // Handle different content formats: full URL, relative path, or filename
        let videoUrl = null;
        if (lesson.content) {
          if (lesson.content.startsWith('http')) {
            // Already a full URL - add cache busting parameter
            videoUrl = `${lesson.content}?t=${Date.now()}&lessonId=${lesson.id}`;
          } else {
            // Relative path or filename - construct full API URL
            // Remove leading slash to avoid double slashes
            const contentPath = lesson.content.replace(/^\//, '');
            // Add cache busting and lesson ID to ensure unique requests
            videoUrl = `${API_BASE_URL}/${contentPath}?t=${Date.now()}&lessonId=${lesson.id}`;
          }
        }
          
        return (
          <div className="space-y-6">
            <div className="rounded-lg overflow-hidden border border-border">
              {videoUrl ? (
                <SecureVideoPlayer 
                  src={videoUrl}
                  key={`lesson-video-${lesson.id}`} // Add unique key to force re-render when lesson changes
                  title={lesson.title}
                  allowFullscreen={true}
                  allowQualityChange={true}
                  theme="light"
                />
              ) : (
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                  <div className="text-center p-8">
                    <div className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Video content unavailable</p>
                  </div>
                </div>
              )}
            </div>
            <div className="prose max-w-none">
              <h1>{lesson.title}</h1>
              <p className="whitespace-pre-wrap">{lesson.description || "No description available for this lesson."}</p>
            </div>
          </div>
        );
        
      case 'article':
      case 'text':
      default:
        return (
          <div className="space-y-6">
            {/* Lesson Header with Title and Description */}
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{lesson.title}</h1>
                {lesson.description && (
                  <p className="text-lg text-gray-600 whitespace-pre-wrap">
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Lesson Content */}
            <div className="space-y-4">
              <SimpleLessonViewer
                content={lesson.content || ''}
              />
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{course?.title || "Course"}</h1>
                {isInstructorViewing && (
                  <Badge variant="secondary" className="text-xs">
                    Instructor View
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {!isInstructorViewing && (
                  <>
                    <Progress value={courseProgress} className="w-32 h-2" />
                    <span>{Math.round(courseProgress)}% complete</span>
                  </>
                )}
                {isInstructorViewing && (
                  <span>Viewing course as instructor</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">          {/* Sidebar with Course Curriculum */}          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="space-y-4">
              {/* Course curriculum */}
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
                            const isCompleted = isLessonCompleted(lesson.id);
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
                  ))}                </Accordion>
              </div>
            </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 order-1 lg:order-2 min-w-0 max-w-full overflow-hidden">
            {/* Lesson Content */}
            <div className="mb-8">
              <div className="border rounded-lg p-6">
                {renderLessonContent(activeLesson)}
                  {activeLesson && (
                  <div className="mt-8 space-y-4">
                    {/* Quiz indicator for current lesson - Hidden for instructor view */}
                    {!isInstructorViewing && lessonHasQuizzes(activeLesson.id) && (
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
                        {isLessonCompleted(activeLesson.id) && (
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
                      
                      {!isInstructorViewing && (
                        <Button
                          variant={isLessonCompleted(activeLesson.id) ? "outline" : "default"}
                          onClick={() => isLessonCompleted(activeLesson.id) ? uncompleteLesson() : completeLesson()}
                          disabled={isCompletingLesson || isUncompletingLesson}
                          className={isLessonCompleted(activeLesson.id) ? "border-eduBlue-500 text-eduBlue-500" : ""}
                        >
                          {isLessonCompleted(activeLesson.id) ? (
                            <>
                              Mark as Uncompleted
                            </>
                          ) : (
                            "Mark as Completed"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
              {/* Course Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full overflow-hidden">
              <TabsList className="w-full justify-start border-b rounded-none mb-6 px-0 h-auto">
                <TabsTrigger 
                  value="overview"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
                >
                  <Book className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                {(course?.useAIAssistant || isInstructorViewing) && (
                  <TabsTrigger 
                    value="ai-assistant"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                    {(isProcessingContent || isTranscribing) && (
                      <div className="ml-2 h-2 w-2 bg-cyan-500 rounded-full animate-pulse" />
                    )}
                  </TabsTrigger>
                )}
                {!isInstructorViewing && (
                  <TabsTrigger 
                    value="quizzes"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Quizzes
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="qa"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Q&A
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
                  onClick={handleFetchReviews}
                >
                  <StarIcon className="h-4 w-4 mr-2" />
                  Reviews
                </TabsTrigger>
                {!isInstructorViewing && (
                  <TabsTrigger 
                    value="notifications"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Announcements
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="overview">
                <div className="space-y-8">
                  <CourseDescriptionWithToggle description={course?.description || ""} />
                  
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
                  
                  {course?.requirements && course.requirements.trim() && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Requirements</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{course.requirements}</p>
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
                    <h3 className="text-lg font-semibold mb-4">{isInstructorViewing ? 'Course Overview' : 'Your Progress'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700">Total Lessons</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {isInstructorViewing ? getTotalLessons() : `${completedLessons.length}/${getTotalLessons()}`}
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      
                      {!isInstructorViewing && (
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
                      )}
                      
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-700">{isInstructorViewing ? 'Modules' : 'Overall Progress'}</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {isInstructorViewing ? modules.length : `${Math.round(courseProgress)}%`}
                            </p>
                          </div>
                          <Trophy className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {(course?.useAIAssistant || isInstructorViewing) && (
                <TabsContent value="ai-assistant">
                  <div className="max-w-full overflow-hidden">
                    <div className="w-full max-w-4xl mx-auto">
                      <AIAssistant 
                        key={`ai-assistant-${activeLesson?.id}`}
                        lessonId={activeLesson?.id}
                        lessonTitle={activeLesson?.title}
                        lessonTranscript={lessonTranscript}
                        isLoadingTranscript={isProcessingContent || isTranscribing}
                        lessonType={activeLesson?.contentType}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
              
              {!isInstructorViewing && (
                <TabsContent value="quizzes">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Quizzes</h2>
                    {quizScore && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Last Score: {quizScore.correctAnswers}/{quizScore.totalQuizzes}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {activeLesson ? (
                    <div className="space-y-4">
                      {/* Show info about the current lesson */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-1">
                          Current Lesson: {activeLesson.title}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {lessonHasQuizzes(activeLesson.id) 
                            ? completedLessons.includes(activeLesson.id)
                              ? "Quiz unlocked - you can take the quiz below"
                              : "Complete this lesson to unlock its quiz"
                            : "This lesson doesn't have any quizzes"
                          }
                        </p>
                      </div>

                      {/* Show quiz for the active lesson if it has quizzes and is completed */}
                      {lessonHasQuizzes(activeLesson.id) ? (
                        <Card className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{activeLesson.title} Quiz</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {courseQuizzes.filter(quiz => quiz.lessonId === activeLesson.id).length} quiz{courseQuizzes.filter(quiz => quiz.lessonId === activeLesson.id).length > 1 ? 'es' : ''} available
                                </p>
                              </div>
                              <Badge variant={isLessonCompleted(activeLesson.id) ? "default" : "secondary"}>
                                {isLessonCompleted(activeLesson.id) ? "Unlocked" : "Complete lesson to unlock"}
                              </Badge>
                            </div>
                          </CardHeader>
                          {isLessonCompleted(activeLesson.id) && (
                            <CardContent className="pt-0">
                              <QuizTaking 
                                key={`quiz-${activeLesson.id}`} // Add key to ensure re-render when lesson changes
                                lessonId={activeLesson.id}
                                courseId={Number(id)}
                                onQuizComplete={handleQuizComplete}
                              />
                            </CardContent>
                          )}
                        </Card>
                      ) : (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Quiz for This Lesson</h3>
                          <p className="text-muted-foreground">
                            This lesson doesn't have any quizzes. Select a different lesson that has quizzes to take a quiz.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a Lesson</h3>
                      <p className="text-muted-foreground">
                        Please select a lesson from the sidebar to view its quiz.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              )}
              
              <TabsContent value="qa">
                <div className="max-w-4xl">
                  {activeLesson ? (
                    <QAComponent 
                      lessonId={activeLesson.id}
                      lessonTitle={activeLesson.title}
                      targetQuestionId={qaTargetQuestionId}
                      targetAnswerId={qaTargetAnswerId}
                    />
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a Lesson</h3>
                      <p className="text-muted-foreground">
                        Please select a lesson from the sidebar to view its Q&A section.
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
                      ) : (                        <div className="text-center py-6 border rounded-lg">
                          <p className="text-muted-foreground">No reviews yet. Be the first to review this course!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {!isInstructorViewing && (
                <TabsContent value="notifications">
                  <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Course Announcements</h2>
                    {isInstructorViewing && (
                      <Badge variant="secondary" className="text-xs">
                        Instructor View
                      </Badge>
                    )}
                  </div>
                  
                  {/* Create announcement form for instructors */}
                  {isInstructorViewing && (
                    <div className="mb-6">
                      <CreateNotificationForm
                        courseId={parseInt(id!)}
                        courseName={course?.title || "Course"}
                        variant="card"
                        onNotificationCreated={handleNotificationCreated}
                      />
                    </div>
                  )}
                  
                  {/* Notifications list */}
                  <div className="space-y-4">
                    {notifications
                      .filter(notification => 
                        notification.courseId === parseInt(id!) && 
                        notification.notificationType !== 'NewQuestion' && 
                        notification.notificationType !== 'NewAnswer' &&
                        notification.notificationType !== 'NewLesson'
                      )
                      .map((notification) => {
                        const isTargetNotification = window.location.hash === `#notification-${notification.id}`;
                        
                        return (
                          <Card 
                            key={notification.id} 
                            id={`notification-${notification.id}`}
                            className={`transition-all duration-300 cursor-pointer hover:shadow-md ${
                              isTargetNotification 
                                ? 'ring-2 ring-eduBlue-500 bg-eduBlue-50' 
                                : notification.isRead 
                                  ? 'opacity-70' 
                                  : 'border-blue-200 bg-blue-50/30'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="text-2xl">
                                    {notification.notificationType === 'announcement' ? '📢' :
                                     notification.notificationType === 'assignment' ? '📝' :
                                     notification.notificationType === 'reminder' ? '⏰' :
                                     notification.notificationType === 'update' ? '🔄' :
                                     notification.notificationType === 'deadline' ? '📅' :
                                     notification.notificationType === 'NewQuestion' ? '❓' :
                                     notification.notificationType === 'NewAnswer' ? '💬' : '📬'}
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">
                                      {notification.title}
                                    </CardTitle>                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <div className="flex items-center gap-1">
                                        {notification.creatorImage && (
                                          <img 
                                            src={getImageUrl(notification.creatorImage)} 
                                            alt={notification.createdByName}
                                            className="w-6 h-6 rounded-full object-cover"
                                          />
                                        )}
                                        <span>{notification.createdByName}</span>
                                      </div>
                                      <span>•</span>
                                      <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                      <span>•</span>
                                      <span>{notification.courseName}</span>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs">
                                        {notification.notificationType}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!notification.isRead && (
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                  )}
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                {notification.message}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    
                    {notifications.filter(n => 
                      n.courseId === parseInt(id!) && 
                      n.notificationType !== 'NewQuestion' && 
                      n.notificationType !== 'NewAnswer' &&
                      n.notificationType !== 'NewLesson'
                    ).length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          No announcements yet
                        </h3>
                        <p className="text-muted-foreground">
                          {isInstructorViewing 
                            ? "Create your first announcement to communicate with your students." 
                            : "Your instructor hasn't posted any announcements for this course yet."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}