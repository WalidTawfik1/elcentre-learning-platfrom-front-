import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Copy, 
  ExternalLink, 
  Link, 
  CheckCircle,
  BookOpen,
  Tag,
  DollarSign,
  Percent,
  Gift,
  Globe
} from 'lucide-react';
import { CouponService } from '@/services/coupon-service';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/components/ui/use-toast';
import type { CouponCode } from '@/types/coupon';

interface CouponLinkGeneratorProps {
  courseId: number;
  courseName: string;
  coursePrice: number;
  onClose?: () => void;
}

export const CouponLinkGenerator: React.FC<CouponLinkGeneratorProps> = ({ 
  courseId, 
  courseName, 
  coursePrice,
  onClose 
}) => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState<string>('');
  const [selectedCoupon, setSelectedCoupon] = useState<CouponCode | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const isAdmin = user?.userType === "Admin";

  useEffect(() => {
    loadAvailableCoupons();
  }, [courseId]);

  useEffect(() => {
    if (selectedCouponCode) {
      const coupon = coupons.find(c => c.code === selectedCouponCode);
      setSelectedCoupon(coupon || null);
      generateLink(selectedCouponCode);
    } else {
      setSelectedCoupon(null);
      setGeneratedLink('');
    }
  }, [selectedCouponCode]);

  const loadAvailableCoupons = async () => {
    setIsLoading(true);
    try {
      const allCoupons = await CouponService.getCouponCodes();
      
      // Filter coupons based on user role
      const activeCoupons = allCoupons.filter(coupon => {
        const isNotExpired = !CouponService.isExpired(coupon.expirationDate);
        const hasUsageLeft = !CouponService.isUsageLimitReached(coupon.usageLimit);
        
        if (isAdmin) {
          // Admins can use both course-specific and global coupons for any course
          return isNotExpired && hasUsageLeft && (coupon.courseId === courseId || coupon.isGlobal);
        } else {
          // Instructors can only use course-specific coupons for their own courses
          return isNotExpired && hasUsageLeft && coupon.courseId === courseId && !coupon.isGlobal;
        }
      });
      
      setCoupons(activeCoupons);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      toast({
        title: "Error",
        description: "Failed to load available coupons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateLink = (couponCode: string) => {
    if (!couponCode) return;
    
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/courses/${courseId}?coupon=${encodeURIComponent(couponCode)}`;
    setGeneratedLink(link);
  };

  const calculateDiscountedPrice = (coupon: CouponCode): number => {
    switch (coupon.discountType) {
      case 'percentage':
        return Math.max(0, coursePrice - (coursePrice * coupon.discountValue / 100));
      case 'fixed':
        return Math.max(0, coursePrice - coupon.discountValue);
      case 'setprice':
        return coupon.discountValue;
      case 'free':
        return 0;
      default:
        return coursePrice;
    }
  };

  const getDiscountAmount = (coupon: CouponCode): number => {
    const discountedPrice = calculateDiscountedPrice(coupon);
    return coursePrice - discountedPrice;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      toast({
        title: "Link Copied!",
        description: "The promotional link has been copied to your clipboard.",
      });
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const openLinkInNewTab = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  };

  const getDiscountIcon = (discountType: string) => {
    switch (discountType) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <DollarSign className="h-4 w-4" />;
      case 'setprice':
        return <Tag className="h-4 w-4" />;
      case 'free':
        return <Gift className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Generate Promotional Link
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create a direct link for <strong>{courseName}</strong> with an applied coupon code
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {coupons.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            {isAdmin ? (
              <>
                <p>No active coupon codes available for this course.</p>
                <p className="text-xs mt-1">Create course-specific or global coupon codes to generate promotional links.</p>
              </>
            ) : (
              <>
                <p>No course-specific coupon codes available for this course.</p>
                <p className="text-xs mt-1">Create a course-specific coupon code first to generate promotional links.</p>
                <p className="text-xs text-blue-600 mt-2">Note: Global coupons are not available for instructors.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Coupon Selection */}
            <div className="space-y-2">
              <Label htmlFor="coupon-select">Select Coupon Code</Label>
              <Select value={selectedCouponCode} onValueChange={setSelectedCouponCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coupon code..." />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map(coupon => (
                    <SelectItem key={coupon.id} value={coupon.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{coupon.code}</span>
                        <Badge variant="outline" className="text-xs">
                          {getDiscountIcon(coupon.discountType)}
                          <span className="ml-1">
                            {CouponService.formatDiscountValue(coupon.discountType, coupon.discountValue)}
                          </span>
                        </Badge>
                        {coupon.isGlobal && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            <Globe className="h-3 w-3 mr-1" />
                            Global
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coupon Details */}
            {selectedCoupon && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Discount Preview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium">Original Price</p>
                    <p className="text-blue-900">{coursePrice} EGP</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Discounted Price</p>
                    <p className="text-blue-900 font-bold">
                      {calculateDiscountedPrice(selectedCoupon) === 0 ? 'FREE' : `${calculateDiscountedPrice(selectedCoupon)} EGP`}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Discount Amount</p>
                    <p className="text-green-600 font-bold">-{getDiscountAmount(selectedCoupon)} EGP</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium">Remaining Uses</p>
                    <p className="text-blue-900">{selectedCoupon.usageLimit}</p>
                  </div>
                </div>
                
                {selectedCoupon.isGlobal && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                    <Globe className="h-4 w-4" />
                    <span>This is a global coupon that works on all courses</span>
                  </div>
                )}
              </div>
            )}

            {/* Generated Link */}
            {generatedLink && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Generated Promotional Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={generatedLink} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={copyToClipboard}
                      variant="outline"
                      className={`flex-shrink-0 ${isCopied ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={openLinkInNewTab}
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Link
                    </Button>
                  </div>
                </div>

                {/* Usage Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">How it works:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Students clicking this link will see the discounted price automatically</li>
                    <li>• The {selectedCoupon?.isGlobal ? 'global' : 'course-specific'} coupon code will be pre-applied during checkout</li>
                    <li>• {calculateDiscountedPrice(selectedCoupon!) === 0 ? 'Students will be enrolled immediately for free' : 'Students can complete payment with the discount applied'}</li>
                    <li>• Each use of this link will count towards the coupon usage limit</li>
                    {selectedCoupon?.isGlobal ? (
                      <li>• This global coupon can be used on any course</li>
                    ) : (
                      <li>• This coupon only works for this specific course</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
