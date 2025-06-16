import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CreateNotificationForm } from "@/components/notifications/create-notification-form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CourseService } from "@/services/course-service";
import { ModuleService } from "@/services/module-service";
import { LessonService } from "@/services/lesson-service";
import { CourseModule, Lesson } from "@/types/api";
import { QuizManagement } from "@/components/quiz/quiz-management";
import { 
  ChevronLeft, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Video,
  FileText,
  Loader2,
  MoveUp,
  MoveDown,
  Play,
  BookOpen,
  HelpCircle,
  Bell
} from "lucide-react";

export default function CourseContentManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);

  // Module dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
    isPublished: true
  });

  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    description: "",
    contentType: "text",
    content: null as File | null,
    contentText: "",
    originalContent: "", // Store original content URL/path
    durationInMinutes: 10,
    isPublished: true
  });

  // Processing states
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  useEffect(() => {
    // Check authentication and redirect if needed
    if (!isAuthenticated && user === null) {
      // User is still loading, don't redirect yet
      return;
    }
    
    if (!isAuthenticated && user === undefined) {
      navigate("/auth/login?redirect=/dashboard/instructor", { replace: true });
      return;
    }
    
    if (user?.userType !== "Instructor") {
      navigate("/", { replace: true });
      toast({
        title: "Access Denied",
        description: "Only instructors can access this page",
        variant: "destructive"
      });
      return;
    }
    
    fetchCourseAndModules();
  }, [id, isAuthenticated, user, navigate]);

  const fetchCourseAndModules = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Get course information
      const courseData = await CourseService.getCourseById(id);
      
      // Verify ownership (only course owner can edit)
      if (courseData.instructorId !== user?.id) {
        toast({
          title: "Access denied",
          description: "You can only manage content for your own courses.",
          variant: "destructive"
        });
        navigate("/dashboard/instructor/courses", { replace: true });
        return;
      }
      
      setCourse(courseData);
      
      // Get modules and lessons
      await fetchModules();
      
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    if (!id) return;
    
    try {
      const modulesData = await ModuleService.getModulesByCourseId(id);
      
      // Sort modules by orderIndex if available, otherwise just display as is
      const sortedModules = modulesData.sort((a, b) => 
        (a.orderIndex || 0) - (b.orderIndex || 0)
      );
      
      // Load lessons for each module
      const modulesWithLessons = await Promise.all(
        sortedModules.map(async (module) => {
          try {
            const lessons = await LessonService.getLessonsByModuleId(module.id);
            return {
              ...module,
              lessons: lessons || []
            };
          } catch (error) {
            console.error(`Error fetching lessons for module ${module.id}:`, error);
            return {
              ...module,
              lessons: []
            };
          }
        })
      );
      
      setModules(modulesWithLessons);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: "Failed to load course modules. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchLessonsForModule = async (moduleId: number): Promise<Lesson[]> => {
    try {
      const lessons = await LessonService.getLessonsByModuleId(moduleId);
      
      // Sort lessons by orderIndex if available
      return lessons.sort((a, b) => 
        (a.orderIndex || 0) - (b.orderIndex || 0)
      );
    } catch (error) {
      console.error(`Error fetching lessons for module ${moduleId}:`, error);
      toast({
        title: "Error",
        description: "Failed to load lessons. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  };

  // Module handlers
  const handleAddModule = () => {
    setIsEditingModule(false);
    setCurrentModuleId(null);
    setModuleFormData({
      title: "",
      description: "",
      isPublished: true
    });
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setIsEditingModule(true);
    setCurrentModuleId(module.id);
    setModuleFormData({
      title: module.title,
      description: module.description,
      isPublished: module.isPublished
    });
    setModuleDialogOpen(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSavingModule(true);
    try {
      if (isEditingModule && currentModuleId) {
        // Update existing module
        await ModuleService.updateModule({
          id: currentModuleId,
          ...moduleFormData
        });
        
        toast({
          title: "Module Updated",
          description: "The module has been updated successfully."
        });
      } else {
        // Add new module
        await ModuleService.addModule({
          ...moduleFormData,
          courseId: parseInt(id)
        });
        
        toast({
          title: "Module Added",
          description: "The new module has been added successfully."
        });
      }
      
      // Refresh modules list
      await fetchModules();
      setModuleDialogOpen(false);
    } catch (error) {
      console.error("Error saving module:", error);
      toast({
        title: "Error",
        description: "Failed to save module. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      await ModuleService.deleteModule(moduleId);
      
      // Refresh modules list
      await fetchModules();
      
      toast({
        title: "Module Deleted",
        description: "The module has been deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting module:", error);
      toast({
        title: "Error",
        description: "Failed to delete module. Please try again.",
        variant: "destructive"
      });
    }  };

  // Lesson handlers
  const handleAddLesson = (moduleId: number) => {
    setIsEditingLesson(false);
    setCurrentLessonId(null);
    setSelectedModuleId(moduleId);
    setLessonFormData({
      title: "",
      description: "",
      contentType: "text",
      content: null,
      contentText: "",
      originalContent: "", // Store original content URL/path
      durationInMinutes: 10,
      isPublished: true
    });
    setLessonDialogOpen(true);
  };
  const handleEditLesson = async (lesson: Lesson) => {
    setIsEditingLesson(true);
    setCurrentLessonId(lesson.id);
    setSelectedModuleId(lesson.moduleId);
    
    // Fetch detailed lesson info if needed
    const lessonDetails = await LessonService.getLessonById(lesson.id);
    
    setLessonFormData({
      title: lesson.title,
      description: lesson.description || "",
      contentType: lesson.contentType,
      content: null, // Can't pre-set file input
      contentText: lesson.contentType === "text" ? lesson.content || "" : "",
      originalContent: lesson.content || "", // Store original content URL/path
      durationInMinutes: lesson.durationInMinutes,
      isPublished: lesson.isPublished
    });
    
    setLessonDialogOpen(true);
  };
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) return;

    setIsSavingLesson(true);
    try {
      if (isEditingLesson && currentLessonId) {
        // Update existing lesson - content and contentType are not editable
        const updateData: any = {
          id: currentLessonId,
          title: lessonFormData.title,
          description: lessonFormData.description,
          durationInMinutes: lessonFormData.durationInMinutes,
          isPublished: lessonFormData.isPublished
        };
        
        await LessonService.updateLesson(updateData);
        
        toast({
          title: "Lesson Updated",
          description: "The lesson has been updated successfully."
        });
      } else {
        // Add new lesson - all fields are required
        const content = lessonFormData.contentType === "text" 
          ? lessonFormData.contentText 
          : lessonFormData.content;
        
        if (!content) {
          throw new Error(lessonFormData.contentType === "text" ? 
            "Text content is required" : 
            "Video content is required");
        }
        
        await LessonService.addLesson({
          title: lessonFormData.title,
          description: lessonFormData.description,
          contentType: lessonFormData.contentType,
          content: content,
          durationInMinutes: lessonFormData.durationInMinutes,
          isPublished: lessonFormData.isPublished,
          moduleId: selectedModuleId
        });
        
        toast({
          title: "Lesson Added",
          description: "The new lesson has been added successfully."
        });
      }
      
      // Refresh modules list to show new/updated lesson
      await fetchModules();
      setLessonDialogOpen(false);
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: typeof error === "object" && error !== null && "message" in error 
          ? (error as Error).message 
          : "Failed to save lesson. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      await LessonService.deleteLesson(lessonId);
      
      // Refresh modules list
      await fetchModules();
      
      toast({
        title: "Lesson Deleted",
        description: "The lesson has been deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Error",
        description: "Failed to delete lesson. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLessonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLessonFormData({
        ...lessonFormData,
        content: e.target.files[0]
      });
    }
  };

  // If still loading, show loading indicator
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/courses/${id}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Course Preview
          </Button>
          <h1 className="text-3xl font-bold">{course?.title || "Course"}: Content Management</h1>
        </div>        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Modules & Lessons
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                Add and manage modules and lessons for your course.
              </p>
              <Button onClick={handleAddModule}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Module
              </Button>
            </div>

        {/* Modules List */}
        {modules.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">No modules yet</h3>
            <p className="text-muted-foreground mb-4">Your course doesn't have any modules. Add a module to get started.</p>
            <Button onClick={handleAddModule}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add First Module
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {modules.map((module) => (
              <AccordionItem key={module.id} value={module.id.toString()} className="border p-2 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <AccordionTrigger className="flex-1 hover:no-underline py-0 font-medium">
                    <span className={!module.isPublished ? "opacity-50" : ""}>
                      {module.title}
                      {!module.isPublished && (
                        <span className="ml-2 text-xs py-0.5 px-1.5 bg-gray-100 text-gray-500 rounded">Draft</span>
                      )}
                    </span>
                  </AccordionTrigger>
                  
                  <div className="flex items-center gap-1 pr-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLesson(module.id);
                      }}
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1" /> Lesson
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditModule(module);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Module</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this module? This will also delete all lessons within this module. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteModule(module.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <AccordionContent>
                  <div className="pt-4 pb-2">
                    {module.description && (
                      <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                    )}
                    
                    {/* Lessons Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Lesson</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(module as any).lessons?.length > 0 ? (
                            (module as any).lessons.map((lesson: Lesson) => (
                              <TableRow key={lesson.id}>
                                <TableCell className="font-medium">
                                  {lesson.title}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {lesson.contentType === 'video' ? (
                                      <>
                                        <Video className="h-3.5 w-3.5 mr-1.5" />
                                        <span>Video</span>
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                                        <span>Text</span>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{lesson.durationInMinutes} min</TableCell>
                                <TableCell>
                                  {lesson.isPublished ? (
                                    <span className="inline-flex items-center bg-green-50 text-green-700 text-xs py-0.5 px-2 rounded">
                                      Published
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center bg-gray-100 text-gray-500 text-xs py-0.5 px-2 rounded">
                                      Draft
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditLesson(lesson)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this lesson? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-muted-foreground">No lessons in this module</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => handleAddLesson(module.id)}
                                >
                                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Lesson
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}          </Accordion>
        )}
          </TabsContent>          <TabsContent value="quizzes" className="mt-6">
            <QuizManagement 
              courseId={parseInt(id!)}
              lessonTitle={course?.title || "Course"}
              lessons={modules.flatMap(module => 
                (module as any).lessons?.map((lesson: Lesson) => ({
                  id: lesson.id,
                  title: lesson.title
                })) || []
              )}            />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Course Notifications</h3>
                  <p className="text-muted-foreground">
                    Send notifications to all enrolled students about important updates, assignments, or announcements.
                  </p>
                </div>
              </div>

              <CreateNotificationForm
                courseId={parseInt(id!)}
                courseName={course?.title || "Course"}
                variant="card"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Module Dialog */}
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditingModule ? "Edit Module" : "Add New Module"}</DialogTitle>
              <DialogDescription>
                {isEditingModule 
                  ? "Update the details of this module."
                  : "Create a new module for your course."}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleModuleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={moduleFormData.title}
                    onChange={(e) => setModuleFormData({...moduleFormData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={moduleFormData.description}
                    onChange={(e) => setModuleFormData({...moduleFormData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPublished"
                    checked={moduleFormData.isPublished}
                    onCheckedChange={(checked) => setModuleFormData({...moduleFormData, isPublished: checked})}
                  />
                  <Label htmlFor="isPublished">Publish this module</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingModule}>
                  {isSavingModule ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    isEditingModule ? "Update Module" : "Add Module"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{isEditingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
              <DialogDescription>
                {isEditingLesson 
                  ? "Update the content of this lesson."
                  : "Create a new lesson for your module."}
              </DialogDescription>            </DialogHeader>
            
            <form onSubmit={handleLessonSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lesson-title">Title</Label>
                  <Input
                    id="lesson-title"
                    value={lessonFormData.title}
                    onChange={(e) => setLessonFormData({...lessonFormData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="lesson-description">Description</Label>
                  <Textarea
                    id="lesson-description"
                    value={lessonFormData.description}
                    onChange={(e) => setLessonFormData({...lessonFormData, description: e.target.value})}
                    rows={3}
                    required
                    placeholder="Enter lesson description"
                  />
                </div>
                
                {!isEditingLesson && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="contentType">Content Type</Label>
                      <Select
                        value={lessonFormData.contentType}
                        onValueChange={(value) => setLessonFormData({...lessonFormData, contentType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>Text/Article</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              <span>Video</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {lessonFormData.contentType === 'text' ? (
                      <div className="grid gap-2">
                        <Label htmlFor="contentText">Content</Label>
                        <Textarea
                          id="contentText"
                          value={lessonFormData.contentText}
                          onChange={(e) => setLessonFormData({...lessonFormData, contentText: e.target.value})}
                          rows={10}
                          required={lessonFormData.contentType === 'text'}
                        />
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="videoContent">Video Content</Label>
                        <Input
                          id="videoContent"
                          type="file"
                          accept="video/*"
                          onChange={handleLessonFileChange}
                          required={lessonFormData.contentType === 'video'}
                        />
                      </div>
                    )}
                  </>
                )}
                
                {isEditingLesson && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Content and content type cannot be edited for existing lessons.
                    </p>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="durationInMinutes">Duration (minutes)</Label>
                  <Input
                    id="durationInMinutes"
                    type="number"
                    min="1"
                    max="300"
                    value={lessonFormData.durationInMinutes}
                    onChange={(e) => setLessonFormData({...lessonFormData, durationInMinutes: parseInt(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="lesson-isPublished"
                    checked={lessonFormData.isPublished}
                    onCheckedChange={(checked) => setLessonFormData({...lessonFormData, isPublished: checked})}
                  />
                  <Label htmlFor="lesson-isPublished">Publish this lesson</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLessonDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingLesson}>
                  {isSavingLesson ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    isEditingLesson ? "Update Lesson" : "Add Lesson"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}