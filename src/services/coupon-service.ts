import { apiRequest, apiFormRequest } from "./api";
import { 
  CouponCode, 
  CreateCouponCodeRequest, 
  UpdateCouponCodeRequest, 
  ApplyCouponRequest, 
  ApplyCouponResponse 
} from "@/types/coupon";

const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== null && value !== undefined) {
      if (Array.isArray(value) && value.every(item => item instanceof File)) {
        // Handle file arrays
        value.forEach(file => formData.append(key, file));
      } else if (value instanceof File) {
        // Handle single file
        formData.append(key, value);
      } else {
        // Handle primitive values
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const CouponService = {
  /**
   * Get all coupon codes (instructors and admins only)
   */
  getCouponCodes: async (): Promise<CouponCode[]> => {
    return apiRequest<CouponCode[]>("/CouponCode/get-coupon-codes", { method: "GET" }, true);
  },

  /**
   * Get coupon code by ID
   */
  getCouponCodeById: async (id: number): Promise<CouponCode> => {
    return apiRequest<CouponCode>(`/CouponCode/get-coupon-code/${id}`, { method: "GET" }, true);
  },

  /**
   * Create a new coupon code
   * Note: isGlobal will be set to false for instructors (handled by backend)
   */
  createCouponCode: async (request: CreateCouponCodeRequest): Promise<CouponCode> => {
    const formData = createFormData(request);
    return apiFormRequest<CouponCode>("/CouponCode/add-coupon-code", formData);
  },

  /**
   * Update an existing coupon code
   */
  updateCouponCode: async (request: UpdateCouponCodeRequest): Promise<CouponCode> => {
    const formData = createFormData(request);
    return apiFormRequest<CouponCode>("/CouponCode/update-coupon-code", formData, { method: "PUT" });
  },

  /**
   * Delete a coupon code by ID
   */
  deleteCouponCode: async (id: number): Promise<void> => {
    return apiRequest<void>(`/CouponCode/delete-coupon-code/${id}`, { method: "DELETE" }, true);
  },

  /**
   * Apply a coupon code to get the final price
   */
  applyCouponCode: async (code: string, courseId: number): Promise<ApplyCouponResponse> => {
    const url = `/CouponCode/apply-coupon-code?code=${encodeURIComponent(code)}&courseId=${courseId}`;
    return apiRequest<ApplyCouponResponse>(url, { method: "GET" }, true);
  },

  /**
   * Validate a coupon code and return formatted discount information
   */
  validateAndFormatCoupon: async (code: string, courseId: number, originalPrice: number): Promise<{
    isValid: boolean;
    finalPrice: number;
    discountAmount: number;
    errorMessage?: string;
  }> => {
    try {
      const response = await CouponService.applyCouponCode(code, courseId);
      
      if (response.statusCode === 200) {
        const finalPrice = parseFloat(response.message);
        const discountAmount = originalPrice - finalPrice;
        
        return {
          isValid: true,
          finalPrice,
          discountAmount,
        };
      } else {
        return {
          isValid: false,
          finalPrice: originalPrice,
          discountAmount: 0,
          errorMessage: "Invalid coupon code",
        };
      }
    } catch (error) {
      return {
        isValid: false,
        finalPrice: originalPrice,
        discountAmount: 0,
        errorMessage: error instanceof Error ? error.message : "Failed to validate coupon",
      };
    }
  },

  /**
   * Get discount type display text
   */
  getDiscountTypeDisplay: (type: string): string => {
    switch (type) {
      case 'percentage':
        return 'Percentage';
      case 'fixed':
        return 'Fixed Amount';
      case 'setprice':
        return 'Set Price';
      case 'free':
        return 'Free';
      default:
        return type;
    }
  },

  /**
   * Format discount value for display
   */
  formatDiscountValue: (type: string, value: number): string => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'fixed':
        return `$${value}`;
      case 'setprice':
        return `$${value}`;
      case 'free':
        return 'Free';
      default:
        return value.toString();
    }
  },

  /**
   * Check if coupon is expired
   */
  isExpired: (expirationDate: string): boolean => {
    return new Date(expirationDate) < new Date();
  },

  /**
   * Check if coupon has usage limit reached
   */
  isUsageLimitReached: (usageLimit: number): boolean => {
    return usageLimit <= 0;
  }
};
