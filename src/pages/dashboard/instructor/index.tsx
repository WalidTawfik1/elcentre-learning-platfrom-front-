import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Layers,
  LightbulbIcon,
  BadgeCheck,
  Pencil
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
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();  const [courses, setCourses] = useState<any[]>([]);
  const [greeting, setGreeting] = useState<string>("");
  const [tip, setTip] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Set greeting based on time of day
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
    
    // Set a random instructor tip
    const randomIndex = Math.floor(Math.random() * instructorTips.length);
    setTip(instructorTips[randomIndex]);
  }, [user]);

  // Fetch instructor courses
  useEffect(() => {
    // Only fetch data if user is authenticated and is an instructor
    if (!authLoading && (!isAuthenticated || user?.userType !== "Instructor")) {
      navigate("/login?redirect=/dashboard/instructor", { replace: true });
      return;
    }
    
    if (isAuthenticated && user?.userType === "Instructor") {
      const fetchInstructorCourses = async () => {
        setIsLoading(true);
        try {
          // Use the CourseService instead of direct fetch
          const coursesData = await CourseService.getInstructorCourses();
          
          // Add enrollment counts and calculate stats
          const coursesWithStats = await Promise.all(            coursesData.map(async (course: any) => {
              try {
                // Get enrollment count
                const enrollmentCount = await CourseService.getEnrollmentCount(course.id);
                
                // Get actual completion rate from enrollment data
                const completionRate = await CourseService.getCourseCompletionRate(course.id);
                
                return {
                  ...course,
                  studentsCount: enrollmentCount,
                  completionRate: completionRate
                };
              } catch (error) {
                console.error(`Error fetching stats for course ${course.id}:`, error);
                return {
                  ...course,
                  studentsCount: 0,
                  completionRate: 0 // Default to 0 if there's an error
                };
              }
            })
          );          setCourses(Array.isArray(coursesWithStats) ? coursesWithStats : []);
        } catch (error) {
          console.error("Error fetching instructor courses:", error);
          toast({
            title: "Error",
            description: "Failed to load your courses. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchInstructorCourses();
    }  }, [isAuthenticated, user, navigate, authLoading]);
  
  // Format the thumbnail URL properly using getImageUrl function
  const formatThumbnailUrl = (thumbnail: string | undefined): string => {
    return getImageUrl(thumbnail);
  };

  // Calculate total students across all courses
  const totalStudents = courses.reduce((acc, course) => acc + (course.studentsCount || 0), 0);
    // Calculate overall completion rate
  const averageCompletionRate = courses.length > 0
    ? Math.floor(courses.reduce((acc, course) => acc + (course.completionRate || 0), 0) / courses.length)
    : 0;

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header Section with Greeting and Tip */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{greeting}</h1>
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
            {/* Stats Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 mr-2 text-primary" />
                    <div className="text-3xl font-bold">{courses.length}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {courses.filter(c => c.isActive).length} published, {courses.length - courses.filter(c => c.isActive).length} drafts
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-500" />
                    <div className="text-3xl font-bold">{totalStudents.toLocaleString()}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Across all your courses
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BadgeCheck className="h-5 w-5 mr-2 text-green-500" />
                    <div className="text-3xl font-bold">{averageCompletionRate}%</div>
                  </div>
                  <div className="mt-2">
                    <Progress value={averageCompletionRate} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {courses.length === 0 ? (
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
                      <Link to="/dashboard/instructor/courses">View All Courses</Link>
                    </Button>
                  </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.slice(0, 3).map((course) => (
                      <Card key={course.id} className="overflow-hidden flex flex-col h-full">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={formatThumbnailUrl(course.thumbnail)}
                            alt={course.title}
                            className="object-cover w-full h-full"
                          />
                          <Badge 
                            variant={course.isActive ? "default" : "secondary"}
                            className="absolute top-2 right-2"
                          >
                            {course.isActive ? (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                                Published
                              </>
                            ) : (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5" />
                                Draft
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col flex-1">
                          <CardHeader className="p-4 pb-2 flex-shrink-0">
                            <CardTitle className="text-lg line-clamp-1 min-h-[1.75rem]">
                              {course.title}
                            </CardTitle>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground min-h-[1rem]">
                              {course.categoryName && `${course.categoryName} • `}
                              {course.durationInHours} hours
                            </div>
                          </CardHeader>
                          
                          <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                            <div className="flex-1 min-h-[3rem] mb-3">
                              <p className="text-sm text-muted-foreground line-clamp-2 h-10 overflow-hidden">
                                {course.description || "No description available"}
                              </p>
                            </div>
                            
                            {/* Course Status Badge - Fixed height section */}
                            <div className="min-h-[2rem] mb-3 flex items-start">
                              {course.courseStatus ? (
                                <Badge 
                                  variant={
                                    course.courseStatus === "Approved" ? "default" : 
                                    course.courseStatus === "Pending" ? "secondary" : 
                                    "destructive"
                                  }
                                  className={
                                    course.courseStatus === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                                    course.courseStatus === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                                    "bg-red-100 text-red-800 hover:bg-red-200"
                                  }
                                >
                                  {course.courseStatus === "Approved" && "✓ Approved"}
                                  {course.courseStatus === "Pending" && "⏳ Pending Review"}
                                  {course.courseStatus === "Rejected" && "✗ Rejected"}
                                  {!["Approved", "Pending", "Rejected"].includes(course.courseStatus) && course.courseStatus}
                                </Badge>
                              ) : (
                                <div className="h-6"></div> /* Placeholder for consistent spacing */
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-auto">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Students</span>
                                <span className="font-medium">{course.studentsCount || 0}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Completion Rate</span>
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">{course.completionRate || 0}%</span>
                                  <Progress value={course.completionRate || 0} className="h-1.5 flex-1" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>                        <CardFooter className="p-4 border-t">
                          <div className="w-full flex justify-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs flex items-center" 
                              asChild
                            >
                              <Link to={`/dashboard/instructor/courses/${course.id}/edit`}>
                                <Pencil className="h-3 w-3 mr-1" /> Edit Course
                              </Link>
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </section>
  
                
                {/* Quick Actions */}
                <section>
                  <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Link to="/dashboard/instructor/courses/new" className="block p-4">
                        <div className="flex items-center h-full">
                          <div className="bg-primary/10 rounded-full p-3 mr-4">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Create New Course</h3>
                            <p className="text-sm text-muted-foreground">Add new content to your teaching portfolio</p>
                          </div>
                        </div>
                      </Link>
                    </Card>
                    
                    <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Link to="/instructor/courses" className="block p-4">
                        <div className="flex items-center h-full">
                          <div className="bg-blue-500/10 rounded-full p-3 mr-4">
                            <Users className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Manage Courses</h3>
                            <p className="text-sm text-muted-foreground">Update and organize your existing courses</p>
                          </div>
                        </div>
                      </Link>
                    </Card>
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