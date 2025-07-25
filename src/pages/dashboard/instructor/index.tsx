import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Icons from lucide-react
import { 
  BookOpen, 
  Users, 
  Layers,
  LightbulbIcon,
  BadgeCheck,
  Pencil,
  TrendingUp
} from "lucide-react";
import { CourseService } from "@/services/course-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { getImageUrl } from "@/config/api-config";

// Teaching tips for instructors
const instructorTips = [
  "Engage with students by responding to questions promptly.",
  "Use real-world examples to make complex concepts easier to understand.",
  "Break down difficult topics into smaller, digestible segments.",
  "Regularly update your course content to keep it relevant.",
  "Ask for student feedback and use it to improve your teaching.",
  "Create interactive elements that encourage active learning.",
  "Include diverse teaching methods to accommodate different learning styles.",
  "Set clear learning objectives at the start of each module.",
  "Add quizzes and assessments to help students measure their progress.",
  "Make your content accessible to all learners."
];

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [greeting, setGreeting] = useState<string>("");
  const [tip, setTip] = useState<string>("");
  
  // Separate queries for better performance - load basic course data first
  const { 
    data: basicCourses = [], 
    isLoading: coursesLoading, 
    error: coursesError
  } = useQuery({
    queryKey: ['instructorCourses', 'basic'],
    queryFn: () => CourseService.getInstructorCourses(),
    enabled: isAuthenticated && user?.userType === "Instructor" && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Load enrollment stats separately and in background
  const { 
    data: enrollmentStats = {}, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['instructorEnrollmentStats', basicCourses.map(c => c.id)],
    queryFn: async () => {
      if (!basicCourses.length) return {};
      
      const stats = {};
      
      // Process courses in smaller batches for better performance
      const batchSize = 2;
      for (let i = 0; i < basicCourses.length; i += batchSize) {
        const batch = basicCourses.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (course) => {
          try {
            const enrollments = await EnrollmentService.getCourseEnrollments(course.id);
            return {
              courseId: course.id,
              studentsCount: EnrollmentService.calculateStudentCount(enrollments),
              completionRate: EnrollmentService.calculateCourseCompletionRate(enrollments),
              enrollments: enrollments
            };
          } catch (error) {
            return {
              courseId: course.id,
              studentsCount: 0,
              completionRate: 0,
              enrollments: []
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          stats[result.courseId] = result;
        });
        
        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < basicCourses.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return stats;
    },
    enabled: basicCourses.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Memoize expensive calculations
  const dashboardData = useMemo(() => {
    const coursesArray = Array.isArray(basicCourses) ? basicCourses : [];
    
    // Combine course data with enrollment stats
    const coursesWithStats = coursesArray.map(course => ({
      ...course,
      studentsCount: enrollmentStats[course.id]?.studentsCount || 0,
      completionRate: enrollmentStats[course.id]?.completionRate || 0,
      enrollments: enrollmentStats[course.id]?.enrollments || []
    }));
    
    const totalStudents = coursesWithStats.reduce((acc, course) => acc + course.studentsCount, 0);
    
    const coursesEnrollmentData = coursesWithStats.map(course => ({
      courseId: course.id,
      enrollments: course.enrollments
    }));
    
    const averageCompletionRate = coursesEnrollmentData.length > 0
      ? EnrollmentService.calculateAverageCompletionRate(coursesEnrollmentData)
      : 0;

    return {
      courses: coursesWithStats,
      totalStudents,
      averageCompletionRate: Math.floor(averageCompletionRate),
      publishedCount: coursesWithStats.filter(c => c.isActive).length,
      draftCount: coursesWithStats.length - coursesWithStats.filter(c => c.isActive).length
    };
  }, [basicCourses, enrollmentStats]);

  // Memoize thumbnail URL formatting
  const formatThumbnailUrl = useMemo(() => {
    return (thumbnail: string | undefined): string => getImageUrl(thumbnail);
  }, []);
  
  // Set greeting and tip - memoized to prevent unnecessary recalculations
  const greetingAndTip = useMemo(() => {
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
    
    const randomIndex = Math.floor(Math.random() * instructorTips.length);
    
    return {
      greeting: greetingText,
      tip: instructorTips[randomIndex]
    };
  }, [user]);

  // Update state only when memoized values change
  useEffect(() => {
    setGreeting(greetingAndTip.greeting);
    setTip(greetingAndTip.tip);
  }, [greetingAndTip]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== "Instructor")) {
      navigate("/login?redirect=/dashboard/instructor", { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Handle query errors
  useEffect(() => {
    if (coursesError) {
      toast({
        title: "Error",
        description: "Failed to load your courses. Please try again.",
        variant: "destructive",
      });
    }
  }, [coursesError]);

  const isLoading = coursesLoading;
  const isStatsLoading = statsLoading && !coursesLoading;

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header Section with Greeting and Tip */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{greeting}</h1>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center bg-amber-50 p-4 rounded-lg border border-amber-100">
            <LightbulbIcon className="h-6 w-6 mr-3 text-amber-500" />
            <p className="text-amber-700 italic">Instructor Tip: {tip}</p>
          </div>
        </div>

        {authLoading || isLoading ? (
          <div className="space-y-8">
            {/* Skeleton loaders for dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 bg-card">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg overflow-hidden bg-card">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview Cards - Show basic data immediately, update with stats when available */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Total Courses</h3>
                    <div className="flex items-center">
                      <Layers className="h-5 w-5 mr-2 text-blue-500" />
                      <div className="text-3xl font-bold text-gray-900">{dashboardData.courses.length}</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                  {dashboardData.publishedCount} published, {dashboardData.draftCount} drafts
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Total Students</h3>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-500" />
                      <div className="text-3xl font-bold text-gray-900">
                        {isStatsLoading ? (
                          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          dashboardData.totalStudents
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                  Across all your courses
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Avg. Completion Rate</h3>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                      <div className="text-3xl font-bold text-gray-900">
                        {isStatsLoading ? (
                          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          `${dashboardData.averageCompletionRate}%`
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                  Student course completion
                </p>
              </div>
            </div>
            
            {dashboardData.courses.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-medium mt-4 mb-2">You haven't created any courses yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start creating your first course and share your knowledge with students.
                </p>
                <Button asChild>
                  <Link to="/dashboard/instructor/courses/new">Create Your First Course</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Your Courses Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center">
                      <BookOpen className="mr-2" />
                      Your Courses
                    </h2>
                    <Button asChild variant="outline">
                      <Link to="/instructor/courses">View All Courses</Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.courses.slice(0, 3).map((course) => (
                      <div key={course.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        {/* Thumbnail Section */}
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={formatThumbnailUrl(course.thumbnail)}
                            alt={course.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge 
                              variant={course.isActive ? "default" : "secondary"}
                              className={course.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}
                            >
                              {course.isActive ? (
                                <>
                                  <div className="h-1.5 w-1.5 rounded-full bg-white mr-1.5" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <div className="h-1.5 w-1.5 rounded-full bg-white mr-1.5" />
                                  Draft
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          {/* Approval Status Badge - Top Right */}
                          <div className="absolute top-3 right-3">
                            {course.courseStatus ? (
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                course.courseStatus === "Approved" ? "bg-green-500 text-white" :
                                course.courseStatus === "Pending" ? "bg-green-500 text-white" :
                                "bg-green-500 text-white"
                              }`}>
                                {course.courseStatus === "Approved" && "✓ Approved"}
                                {course.courseStatus === "Pending" && "⏳ Pending"}
                                {course.courseStatus === "Rejected" && "✗ Rejected"}
                                {!["Approved", "Pending", "Rejected"].includes(course.courseStatus) && course.courseStatus}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="flex flex-col flex-1 p-4">
                          {/* Header Section */}
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
                              {course.title}
                            </h3>
                            
                            {/* Course Info */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-xs text-gray-500">
                                {course.categoryName && `${course.categoryName} • `}
                                {course.durationInHours} hours
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="flex-1 mb-3">
                            <div 
                              className="text-sm text-gray-500 line-clamp-2 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: course.description || "No description available" }}
                            />
                          </div>

                          {/* Stats Section */}
                          <div className="mb-3 grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Students</span>
                              {isStatsLoading ? (
                                <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>
                              ) : (
                                <span className="font-medium text-gray-900">{course.studentsCount}</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 mb-1">Completion</span>
                              <div className="flex items-center">
                                {isStatsLoading ? (
                                  <>
                                    <div className="h-5 w-8 mr-2 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-1.5 flex-1 bg-gray-200 rounded animate-pulse"></div>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium mr-2 text-gray-900 text-xs">{course.completionRate}%</span>
                                    <Progress value={course.completionRate} className="h-1.5 flex-1" />
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Section */}
                          <div className="flex items-center justify-between mb-3 py-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-gray-500">
                              <BookOpen className="h-4 w-4" />
                              <span className="text-sm">Your Course</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-600">
                              <TrendingUp className="h-4 w-4" />
                              <span className="text-sm font-medium">Active</span>
                            </div>
                          </div>

                          {/* Footer Section */}
                          <div className="flex items-center justify-center">
                            <Button 
                              className="w-full font-medium py-2 px-4 rounded-md transition-colors duration-200" 
                              asChild
                              variant="default"
                            >
                              <Link to={`/dashboard/instructor/courses/${course.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Course
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
  
                {/* Quick Actions */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg hover:scale-105">
                      <Link to="/dashboard/instructor/courses/new" className="block p-6">
                        <div className="flex items-center h-full">
                          <div className="bg-blue-50 rounded-full p-3 mr-4">
                            <BookOpen className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Create New Course</h3>
                            <p className="text-sm text-gray-500">Add new content to your teaching portfolio</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg hover:scale-105">
                      <Link to="/instructor/courses" className="block p-6">
                        <div className="flex items-center h-full">
                          <div className="bg-blue-50 rounded-full p-3 mr-4">
                            <Users className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Manage Courses</h3>
                            <p className="text-sm text-gray-500">Update and organize your existing courses</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}