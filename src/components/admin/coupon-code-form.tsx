import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Tag, Calendar, Percent, DollarSign, BookOpen, Globe } from "lucide-react";
import { CouponService } from "@/services/coupon-service";
import { CourseService } from "@/services/course-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import type { CouponCode, CreateCouponCodeRequest, UpdateCouponCodeRequest } from "@/types/coupon";

const couponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code must be at most 20 characters"),
  discountType: z.enum(["percentage", "fixed", "setprice", "free"]),
  discountValue: z.number().min(0, "Discount value must be positive"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  usageLimit: z.number().min(1, "Usage limit must be at least 1"),
  isGlobal: z.boolean().optional(),
  courseId: z.union([z.number().positive(), z.null(), z.undefined()]).optional(),
  courseName: z.string().optional().nullable(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

interface CouponCodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingCoupon?: CouponCode | null;
  defaultCourseId?: number | null;
  defaultCourseName?: string; // Name of the course for display purposes
  showGlobalOption?: boolean; // Only admins can create global coupons
  forceGlobal?: boolean; // If true, force global coupon creation (hide course selection)
  hideCourseSelection?: boolean; // If true, hide course selection (for admin management)
}

export function CouponCodeForm({
  open,
  onOpenChange,
  onSuccess,
  editingCoupon,
  defaultCourseId = null,
  defaultCourseName,
  showGlobalOption = false,
  forceGlobal = false,
  hideCourseSelection = false
}: CouponCodeFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      expirationDate: "",
      usageLimit: 100,
      isGlobal: forceGlobal || (hideCourseSelection && !defaultCourseId),
      courseId: forceGlobal || hideCourseSelection ? null : defaultCourseId,
      courseName: null,
    },
  });

  // Load instructor courses if user is instructor
  useEffect(() => {
    if (open && user?.userType === "Instructor") {
      loadInstructorCourses();
    }
  }, [open, user]);

  // Reset form when editing coupon changes
  useEffect(() => {
    if (editingCoupon) {
      form.reset({
        code: editingCoupon.code,
        discountType: editingCoupon.discountType,
        discountValue: editingCoupon.discountValue,
        expirationDate: editingCoupon.expirationDate,
        usageLimit: editingCoupon.usageLimit,
        isGlobal: editingCoupon.isGlobal,
        courseId: editingCoupon.courseId,
        courseName: editingCoupon.courseName,
      });
    } else {
      form.reset({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        expirationDate: "",
        usageLimit: 100,
        isGlobal: forceGlobal || (hideCourseSelection && !defaultCourseId),
        courseId: forceGlobal || hideCourseSelection ? null : defaultCourseId,
        courseName: null,
      });
    }
  }, [editingCoupon, defaultCourseId, forceGlobal, hideCourseSelection, form]);

  const loadInstructorCourses = async () => {
    if (!user?.id) return;
    
    setIsLoadingCourses(true);
    try {
      const instructorCourses = await CourseService.getInstructorCourses();
      setCourses(Array.isArray(instructorCourses) ? instructorCourses : []);
    } catch (error) {
      console.error("Error loading instructor courses:", error);
      toast({
        title: "Error",
        description: "Failed to load your courses",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const onSubmit = async (values: CouponFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Determine if this should be a global coupon
      const isGlobalCoupon = forceGlobal || (showGlobalOption && values.isGlobal);
      
      // Determine the courseId - null for global coupons, specific courseId for course coupons
      let courseId: number | null = null;
      let courseName: string | null = null;
      
      if (!isGlobalCoupon) {
        if (editingCoupon) {
          // When editing a coupon, preserve the original course information
          courseId = editingCoupon.courseId;
          courseName = editingCoupon.courseName;
        } else if (hideCourseSelection) {
          // For admin management with hidden course selection, 
          // always set courseId to null (no course-specific coupons in admin management)
          courseId = null;
          courseName = null;
        } else if (defaultCourseId) {
          courseId = defaultCourseId;
          // Set courseName from defaultCourseName or find it in courses array
          courseName = defaultCourseName || 
                      courses.find(c => c.id === defaultCourseId)?.title || 
                      null;
        } else if (values.courseId && values.courseId > 0) {
          courseId = values.courseId;
          // Find course name from courses array
          courseName = courses.find(c => c.id === values.courseId)?.title || null;
        } else {
          // This shouldn't happen, but if no course is selected for a non-global coupon, throw an error
          throw new Error("Course selection is required for non-global coupons");
        }
      } else {
        // Global coupon - set courseName to null
        courseName = null;
      }

      const requestData: CreateCouponCodeRequest | UpdateCouponCodeRequest = {
        code: values.code.toUpperCase(),
        discountType: values.discountType,
        discountValue: values.discountValue,
        expirationDate: values.expirationDate,
        usageLimit: values.usageLimit,
        isGlobal: isGlobalCoupon,
        courseId: courseId,
        courseName: courseName,
      };

      if (editingCoupon) {
        // Update existing coupon
        await CouponService.updateCouponCode({
          ...requestData,
          id: editingCoupon.id,
        } as UpdateCouponCodeRequest);
        
        toast({
          title: "Success",
          description: "Coupon code updated successfully",
        });
      } else {
        // Create new coupon
        await CouponService.createCouponCode(requestData);
        
        toast({
          title: "Success",
          description: "Coupon code created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save coupon code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDiscountValueLabel = () => {
    const discountType = form.watch("discountType");
    switch (discountType) {
      case "percentage":
        return "Discount Percentage (%)";
      case "fixed":
        return "Discount Amount (EGP)";
      case "setprice":
        return "Set Price (EGP)";
      case "free":
        return "Discount Value (ignored for free)";
      default:
        return "Discount Value";
    }
  };

  const getDiscountValuePlaceholder = () => {
    const discountType = form.watch("discountType");
    switch (discountType) {
      case "percentage":
        return "e.g., 20 (for 20% off)";
      case "fixed":
        return "e.g., 50 (for 50 EGP off)";
      case "setprice":
        return "e.g., 99 (final price will be 99 EGP)";
      case "free":
        return "0 (course will be free)";
      default:
        return "Enter discount value";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {editingCoupon ? "Edit Coupon Code" : "Create Coupon Code"}
          </DialogTitle>
          <DialogDescription>
            {editingCoupon ? "Update the coupon code details" : "Create a new coupon code for discounts"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Course/Global Indicator */}
          {forceGlobal ? (
            <Alert className="bg-green-50 border-green-200">
              <Globe className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Creating <strong>global coupon</strong> - can be applied to any course
              </AlertDescription>
            </Alert>
          ) : defaultCourseId ? (
            <Alert className="bg-blue-50 border-blue-200">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Creating coupon for: <strong>
                  {defaultCourseName || courses.find(c => c.id === defaultCourseId)?.title || `Course ID: ${defaultCourseId}`}
                </strong>
              </AlertDescription>
            </Alert>
          ) : hideCourseSelection ? null : null}

          {/* Coupon Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              placeholder="e.g., SAVE20, WELCOME100"
              {...form.register("code")}
              className="uppercase"
              disabled={isSubmitting}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <Label htmlFor="discountType">Discount Type *</Label>
            <Select
              value={form.watch("discountType")}
              onValueChange={(value) => form.setValue("discountType", value as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select discount type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Percentage Off
                  </div>
                </SelectItem>
                <SelectItem value="fixed">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fixed Amount Off
                  </div>
                </SelectItem>
                <SelectItem value="setprice">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Set Final Price
                  </div>
                </SelectItem>
                <SelectItem value="free">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Make Free
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Value */}
          <div className="space-y-2">
            <Label htmlFor="discountValue">{getDiscountValueLabel()}</Label>
            <Input
              id="discountValue"
              type="number"
              step="0.01"
              min="0"
              placeholder={getDiscountValuePlaceholder()}
              {...form.register("discountValue", { valueAsNumber: true })}
              disabled={isSubmitting || form.watch("discountType") === "free"}
            />
            {form.formState.errors.discountValue && (
              <p className="text-sm text-red-500">{form.formState.errors.discountValue.message}</p>
            )}
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date *</Label>
            <Input
              id="expirationDate"
              type="date"
              {...form.register("expirationDate")}
              disabled={isSubmitting}
              min={new Date().toISOString().split('T')[0]}
            />
            {form.formState.errors.expirationDate && (
              <p className="text-sm text-red-500">{form.formState.errors.expirationDate.message}</p>
            )}
          </div>

          {/* Usage Limit */}
          <div className="space-y-2">
            <Label htmlFor="usageLimit">Usage Limit *</Label>
            <Input
              id="usageLimit"
              type="number"
              min="1"
              placeholder="e.g., 100"
              {...form.register("usageLimit", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {form.formState.errors.usageLimit && (
              <p className="text-sm text-red-500">{form.formState.errors.usageLimit.message}</p>
            )}
          </div>

          {/* Global Coupon (Admin only) - hidden when forceGlobal is true or when defaultCourseId is provided */}
          {showGlobalOption && !forceGlobal && !defaultCourseId && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGlobal"
                checked={form.watch("isGlobal")}
                onCheckedChange={(checked) => form.setValue("isGlobal", !!checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="isGlobal" className="text-sm font-medium">
                {hideCourseSelection 
                  ? "Global Coupon (works on all courses)" 
                  : "Global Coupon (can be applied to any course)"
                }
              </Label>
            </div>
          )}

          {/* Course Selection (if not global and no default course and not forced global and not hidden course selection) */}
          {(!showGlobalOption || !form.watch("isGlobal")) && !defaultCourseId && !forceGlobal && !hideCourseSelection && (
            <div className="space-y-2">
              <Label htmlFor="courseId">
                {user?.userType === "Instructor" ? "Select Your Course *" : "Select Course"}
              </Label>
              {user?.userType === "Instructor" ? (
                <Select
                  value={form.watch("courseId")?.toString() || ""}
                  onValueChange={(value) => form.setValue("courseId", value ? parseInt(value) : null)}
                  disabled={isSubmitting || isLoadingCourses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={defaultCourseId?.toString() || ""}
                  disabled
                  placeholder="Course will be specified externally"
                />
              )}
              {form.formState.errors.courseId && (
                <p className="text-sm text-red-500">{form.formState.errors.courseId.message}</p>
              )}
            </div>
          )}

          {/* Discount Preview */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Preview:</strong> This coupon will give{" "}
              {form.watch("discountType") === "percentage" && `${form.watch("discountValue")}% off`}
              {form.watch("discountType") === "fixed" && `${form.watch("discountValue")} EGP off`}
              {form.watch("discountType") === "setprice" && `a final price of ${form.watch("discountValue")} EGP`}
              {form.watch("discountType") === "free" && "free access"}
              {" "}and can be used {form.watch("usageLimit")} times until {form.watch("expirationDate")}.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingCoupon ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingCoupon ? "Update Coupon" : "Create Coupon"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
