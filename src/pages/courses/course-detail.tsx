import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarIcon, Play, Clock, User, Book, Video, CheckCircle, Edit, Trash2, Heart, BookOpen } from "lucide-react";
import { CourseService } from "@/services/course-service";
import { WishlistService } from "@/services/wishlist-service";
import { PaymentService } from "@/services/payment-service";
import { PaymentMethodDialog } from "@/components/ui/payment-method-dialog";
import { NotificationSubscriptionToggle } from "@/components/notifications/notification-subscription-toggle";
import { RichTextCourseDescription } from "@/components/courses/rich-text-course-description";
import { SimpleCourseDescription } from "@/components/courses/simple-course-description";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CourseReview } from "@/types/api";
import { getImageUrl, DIRECT_API_URL } from "@/config/api-config";
import { getInitials } from "@/lib/utils";
import { CourseStructuredData } from "@/components/seo/course-structured-data";
import { SEO } from "@/components/seo/seo";



// Define the review form schema
const reviewFormSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  reviewContent: z.string().min(3, "Review content is required").max(1000, "Review cannot exceed 1000 characters"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<CourseReview | null>(null);  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<CourseReview | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  
  // Payment related state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Form handling for reviews
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,  // We'll validate this before submission
      reviewContent: "",
    },
  });

  // Open the review modal and set up the form for adding or editing a review
  const handleOpenReviewModal = (review: CourseReview | null = null) => {
    setCurrentReview(review);
    setSelectedRating(review ? review.rating : 0);
    
    form.reset({
      rating: review ? review.rating : 0,
      reviewContent: review ? review.reviewContent : "",
    });
    
    setReviewModalOpen(true);
  };

  // Handle submitting a review (add or update)
  const onSubmitReview = async (values: ReviewFormValues) => {
    if (!id || !isAuthenticated || !isEnrolled) {
      toast({
        title: "Error",
        description: "You must be enrolled in this course to leave a review.",
        variant: "destructive",
      });
      return;
    }
    
    // Extra validation to ensure rating is set
    if (!values.rating || values.rating < 1) {
      form.setError("rating", { 
        type: "manual",
        message: "Please select a rating before submitting"
      });
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {      
      // Format request with PascalCase property names as required by the API
      const courseId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      if (currentReview) {
        // Update existing review
        const response = await CourseService.updateCourseReview(
          currentReview.id,
          values.rating,
          values.reviewContent
        );
        
        if (response) {
          toast({
            title: "Review Updated",
            description: "Your review has been updated successfully.",
          });
          
          // Close the modal and refresh the page
          setReviewModalOpen(false);
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay reload by 1 second to show the toast message
        }
      } else {
        // Add new review using CourseService
        const response = await CourseService.addCourseReview(
          courseId,
          values.rating,
          values.reviewContent
        );
        
        if (response) {
          toast({
            title: "Review Added",
            description: "Your review has been added successfully.",
          });
          
          // Close the modal and refresh the page
          setReviewModalOpen(false);
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay reload by 1 second to show the toast message
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit your review (You may already submit a review to this course), Please try again.",
        variant: "destructive",
      });
      setReviewModalOpen(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Check if the current user has already reviewed this course
  const findUserReview = () => {
    if (!isAuthenticated || !user || !reviews.length) return null;
    
    const userReview = reviews.find(review => review.userId === user.id);
    if (userReview) {
      setUserReview(userReview);
      return userReview;
    }
    return null;
  };
  
  // Update userReview whenever reviews change
  useEffect(() => {
    if (reviews.length > 0 && isAuthenticated && user) {
      findUserReview();
    }
  }, [reviews, isAuthenticated, user]);

  // Handle deleting a review
  const handleDeleteReview = async (reviewId: number) => {
    if (!isAuthenticated) return;
    
    try {
      await CourseService.deleteCourseReview(reviewId);
      
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted successfully.",
      });
      
      // Refresh the page after a short delay to show the toast message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete your review. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle toggling wishlist
  const handleToggleWishlist = () => {
    if (!course) return;
    
    const success = WishlistService.toggleWishlist(course);
    if (success) {
      // Update local state to reflect the change
      setIsInWishlist(!isInWishlist);
    }
  };  // Backend base URL for serving static content
  const API_BASE_URL = DIRECT_API_URL;
  
  useEffect(() => {
    if (!id) return;
    
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        // Fetch course data first (most important)
        const courseData = await CourseService.getCourseById(id);
        setCourse(courseData);
        
        // Check if course is in wishlist
        if (courseData) {
          const inWishlist = WishlistService.isInWishlist(courseData.id);
          setIsInWishlist(inWishlist);
        }
        
        // Fetch all other data in parallel for better performance
        const [modulesData, enrollmentCountData, reviewsCountData, enrollmentStatus, reviewsData] = await Promise.allSettled([
          // Get modules and lessons
          CourseService.getModules(id).then(async (modules) => {
            if (!modules) return [];
            const modulesArray = Array.isArray(modules) ? modules : [];
            return Promise.all(modulesArray.map(async (module) => {
              try {
                const lessons = await CourseService.getLessons(id, module.id);
                return {
                  ...module,
                  lessons: Array.isArray(lessons) ? lessons : []
                };
              } catch (error) {
                return { ...module, lessons: [] };
              }
            }));
          }),
          
          // Get enrollment count
          CourseService.getEnrollmentCount(id),
          
          // Get reviews count
          CourseService.getCourseReviewsWithCount(id),
          
          // Check enrollment status (only if authenticated)
          isAuthenticated ? CourseService.isEnrolled(id) : Promise.resolve(false),
          
          // Get reviews data for faster loading
          CourseService.getCourseReviews(id)
        ]);
        
        // Handle modules
        if (modulesData.status === 'fulfilled') {
          setModules(modulesData.value);
        } else {
          setModules([]);
        }
        
        // Handle enrollment count
        if (enrollmentCountData.status === 'fulfilled') {
          setEnrollmentCount(enrollmentCountData.value);
        }
        
        // Handle reviews count
        if (reviewsCountData.status === 'fulfilled') {
          setReviewCount(reviewsCountData.value || 0);
        }
        
        // Handle enrollment status
        if (enrollmentStatus.status === 'fulfilled') {
          setIsEnrolled(!!enrollmentStatus.value);
        }
        
        // Handle reviews data
        if (reviewsData.status === 'fulfilled') {
          setReviews(Array.isArray(reviewsData.value) ? reviewsData.value : []);
        }
        
      } catch (error) {
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
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `/auth/login?redirect=/courses/${id}`;
      return;
    }
    
    if (!courseData) return;

    // If course is free, enroll directly
    if (courseData.price === 0) {
      setIsEnrolling(true);
      try {
        await CourseService.freeEnroll(id!);
        setIsEnrolled(true);
        toast({
          title: "Success!",
          description: "You have successfully enrolled in this course for free.",
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
    } else {
      // If course is paid, open payment method dialog
      setPaymentDialogOpen(true);
    }
  };

  const handlePaymentMethodSelected = async (paymentMethod: 'card' | 'wallet') => {
    if (!courseData || !id) return;

    setIsProcessingPayment(true);
    try {
      // Create payment token
      const response = await PaymentService.createPaymentToken({
        courseId: Number(id),
        paymentMethod
      });

      // Open payment window
      const paymentWindow = PaymentService.openPaymentWindow(response.redirectUrl);
      
      if (!paymentWindow) {
        toast({
          title: "Payment Error",
          description: "Failed to open payment window. Please check your popup blocker settings.",
          variant: "destructive",
        });
        return;
      }

      // Close the payment method dialog
      setPaymentDialogOpen(false);

      // Monitor the payment window
      const checkPaymentWindow = setInterval(() => {
        if (paymentWindow.closed) {
          clearInterval(checkPaymentWindow);
          // Payment window was closed, refresh enrollment status
          checkEnrollmentStatus();
        }
      }, 1000);

      toast({
        title: "Payment Window Opened",
        description: "Complete your payment in the new window to finish enrollment.",
      });    } catch (error) {
      console.error("Error creating payment token:", error);
      
      // Enhanced error handling
      let errorMessage = "Failed to initiate payment. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("400")) {
          errorMessage = "Invalid payment request. Please check your course selection and try again.";
        } else if (error.message.includes("401")) {
          errorMessage = "Please log in to complete your payment.";
        } else if (error.message.includes("403")) {
          errorMessage = "You don't have permission to enroll in this course.";
        } else if (error.message.includes("404")) {
          errorMessage = "Course not found. Please try again later.";
        } else if (error.message.includes("500")) {
          errorMessage = "Payment service is temporarily unavailable. Please try again later.";
        }
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to check enrollment status after payment
  const checkEnrollmentStatus = async () => {
    if (!id) return;
    
    try {
      const enrolled = await CourseService.isEnrolled(id);
      if (enrolled) {
        setIsEnrolled(true);
        toast({
          title: "Payment Successful!",
          description: "You have successfully enrolled in this course.",
        });
      }
    } catch (error) {
      console.error("Error checking enrollment status:", error);
    }
  };

  // Helper function to calculate total duration
  const calculateTotalDuration = () => {
    if (!modules || modules.length === 0) return "0h 0m";
    
    let totalMinutes = 0;
    
    modules?.forEach(module => {
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

  // Format the thumbnail URL properly
  const formatThumbnailUrl = (thumbnail: string | undefined): string => {
    if (!thumbnail) return "/placeholder.svg";
    
    // If it's already a full URL, use it as is
    if (thumbnail.startsWith('http')) return thumbnail;
    
    // Otherwise, prefix with API base URL and ensure no double slashes
    return `${API_BASE_URL}/${thumbnail.replace(/^\//, '')}`;
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

  // Add a function to check if user is an admin
  const isAdmin = () => {
    return user?.userType === "Admin";
  };

  // Add a function to check if user is an instructor
  const isInstructor = () => {
    return user?.userType === "Instructor";
  };

  // Add a function to check if user owns the course
  const isInstructorCourse = () => {
    return user?.userType === "Instructor" && user?.id === courseData.instructorId;
  };

  // Add a function to check if user can enroll
  const canEnroll = () => {
    return user?.userType === "Student" && !isInstructorCourse();
  };

  return (
    <MainLayout>
      <SEO
        title={`${courseData.title} - ElCentre | Online Course`}
        description={courseData.description}
        keywords={`${courseData.title}, ${courseData.categoryName || courseData.category}, online course, ${courseData.instructorName}, learning, education`}
        url={`https://elcentre-learn.vercel.app/courses/${id}`}
        image={getImageUrl(courseData.thumbnail)}
      />
      
      <CourseStructuredData 
        course={courseData} 
        url={`https://elcentre-learn.vercel.app/courses/${id}`}
      />

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
                  <span>{courseData.rating || 0} ({reviewCount || 0} reviews)</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{courseData.title}</h1>
              <div className="flex items-center mb-6">
                <Link to={`/instructors/${courseData.instructorId || courseData.instructor?.id}/courses`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={(courseData.instructorImage) ? getImageUrl(courseData.instructorImage) : ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials(courseData.instructorName || courseData.instructor?.name || 'Unknown')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium hover:text-primary transition-colors">Created by {courseData.instructorName || courseData.instructor?.name || "Unknown Instructor"}</p>
                    <p className="text-sm text-muted-foreground">Created at: {courseData.createdAt ? new Date(courseData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</p>
                  </div>
                </Link>
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
                  <span>{enrollmentCount?.toLocaleString() || courseData.studentsCount?.toLocaleString() || 0} students</span>
                </div>
              </div>
                <div className="hidden md:block">
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button asChild className="bg-eduBlue-500 hover:bg-eduBlue-600">
                        <Link to={`/my-courses/${courseData.id}/learn`}>
                          Continue Learning
                        </Link>
                      </Button>
                      {/* Don't show wishlist button if enrolled */}
                    </div>
                    
                    {/* Notification subscription toggle for enrolled students */}
                    {user?.userType === "Student" && (
                      <NotificationSubscriptionToggle
                        courseId={parseInt(id!)}
                        courseName={courseData.title}
                        variant="card"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {isInstructorCourse() ? (
                      <div className="flex gap-2">
                        <Button 
                          asChild
                          className="bg-eduBlue-500 hover:bg-eduBlue-600"
                        >
                          <Link to={`/dashboard/instructor/courses/${courseData.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course Info
                          </Link>
                        </Button>
                        <Button 
                          asChild
                          variant="secondary"
                        >
                          <Link to={`/dashboard/instructor/courses/${courseData.id}/content`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Manage Content
                          </Link>
                        </Button>
                      </div>
                    ) : (                      <Button 
                        onClick={handleEnroll} 
                        disabled={isEnrolling || !canEnroll()} 
                        className="bg-eduBlue-500 hover:bg-eduBlue-600"
                        title={!canEnroll() ? "Only students can enroll in courses" : ""}
                      >
                        {isEnrolling ? "Enrolling..." : 
                         !canEnroll() ? "Students Only" :
                         courseData.price === 0 ? "Enroll for Free" : 
                         `Enroll Now - ${courseData.price} EGP`}
                      </Button>
                    )}
                    {!isInstructor() && !isAdmin() && (
                      <Button 
                        variant="outline" 
                        onClick={handleToggleWishlist}
                        className={isInWishlist ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100" : ""}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
                        {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:w-96">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={getImageUrl(courseData.thumbnail)} 
                    alt={courseData.title} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Price Badge - Top Right */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      {courseData.price === 0 ? "Free" : `${courseData.price} EGP`}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Header Section */}
                  <div className="mb-3">
                    <div className="text-2xl font-bold mb-2">
                      {courseData.price === 0 ? (
                        <span className="text-blue-600">Free Course</span>
                      ) : (
                        <span>{courseData.price} EGP</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Course Stats Section */}
                  <div className="mb-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Course Length</p>
                          <p className="text-xs text-gray-500">{calculateTotalDuration()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Total Lessons</p>
                          <p className="text-xs text-gray-500">{getTotalLessons()} lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Students Enrolled</p>
                          <p className="text-xs text-gray-500">{enrollmentCount?.toLocaleString() || courseData.studentsCount?.toLocaleString() || 0} students</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Section */}
                  <div className="md:hidden mb-4">
                    {isEnrolled ? (
                      <div className="flex flex-col gap-3">
                        <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                          <Link to={`/my-courses/${courseData.id}/learn`}>
                            Continue Learning
                          </Link>
                        </Button>
                        
                        {/* Notification subscription toggle for enrolled students */}
                        {user?.userType === "Student" && (
                          <NotificationSubscriptionToggle
                            courseId={parseInt(id!)}
                            courseName={courseData.title}
                            variant="card"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {isInstructorCourse() ? (
                          <div className="flex flex-col gap-2">
                            <Button 
                              asChild
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                            >
                              <Link to={`/dashboard/instructor/courses/${courseData.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Course Info
                              </Link>
                            </Button>
                            <Button 
                              asChild
                              variant="outline"
                              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Link to={`/dashboard/instructor/courses/${courseData.id}/content`}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Manage Content
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={handleEnroll} 
                            disabled={isEnrolling || !canEnroll()} 
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                            title={!canEnroll() ? "Only students can enroll in courses" : ""}
                          >
                            {isEnrolling ? "Enrolling..." : 
                             !canEnroll() ? "Students Only" :
                             courseData.price === 0 ? "Enroll for Free" : 
                             `Enroll Now - ${courseData.price} EGP`}
                          </Button>
                        )}
                        {!isInstructor() && (
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={handleToggleWishlist}
                          >
                            <Heart className={`h-4 w-4 mr-2 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
                            {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
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
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
            >
              Curriculum
            </TabsTrigger>
            <TabsTrigger 
              value="overview"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 h-10 font-medium transition-all duration-200"
              onClick={handleFetchReviews}
            >
              Reviews ({reviewCount} reviews)
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
                  {modules.map((module, moduleIndex) => (                    <AccordionItem key={module.id} value={module.id.toString()}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between text-left w-full">
                          <div className="flex items-center">
                            <span className="mr-2 font-bold">{moduleIndex + 1}.</span>
                            <span className="font-medium">{module.title}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{module.lessons?.length || 0} lessons</span>
                          </div>
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
              <SimpleCourseDescription description={courseData.description || ""} />
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                {courseData.requirements && courseData.requirements.trim() ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{courseData.requirements}</p>
                ) : (
                  <p className="text-muted-foreground">No specific requirements for this course.</p>
                )}
              </div>
            </div>
          </TabsContent>
            {/* <TabsContent value="instructor">
            <div className="max-w-3xl">
              {courseData.instructor ? (
                <>                  <div className="flex items-start gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={(courseData.instructorImage) ? getImageUrl(courseData.instructorImage) : ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">{getInitials(courseData.instructorName || courseData.instructor?.name || 'Unknown')}</AvatarFallback>
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
          </TabsContent> */}
          
          <TabsContent value="reviews">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Student Reviews</h2>
                {isAuthenticated && isEnrolled && !userReview && (
                  <Button className="bg-eduBlue-500 hover:bg-eduBlue-600" onClick={() => handleOpenReviewModal(null)}>Write a Review</Button>
                )}
              </div>
              
              <div className="flex items-center mb-8">
                <div className="text-center mr-8">
                  <p className="text-5xl font-bold">{courseData.rating || 0}</p>
                  <div className="flex items-center justify-center my-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={`course-rating-star-${i}`}
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
              
              {isLoadingReviews ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eduBlue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">                        <div className="flex items-start">                          <Avatar className="h-10 w-10 mr-3">
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
                            </div>
                            <p className="text-muted-foreground mt-2">{review.reviewContent}</p>
                            {user && (review.userId === user.id || review.studentId === user.id) && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenReviewModal(review)} className="bg-eduBlue-500 hover:bg-eduBlue-600 text-white">
                                  <Edit className="text-white h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.id)}>
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </div>
                            )}
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

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentReview ? "Edit Review" : "Write a Review"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitReview)}>
              <FormField
                name="rating"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (required)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={`rating-input-star-${i}`}
                            className={`h-6 w-6 cursor-pointer ${
                              i < field.value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                            onClick={() => {
                              field.onChange(i + 1);
                            }}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="reviewContent"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Write your review here..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>        </Form>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentMethods={PaymentService.getPaymentMethods()}
        onPaymentMethodSelected={handlePaymentMethodSelected}
        isLoading={isProcessingPayment}
        courseTitle={courseData?.title}
        coursePrice={courseData?.price}
      />
    </MainLayout>
  );
}
