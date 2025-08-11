import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus, 
  Tag, 
  Calendar, 
  Users, 
  AlertCircle,
  Globe,
  BookOpen,
  Link,
  Share2
} from "lucide-react";
import { CouponService } from "@/services/coupon-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/components/ui/use-toast";
import { CouponCodeForm } from "./coupon-code-form";
import { CouponLinkGenerator } from "@/components/courses/coupon-link-generator";
import type { CouponCode } from "@/types/coupon";

interface CouponCodeManagerProps {
  courseId?: number | null; // If provided, show coupons for specific course
  courseName?: string; // Name of the course for display purposes
  coursePrice?: number; // Price of the course for link generation
  showGlobalCoupons?: boolean; // If true, show global coupons (admin only)
  showAllCoupons?: boolean; // If true, show all coupons (admin only)
  showCreateButton?: boolean;
  title?: string;
  description?: string;
  onCouponsChange?: () => void; // Callback when coupons are modified
  hideCourseSelection?: boolean; // If true, hide course selection in form (for admin management)
}

export function CouponCodeManager({
  courseId = null,
  courseName,
  coursePrice = 0,
  showGlobalCoupons = false,
  showAllCoupons = false,
  showCreateButton = true,
  title,
  description,
  onCouponsChange,
  hideCourseSelection = false
}: CouponCodeManagerProps) {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<CouponCode | null>(null);

  const isAdmin = user?.userType === "Admin";
  const isInstructor = user?.userType === "Instructor";

  useEffect(() => {
    loadCoupons();
  }, [courseId, showGlobalCoupons, showAllCoupons]);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const allCoupons = await CouponService.getCouponCodes();
      
      // Filter coupons based on props and user role
      let filteredCoupons = allCoupons;

      if (showAllCoupons && isAdmin) {
        // Show all coupons for admin (no filtering)
        filteredCoupons = allCoupons;
      } else if (courseId) {
        // Show coupons for specific course
        filteredCoupons = allCoupons.filter(coupon => coupon.courseId === courseId);
      } else if (showGlobalCoupons && isAdmin) {
        // Show only global coupons for admin
        filteredCoupons = allCoupons.filter(coupon => coupon.isGlobal);
      } else if (isInstructor) {
        // Show only instructor's course-specific coupons
        filteredCoupons = allCoupons.filter(coupon => 
          !coupon.isGlobal && coupon.courseId // Only non-global coupons with course ID
        );
      }

      setCoupons(filteredCoupons);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast({
        title: "Error",
        description: "Failed to load coupon codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setFormOpen(true);
  };

  const handleEditCoupon = (coupon: CouponCode) => {
    setEditingCoupon(coupon);
    setFormOpen(true);
  };

  const handleDeleteCoupon = async (coupon: CouponCode) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;

    try {
      await CouponService.deleteCouponCode(couponToDelete.id);
      toast({
        title: "Success",
        description: "Coupon code deleted successfully",
      });
      loadCoupons(); // Reload the list
      onCouponsChange?.(); // Notify parent component
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: "Failed to delete coupon code",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const canEditCoupon = (coupon: CouponCode) => {
    if (isAdmin) return true;
    if (isInstructor) {
      // Instructors can only edit their own course coupons
      return !coupon.isGlobal && coupon.courseId;
    }
    return false;
  };

  const getDiscountDisplay = (coupon: CouponCode) => {
    switch (coupon.discountType) {
      case "percentage":
        return `${coupon.discountValue}% off`;
      case "fixed":
        return `${coupon.discountValue} EGP off`;
      case "setprice":
        return `Final price: ${coupon.discountValue} EGP`;
      case "free":
        return "Free";
      default:
        return `${coupon.discountValue}`;
    }
  };

  const getStatusBadge = (coupon: CouponCode) => {
    const isExpired = new Date(coupon.expirationDate) < new Date();
    const isUsedUp = coupon.usageLimit <= 0;

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isUsedUp) {
      return <Badge variant="destructive">Used Up</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getScopeBadge = (coupon: CouponCode) => {
    if (coupon.isGlobal) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Globe className="h-3 w-3 mr-1" />
          Global
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <BookOpen className="h-3 w-3 mr-1" />
        Course Specific
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {title || "Coupon Codes"}
              </CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            {showCreateButton && (
              <Button onClick={handleCreateCoupon} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {courseId && courseName ? (
            <Tabs defaultValue="manage" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manage">
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Coupons
                </TabsTrigger>
                <TabsTrigger value="links">
                  <Link className="h-4 w-4 mr-2" />
                  Create Links
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manage" className="mt-6">
                {renderCouponsTable()}
              </TabsContent>
              
              <TabsContent value="links" className="mt-6">
                <CouponLinkGenerator
                  courseId={courseId}
                  courseName={courseName}
                  coursePrice={coursePrice}
                />
              </TabsContent>
            </Tabs>
          ) : (
            renderCouponsTable()
          )}
        </CardContent>
      </Card>

      <CouponCodeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          loadCoupons();
          onCouponsChange?.();
        }}
        editingCoupon={editingCoupon}
        defaultCourseId={courseId}
        defaultCourseName={courseName}
        showGlobalOption={isAdmin}
        forceGlobal={showGlobalCoupons}
        hideCourseSelection={hideCourseSelection}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon code "{couponToDelete?.code}"? 
              This action cannot be undone and will permanently remove the coupon from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCoupon}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  // Helper function to render the coupons table
  function renderCouponsTable() {
    if (coupons.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No coupon codes found. 
            {showCreateButton && " Click 'Create Coupon' to add your first coupon code."}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Scope</TableHead>
              {showAllCoupons && <TableHead>Course</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">
                  {coupon.code}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CouponService.getDiscountTypeDisplay(coupon.discountType)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {getDiscountDisplay(coupon)}
                </TableCell>
                <TableCell>
                  {getScopeBadge(coupon)}
                </TableCell>
                {showAllCoupons && (
                  <TableCell>
                    {coupon.isGlobal ? (
                      <span className="text-muted-foreground italic">All Courses</span>
                    ) : (
                      <span className="text-sm">
                        {coupon.courseName || (coupon.courseId ? `Course ID: ${coupon.courseId}` : "Unknown Course")}
                      </span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {getStatusBadge(coupon)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-3 w-3" />
                    {coupon.usageLimit}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(coupon.expirationDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  {canEditCoupon(coupon) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditCoupon(coupon)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}
