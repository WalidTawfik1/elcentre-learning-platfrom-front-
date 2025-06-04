import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CourseService } from "@/services/course-service";
import { CheckCircle, XCircle, Clock, User, Calendar, DollarSign, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PendingCourse {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  instructorName: string;
  instructorId: number;
  categoryName: string;
  categoryId: number;
  durationInHours: number;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export default function PendingCoursesPage() {
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingCourseId, setProcessingCourseId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedCourseForRejection, setSelectedCourseForRejection] = useState<number | null>(null);

  useEffect(() => {
    loadPendingCourses();
  }, []);

  const loadPendingCourses = async () => {
    try {
      setLoading(true);
      const response = await CourseService.getPendingCourses();
      setPendingCourses(response.data || response || []);
    } catch (error) {
      console.error("Error loading pending courses:", error);
      toast.error("Failed to load pending courses");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: number) => {
    try {
      setProcessingCourseId(courseId);
      await CourseService.approveCourse(courseId);
      toast.success("Course approved successfully");
      
      // Update the local state
      setPendingCourses(prev => 
        prev.map(course => 
          course.id === courseId 
            ? { ...course, status: 'Approved' as const }
            : course
        )
      );
    } catch (error) {
      console.error("Error approving course:", error);
      toast.error("Failed to approve course");
    } finally {
      setProcessingCourseId(null);
    }
  };

  const handleRejectCourse = async (courseId: number, reason: string) => {
    try {
      setProcessingCourseId(courseId);
      await CourseService.rejectCourse(courseId, reason);
      toast.success("Course rejected");
      
      // Update the local state
      setPendingCourses(prev => 
        prev.map(course => 
          course.id === courseId 
            ? { ...course, status: 'Rejected' as const, rejectionReason: reason }
            : course
        )
      );
      
      setRejectionReason("");
      setSelectedCourseForRejection(null);
    } catch (error) {
      console.error("Error rejecting course:", error);
      toast.error("Failed to reject course");
    } finally {
      setProcessingCourseId(null);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'Approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = pendingCourses.filter(course => course.status === 'Pending').length;
  const approvedCount = pendingCourses.filter(course => course.status === 'Approved').length;
  const rejectedCount = pendingCourses.filter(course => course.status === 'Rejected').length;

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Pending Course Approvals</h1>
            <p className="text-muted-foreground mt-2">Review and manage course submissions</p>
          </div>
          
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Pending Course Approvals</h1>
          <p className="text-muted-foreground mt-2">Review and manage course submissions</p>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {pendingCourses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">There are currently no courses pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-6 p-6">
                  {/* Course Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      className="w-32 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  
                  {/* Course Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {course.description}
                        </p>
                      </div>
                      {getStatusBadge(course.status)}
                    </div>
                    
                    {/* Course Meta Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{course.instructorName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatPrice(course.price)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.durationInHours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(course.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">Category:</span> {course.categoryName}
                    </div>
                    
                    {/* Rejection Reason */}
                    {course.status === 'Rejected' && course.rejectionReason && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rejection Reason:</strong> {course.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  {course.status === 'Pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleApproveCourse(course.id)}
                        disabled={processingCourseId === course.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            disabled={processingCourseId === course.id}
                            onClick={() => setSelectedCourseForRejection(course.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Course</DialogTitle>
                            <DialogDescription>
                              Please provide a reason for rejecting "{course.title}". This will be sent to the instructor.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Enter rejection reason..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={4}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRejectionReason("");
                                  setSelectedCourseForRejection(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleRejectCourse(course.id, rejectionReason)}
                                disabled={!rejectionReason.trim() || processingCourseId === course.id}
                              >
                                Reject Course
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>      )}
    </div>
    </MainLayout>
  );
}
