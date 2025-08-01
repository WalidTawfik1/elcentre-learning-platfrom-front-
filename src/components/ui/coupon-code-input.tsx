import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X, Check } from "lucide-react";
import { CouponService } from "@/services/coupon-service";

interface CouponCodeInputProps {
  courseId: number;
  originalPrice: number;
  onCouponApplied: (couponCode: string, finalPrice: number, discountAmount: number) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: {
    code: string;
    finalPrice: number;
    discountAmount: number;
  };
  disabled?: boolean;
}

export function CouponCodeInput({
  courseId,
  originalPrice,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  disabled = false
}: CouponCodeInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const result = await CouponService.validateAndFormatCoupon(
        couponCode.trim(),
        courseId,
        originalPrice
      );

      if (result.isValid) {
        onCouponApplied(couponCode.trim(), result.finalPrice, result.discountAmount);
        setCouponCode("");
      } else {
        setError(result.errorMessage || "Invalid coupon code");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to apply coupon code");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode("");
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-green-800">Coupon Applied!</div>
              <div className="text-sm text-green-600">
                Code: {appliedCoupon.code}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            disabled={disabled}
            className="text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Original Price:</span>
            <span>{originalPrice.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount:</span>
            <span>-{appliedCoupon.discountAmount.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Final Price:</span>
            <span>{appliedCoupon.finalPrice.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="coupon-code" className="flex items-center space-x-2">
          <Tag className="h-4 w-4" />
          <span>Coupon Code (Optional)</span>
        </Label>
        <div className="flex space-x-2">
          <Input
            id="coupon-code"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={disabled || isApplying}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleApplyCoupon}
            disabled={disabled || isApplying || !couponCode.trim()}
            className="min-w-[80px]"
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Price:</span>
          <span>{originalPrice.toFixed(2)} EGP</span>
        </div>
      </div>
    </div>
  );
}
