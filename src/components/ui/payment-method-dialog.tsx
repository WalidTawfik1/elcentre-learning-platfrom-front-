import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Loader2 } from "lucide-react";
import { PaymentMethod } from "@/services/payment-service";
import { CouponCodeInput } from "@/components/ui/coupon-code-input";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethods: PaymentMethod[];
  onPaymentMethodSelected: (method: 'card' | 'wallet', couponCode?: string) => void;
  isLoading?: boolean;
  courseTitle?: string;
  coursePrice?: number;
  courseId?: number;
  preAppliedCoupon?: string; // Add this prop for URL-based coupons
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  paymentMethods,
  onPaymentMethodSelected,
  isLoading = false,
  courseTitle,
  coursePrice,
  courseId,
  preAppliedCoupon
}: PaymentMethodDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet'>('card');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    finalPrice: number;
    discountAmount: number;
  } | null>(null);
  const [finalPrice, setFinalPrice] = useState(coursePrice || 0);

  const handleProceed = () => {
    onPaymentMethodSelected(selectedMethod, appliedCoupon?.code);
  };

  const handleCouponApplied = (couponCode: string, newFinalPrice: number, discountAmount: number) => {
    setAppliedCoupon({
      code: couponCode,
      finalPrice: newFinalPrice,
      discountAmount
    });
    setFinalPrice(newFinalPrice);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setFinalPrice(coursePrice || 0);
  };

  const getIcon = (method: 'card' | 'wallet') => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            {courseTitle && (
              <span>
                Complete your enrollment for <strong>{courseTitle}</strong> 
                {" "}({finalPrice.toFixed(2)} EGP)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coupon Code Section */}
          {courseId && coursePrice && (
            <div className="border-b pb-4">
              <CouponCodeInput
                courseId={courseId}
                originalPrice={coursePrice}
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
                appliedCoupon={appliedCoupon}
                disabled={isLoading}
                preAppliedCoupon={preAppliedCoupon}
              />
            </div>
          )}

          {/* Payment Method Selection - Only show if final price > 0 */}
          {finalPrice > 0 && (
            <RadioGroup 
              value={selectedMethod} 
              onValueChange={(value) => setSelectedMethod(value as 'card' | 'wallet')}
              className="space-y-3"
            >
              {paymentMethods.map((method) => (
                <Label 
                  key={method.value}
                  htmlFor={method.value} 
                  className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === method.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMethod(method.value)}
                >
                  <RadioGroupItem value={method.value} id={method.value} />
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    {getIcon(method.value)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{method.label}</div>
                    <div className="text-sm text-muted-foreground">{method.description}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          )}

          {/* Free enrollment message */}
          {finalPrice === 0 && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800 font-medium">🎉 This course is now free!</div>
              <div className="text-green-600 text-sm mt-1">
                Click "Enroll for Free" to start learning immediately.
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProceed}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : finalPrice === 0 ? (
                "Enroll for Free"
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
