import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { CategoryService } from "@/services/category-service";
import { CourseService } from "@/services/course-service";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

export default function AddCourse() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    thumbnail: null as File | null,
    isActive: true,
    categoryId: 0,
    durationInHours: 0,
    requirements: "", // Add requirements as a string that will be split into array
    useAIAssistant: false // Default to false to match backend default
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: CategoryService.getAllCategories
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Cleanup old preview if exists
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        thumbnail: file
      }));
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.thumbnail) {
      toast({
        title: "Error",
        description: "Please select a thumbnail image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await CourseService.addCourse(formData);
      toast({
        title: "Success",
        description: "Course created successfully"
      });
      navigate("/instructor/courses");
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Cleanup thumbnail preview URL when component unmounts
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Course</h1>
          
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
                value={formData.categoryId.toString()} 
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
              <label className="block text-sm font-medium">Thumbnail</label>
              
              {/* Thumbnail Size Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-blue-900">📏 Recommended Thumbnail Specifications</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <p><strong>Best Size:</strong> 1280×720 pixels (16:9 aspect ratio)</p>
                  <p><strong>Format:</strong> JPEG or PNG | <strong>File Size:</strong> 100-300KB</p>
                  <p><strong>Alternative sizes:</strong> 1920×1080 (HD) or 960×540 (medium)</p>
                  <p className="text-blue-600">💡 16:9 ratio ensures your thumbnail looks perfect across all devices!</p>
                </div>
              </div>

              {thumbnailPreview ? (
                <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                // Reserve space even when no preview to prevent layout shift
                <div className="relative w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                  <span className="text-gray-400 text-sm text-center px-2">Preview will appear here</span>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <label className="text-sm font-medium">
                {formData.isActive ? 'Published' : 'Draft'}
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.useAIAssistant}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useAIAssistant: checked }))}
              />
              <label className="text-sm font-medium">Enable AI Assistant for Students</label>
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
                {isSubmitting ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}