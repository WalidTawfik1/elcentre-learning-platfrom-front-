import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Book, Lock, ShoppingCart } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { LessonService } from "@/services/lesson-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";
import { SecureVideoPlayer } from "@/components/ui/secure-video-player";
import { SimpleLessonViewer } from "@/components/lessons/simple-lesson-viewer";
import { RichTextLessonViewer } from "@/components/lessons/rich-text-lesson-viewer";
import { SEO } from "@/components/seo/seo";

export default function PreviewLesson() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!courseId || !lessonId) {
      navigate('/courses');
      return;
    }

    const fetchPreviewData = async () => {
      setIsLoading(true);
      try {
        // Fetch course data
        const courseData = await CourseService.getCourseById(courseId);
        setCourse(courseData);

        // Check enrollment status if authenticated
        if (isAuthenticated) {
          const enrolled = await CourseService.isEnrolled(courseId);
          setIsEnrolled(enrolled);
          
          // If user is enrolled, redirect to the regular learning page
          if (enrolled) {
            navigate(`/my-courses/${courseId}/learn`);
            return;
          }
        }

        // Fetch lesson data
        const lessonData = await LessonService.getLessonById(lessonId);
        
        // Check if lesson is actually available for preview
        if (!lessonData || !lessonData.isPreview) {
          toast({
            title: "Access Denied",
            description: "This lesson is not available for preview. Please enroll in the course to access it.",
            variant: "destructive",
          });
          navigate(`/courses/${courseId}`);
          return;
        }

        setLesson(lessonData);
      } catch (error) {
        console.error("Error fetching preview data:", error);
        toast({
          title: "Error",
          description: "Failed to load lesson preview. Please try again.",
          variant: "destructive",
        });
        navigate(`/courses/${courseId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [courseId, lessonId, isAuthenticated, navigate]);

  const handleEnrollNow = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      window.location.href = `/auth/login?redirect=/courses/${courseId}`;
      return;
    }
    
    // Navigate to course detail page for enrollment
    navigate(`/courses/${courseId}`);
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

  if (!course || !lesson) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Preview Not Available</h1>
            <p className="text-muted-foreground mb-6">
              This lesson preview could not be loaded.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={`${lesson.title} - Free Preview | ${course.title} - ElCentre`}
        description={`Free preview of ${lesson.title} from ${course.title}. Get a taste of what you'll learn in this course.`}
        keywords={`${course.title}, ${lesson.title}, free preview, online course, learning, education`}
        url={`https://elcentre-learn.vercel.app/courses/${courseId}/preview/${lessonId}`}
        image={getImageUrl(course.thumbnail)}
      />

      {/* Preview Header */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="container py-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Play className="h-3 w-3 mr-1" />
              Free Preview
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to={`/courses/${courseId}`} 
              className="text-eduBlue-500 hover:text-eduBlue-600 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
            <div className="text-sm text-muted-foreground">
              Preview from: <span className="font-medium">{course.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  {lesson.contentType === "video" ? (
                    <Play className="h-4 w-4 mr-1" />
                  ) : (
                    <Book className="h-4 w-4 mr-1" />
                  )}
                  <span>{lesson.contentType === "video" ? "Video" : "Article"}</span>
                </div>
                <span>•</span>
                <span>{lesson.durationInMinutes} minutes</span>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="mb-8">
              {lesson.contentType === "video" ? (
                <div className="aspect-video mb-6">
                  <SecureVideoPlayer
                    src={`${process.env.REACT_APP_API_URL || 'https://elcentrelearningplatform-api.azurewebsites.net/api'}/${lesson.content}`}
                    title={lesson.title}
                    className="w-full h-full rounded-lg"
                  />
                </div>
              ) : (
                <div className="prose max-w-none">
                  {lesson.content?.includes('<') ? (
                    <RichTextLessonViewer 
                      title={lesson.title} 
                      content={lesson.content} 
                      description={lesson.description}
                    />
                  ) : (
                    <SimpleLessonViewer content={lesson.content} />
                  )}
                </div>
              )}
            </div>

            {/* Preview Limitation Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-2">
                      This is a Free Preview
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      You're viewing a preview of this lesson to help you decide if this course is right for you. 
                      To access all lessons, quizzes, and course features, you'll need to enroll in the course.
                    </p>
                    <Button 
                      onClick={handleEnrollNow}
                      className="bg-eduBlue-500 hover:bg-eduBlue-600"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {course.price === 0 ? "Enroll for Free" : `Enroll Now - ${course.price} EGP`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <img 
                    src={getImageUrl(course.thumbnail)} 
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-medium mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Course Price:</span>
                    <span className="text-lg font-bold text-eduBlue-600">
                      {course.price === 0 ? "Free" : `${course.price} EGP`}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={handleEnrollNow}
                    className="w-full bg-eduBlue-500 hover:bg-eduBlue-600"
                  >
                    {course.price === 0 ? "Enroll for Free" : "Enroll Now"}
                  </Button>
                  
                  <div className="text-center mt-3">
                    <Link 
                      to={`/courses/${courseId}`}
                      className="text-sm text-eduBlue-500 hover:text-eduBlue-600"
                    >
                      View Full Course Details
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Features */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">What You'll Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Full access to all lessons</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Book className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Downloadable resources</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Course completion certificate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Lifetime access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
