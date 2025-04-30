import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  ChartBarIcon, 
  Layers,
  LightbulbIcon,
  TrendingUp,
  BadgeCheck,
  CircleEllipsis, 
  Pencil,
  GraduationCap
} from "lucide-react";
import { CourseService } from "@/services/course-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
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
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [greeting, setGreeting] = useState<string>("");
  const [tip, setTip] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  
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
          const coursesWithStats = await Promise.all(
            coursesData.map(async (course: any) => {
              try {
                // Get enrollment count
                const enrollmentCount = await CourseService.getEnrollmentCount(course.id);
                
                // Get actual enrollments to calculate proper completion rate
                const enrollments = await EnrollmentService.getCourseEnrollments(course.id);
                
                // Calculate actual completion rate based on student progress
                let completionRate = 0;
                
                if (Array.isArray(enrollments) && enrollments.length > 0) {
                  // If there are enrollments, calculate the average progress
                  const totalProgress = enrollments.reduce((total, enrollment) => {
                    return total + (enrollment.progress || 0);
                  }, 0);
                  completionRate = Math.round(totalProgress / enrollments.length);
                }
                
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
          );

          setCourses(Array.isArray(coursesWithStats) ? coursesWithStats : []);
          
          // Set first course as selected by default if available
          if (Array.isArray(coursesWithStats) && coursesWithStats.length > 0) {
            setSelectedCourse(coursesWithStats[0]);
            fetchCourseEnrollments(coursesWithStats[0].id);
          }
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
    }
  }, [isAuthenticated, user, navigate, authLoading]);
  
  // Fetch enrollments for a specific course
  const fetchCourseEnrollments = async (courseId: number) => {
    setEnrollmentsLoading(true);
    try {
      // Use the EnrollmentService instead of direct fetch
      const enrollmentsData = await EnrollmentService.getCourseEnrollments(courseId);
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
    } catch (error) {
      console.error(`Error fetching enrollments for course ${courseId}:`, error);
      toast({
        title: "Error",
        description: "Failed to load student enrollments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnrollmentsLoading(false);
    }
  };
  
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
  
  // Get counts by enrollment status
  const getStatusCounts = () => {
    const counts = {
      active: 0,
      completed: 0,
      other: 0
    };
    
    enrollments.forEach(enrollment => {
      if (enrollment.status === "Active") counts.active++;
      else if (enrollment.status === "Completed") counts.completed++;
      else counts.other++;
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();

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
                      <Card key={course.id} className="overflow-hidden flex flex-col">
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
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-lg line-clamp-1">
                            {course.title}
                          </CardTitle>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            {course.categoryName && `${course.categoryName} • `}
                            {course.durationInHours} hours
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-1">
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {course.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
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
                        <CardFooter className="p-4 border-t">
                          <div className="w-full flex justify-between items-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs flex items-center" 
                              asChild
                            >
                              <Link to={`/dashboard/instructor/courses/${course.id}/edit`}>
                                <Pencil className="h-3 w-3 mr-1" /> Edit
                              </Link>
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="text-xs"
                              onClick={() => {
                                setSelectedCourse(course);
                                fetchCourseEnrollments(course.id);
                              }}
                            >
                              View Students
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </section>
                
                {/* Course Enrollments Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center">
                      <GraduationCap className="mr-2" />
                      Student Enrollments
                    </h2>
                  </div>
                  
                  {selectedCourse ? (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>
                            Students enrolled in: {selectedCourse.title}
                          </CardTitle>
                          <div className="flex space-x-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                              Active: {statusCounts.active}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                              Completed: {statusCounts.completed}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="all">
                          <TabsList className="mb-4">
                            <TabsTrigger value="all">All Students</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="all">
                            {enrollmentsLoading ? (
                              <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex items-center p-3 border-b">
                                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                    <div className="flex-1">
                                      <Skeleton className="h-4 w-1/3 mb-2" />
                                      <Skeleton className="h-3 w-1/5" />
                                    </div>
                                    <Skeleton className="h-6 w-16" />
                                  </div>
                                ))}
                              </div>
                            ) : enrollments.length === 0 ? (
                              <div className="text-center py-8">
                                <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                                <p>No students enrolled in this course yet.</p>
                              </div>
                            ) : (
                              <div className="divide-y">
                                {enrollments.map((enrollment) => (
                                  <div key={enrollment.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarFallback>
                                          {enrollment.studentName ? 
                                            enrollment.studentName.charAt(0) : 
                                            "S"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {enrollment.studentName || "Student"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Enrolled: {new Date().toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      <div className="mr-4">
                                        <div className="text-xs text-muted-foreground mb-1">Progress</div>
                                        <div className="flex items-center">
                                          <Progress value={enrollment.progress} className="h-2 w-24 mr-2" />
                                          <span className="text-xs font-medium w-8 text-right">{enrollment.progress}%</span>
                                        </div>
                                      </div>
                                      
                                      <Badge 
                                        variant={
                                          enrollment.status === "Completed" ? "outline" : 
                                          enrollment.status === "Active" ? "default" : 
                                          "secondary"
                                        }
                                        className={cn(
                                          "w-24 justify-center",
                                          enrollment.status === "Completed" ? "bg-green-50 text-green-700 hover:bg-green-100" : 
                                          enrollment.status === "Active" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : 
                                          "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                        )}
                                      >
                                        {enrollment.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="active">
                            <div className="divide-y">
                              {enrollments.filter(e => e.status === "Active").length === 0 ? (
                                <div className="text-center py-8">
                                  <CircleEllipsis className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                                  <p>No active students for this course.</p>
                                </div>
                              ) : (
                                enrollments
                                  .filter(e => e.status === "Active")
                                  .map((enrollment) => (
                                    <div key={enrollment.id} className="py-3 flex items-center justify-between">
                                      <div className="flex items-center">
                                        <Avatar className="h-10 w-10 mr-3">
                                          <AvatarFallback>
                                            {enrollment.studentName ? 
                                              enrollment.studentName.charAt(0) : 
                                              "S"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">
                                            {enrollment.studentName || "Student"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Enrolled: {new Date().toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <div className="mr-4">
                                          <div className="text-xs text-muted-foreground mb-1">Progress</div>
                                          <div className="flex items-center">
                                            <Progress value={enrollment.progress} className="h-2 w-24 mr-2" />
                                            <span className="text-xs font-medium w-8 text-right">{enrollment.progress}%</span>
                                          </div>
                                        </div>
                                        
                                        <Badge 
                                          variant="default"
                                          className={cn(
                                            "w-24 justify-center",
                                            "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                          )}
                                        >
                                          Active
                                        </Badge>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="completed">
                            <div className="divide-y">
                              {enrollments.filter(e => e.status === "Completed").length === 0 ? (
                                <div className="text-center py-8">
                                  <BadgeCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                                  <p>No students have completed this course yet.</p>
                                </div>
                              ) : (
                                enrollments
                                  .filter(e => e.status === "Completed")
                                  .map((enrollment) => (
                                    <div key={enrollment.id} className="py-3 flex items-center justify-between">
                                      <div className="flex items-center">
                                        <Avatar className="h-10 w-10 mr-3">
                                          <AvatarFallback>
                                            {enrollment.studentName ? 
                                              enrollment.studentName.charAt(0) : 
                                              "S"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">
                                            {enrollment.studentName || "Student"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Enrolled: {new Date().toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <div className="mr-4">
                                          <div className="text-xs text-muted-foreground mb-1">Progress</div>
                                          <div className="flex items-center">
                                            <Progress value={100} className="h-2 w-24 mr-2" />
                                            <span className="text-xs font-medium w-8 text-right">100%</span>
                                          </div>
                                        </div>
                                        
                                        <Badge 
                                          variant="outline"
                                          className={cn(
                                            "w-24 justify-center",
                                            "bg-green-50 text-green-700 hover:bg-green-100"
                                          )}
                                        >
                                          Completed
                                        </Badge>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <div className="flex justify-center mb-4">
                        <Users className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg mb-2 font-medium">No course selected</p>
                      <p className="text-muted-foreground mb-4">
                        Select a course to view student enrollments
                      </p>
                    </div>
                  )}
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