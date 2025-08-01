// Coupon Code related types
export type DiscountType = 'percentage' | 'fixed' | 'setprice' | 'free';

export interface CouponCode {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expirationDate: string;
  usageLimit: number;
  isGlobal: boolean;
  courseId: number | null;
  courseName?: string | null;
}

export interface CreateCouponCodeRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expirationDate: string;
  usageLimit: number;
  isGlobal: boolean;
  courseId: number | null;
  courseName?: string | null;
}

export interface UpdateCouponCodeRequest extends CreateCouponCodeRequest {
  id: number;
}

export interface ApplyCouponRequest {
  code: string;
  courseId: number;
}

export interface ApplyCouponResponse {
  statusCode: number;
  message: string; // Final price as string
}
