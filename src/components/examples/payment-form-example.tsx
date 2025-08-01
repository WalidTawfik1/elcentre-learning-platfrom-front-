import React, { useState } from 'react';
import { CouponCodeInput } from '@/components/ui/coupon-code-input';

/**
 * Example usage of the CouponCodeInput component
 * This shows how to integrate the coupon functionality into any payment form
 */
export function PaymentFormExample() {
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    finalPrice: number;
    discountAmount: number;
  } | null>(null);

  const courseId = 123; // Your course ID
  const originalPrice = 99.99; // Original course price

  const handleCouponApplied = (couponCode: string, finalPrice: number, discountAmount: number) => {
    setAppliedCoupon({
      code: couponCode,
      finalPrice,
      discountAmount
    });
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const handlePayment = () => {
    // When making the payment, pass the coupon code if applied
    const paymentData = {
      courseId,
      paymentMethod: 'card' as const,
      couponCode: appliedCoupon?.code // Include this in your payment request
    };

    // PaymentService.createPaymentToken(paymentData);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Course Payment</h2>
      
      {/* Coupon Code Input */}
      <CouponCodeInput
        courseId={courseId}
        originalPrice={originalPrice}
        onCouponApplied={handleCouponApplied}
        onCouponRemoved={handleCouponRemoved}
        appliedCoupon={appliedCoupon}
      />

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
      >
        Pay ${appliedCoupon?.finalPrice.toFixed(2) || originalPrice.toFixed(2)}
      </button>
    </div>
  );
}
