import { MainLayout } from "@/components/layouts/main-layout";
import { CouponCodeManager } from "@/components/admin/coupon-code-manager";
import RequireAdminAuth from "@/components/auth/require-admin-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Globe, BookOpen, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { CouponService } from "@/services/coupon-service";
import type { CouponCode } from "@/types/coupon";

export default function AdminCouponManagement() {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const allCoupons = await CouponService.getCouponCodes();
      setCoupons(allCoupons);
    } catch (error) {
      console.error("Error loading coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const globalCoupons = coupons.filter(coupon => coupon.isGlobal);
  const activeCoupons = coupons.filter(coupon => {
    const isExpired = new Date(coupon.expirationDate) < new Date();
    const isUsedUp = coupon.usageLimit <= 0;
    return !isExpired && !isUsedUp;
  });
  const totalUsage = coupons.reduce((sum, coupon) => {
    // Assuming original usage limit minus current usage limit gives us total usage
    // This is a rough estimate - you might want to add a 'timesUsed' field to your API
    return sum + Math.max(0, coupon.usageLimit > 0 ? 0 : 0); // Placeholder - adjust based on your data structure
  }, 0);

  return (
    <RequireAdminAuth>
      <MainLayout>
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Coupon Code Management</h1>
            <p className="text-muted-foreground">
              Create and manage all coupon codes for discounts and promotions
            </p>
          </div>

          <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Global Coupons</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "-" : globalCoupons.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Can be applied to any course
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "-" : activeCoupons.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently valid coupons
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "-" : coupons.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All coupon codes created
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* All Coupons Table */}
            <CouponCodeManager
              showAllCoupons={true}
              title="All Coupon Codes" 
              description="Manage all global and course-specific coupon codes from one place"
              onCouponsChange={loadCoupons}
              hideCourseSelection={true}
            />
          </div>
        </div>
      </MainLayout>
    </RequireAdminAuth>
  );
}
