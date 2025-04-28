import { useState } from "react";
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

export default function AddCourse() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    thumbnail: null as File | null,
    isActive: true,
    categoryId: 0
  });

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
      setFormData(prev => ({
        ...prev,
        thumbnail: e.target.files![0]
      }));
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
      navigate("/dashboard/instructor/courses");
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
              <label className="block text-sm font-medium mb-2">Price (LE)</label>
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
              <label className="block text-sm font-medium mb-2">Thumbnail</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/instructor/courses")}
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