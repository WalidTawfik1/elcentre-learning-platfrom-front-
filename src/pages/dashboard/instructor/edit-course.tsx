import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { CategoryService } from "@/services/category-service";
import { CourseService } from "@/services/course-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { BookOpen, BookText } from "lucide-react";

import { DIRECT_API_URL } from "@/config/api-config";

// Backend base URL for serving static content
const API_BASE_URL = DIRECT_API_URL;

export default function EditCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    thumbnail: null as File | null,
    originalThumbnail: "", // Add this field to store original thumbnail URL
    isActive: true,
    categoryId: 0,
    durationInHours: 0,
    requirements: "" // Add requirements as a string
  });
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: CategoryService.getAllCategories
  });

  // Fetch course data
  useEffect(() => {
    const checkAuthAndFetchCourse = async () => {
      setIsLoading(true);
      try {
        // Don't redirect while auth is still loading
        if (authLoading) return;
        
        // First check authentication
        if (!isAuthenticated) {
          navigate("/login", { 
            replace: true,
            state: { from: `/dashboard/instructor/courses/${id}/edit` }
          });
          return;
        }

        // Then check if user is instructor
        if (user?.userType !== "Instructor") {
          toast({
            title: "Access Denied",
            description: "Only instructors can edit courses",
            variant: "destructive"
          });
          navigate("/", { replace: true });
          return;
        }

        // If all checks pass, fetch course data
        const courseData = await CourseService.getCourseById(id!);
        
        // Verify course ownership (optional, depending on your backend)
        if (courseData.instructorId !== user.id) {
          toast({
            title: "Access Denied",
            description: "You can only edit your own courses",
            variant: "destructive"
          });
          navigate("/instructor/courses", { replace: true });
          return;
        }


        setFormData({
          title: courseData.title,
          description: courseData.description,
          price: courseData.price,
          thumbnail: null,
          originalThumbnail: courseData.thumbnail, // Store the original thumbnail URL
          isActive: courseData.isActive,
          categoryId: courseData.categoryId,
          durationInHours: courseData.durationInHours || 0,
          requirements: courseData.requirements || "" // Use the string directly
        });
      } catch (error) {
        console.error("Error fetching course:", error);
        toast({
          title: "Error",
          description: "Failed to load course data. Please try again.",
          variant: "destructive"
        });
        navigate("/instructor/courses");
      } finally {
        setIsLoading(false);
      }
    };    checkAuthAndFetchCourse();
  }, [id, isAuthenticated, authLoading, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        thumbnail: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create update payload - only include thumbnail if a new one is selected
      const updateData: any = {
        id: Number(id),
        title: formData.title,
        description: formData.description,
        price: formData.price,
        isActive: formData.isActive,
        categoryId: formData.categoryId,
        durationInHours: formData.durationInHours,
        requirements: formData.requirements
      };

      // Only include thumbnail if user selected a new one
      if (formData.thumbnail) {
        updateData.thumbnail = formData.thumbnail;
      }

      await CourseService.updateCourse(updateData);

      toast({
        title: "Success",
        description: "Course updated successfully"
      });
      navigate("/instructor/courses");
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format the thumbnail URL correctly
  const formattedThumbnail = formData.originalThumbnail ? 
  (formData.originalThumbnail.startsWith('http') ? formData.originalThumbnail : `${API_BASE_URL}/${formData.originalThumbnail.replace(/^\//, '')}`) : 
  "/placeholder.svg";

  const getThumbnailPreview = () => {
    if (formData.thumbnail) {
      return URL.createObjectURL(formData.thumbnail);
    }
    return formattedThumbnail;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Course</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter course title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Enter course description"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select 
                value={formData.categoryId?.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price (EGP)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (hours)</label>
              <Input
                type="number"
                name="durationInHours"
                value={formData.durationInHours}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Course Requirements (Optional)</label>
              <Textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="Enter course requirements"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">Thumbnail</label>
              
              {/* Thumbnail Size Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-2">
                <h4 className="text-sm font-medium text-blue-900">📏 Recommended Thumbnail Specifications</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <p><strong>Best Size:</strong> 1280×720 pixels (16:9 aspect ratio)</p>
                  <p><strong>Format:</strong> JPEG or PNG | <strong>File Size:</strong> 100-300KB</p>
                  <p><strong>Alternative sizes:</strong> 1920×1080 (HD) or 960×540 (medium)</p>
                  <p className="text-blue-600">💡 16:9 ratio ensures your thumbnail looks perfect across all devices!</p>
                </div>
              </div>

              <div className="mb-2">
                <img 
                  src={getThumbnailPreview()}
                  alt="Thumbnail preview"
                  className="w-32 h-32 object-cover rounded-md"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.thumbnail ? 'New thumbnail preview' : 'Current thumbnail'}
                </p>
              </div>
              <label className="block text-sm font-medium mb-2">
                {formData.thumbnail ? 'Change thumbnail' : 'New Thumbnail (optional)'}
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty to keep the current thumbnail
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">Published</label>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/instructor/courses")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Course"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/dashboard/instructor/courses/${id}/content`)}
              >
                <BookOpen className="mr-2 h-4 w-4" /> Manage Content
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}