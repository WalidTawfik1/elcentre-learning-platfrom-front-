import { apiRequest } from "./api";

export interface PaymentMethod {
  value: 'card' | 'wallet';
  label: string;
  description: string;
}

export interface CreatePaymentTokenRequest {
  courseId: number;
  paymentMethod: 'card' | 'wallet';
  couponCode?: string;
}

export interface CreatePaymentTokenResponse {
  redirectUrl: string;
}

export const PaymentService = {  /**
   * Create payment token for course enrollment
   */
  createPaymentToken: async (request: CreatePaymentTokenRequest): Promise<CreatePaymentTokenResponse> => {
    
    let url = `/Payment/create-payment-token?courseID=${request.courseId}&paymentMethod=${request.paymentMethod}`;
    
    // Add coupon code if provided
    if (request.couponCode) {
      url += `&couponCode=${encodeURIComponent(request.couponCode)}`;
    }
    
    return apiRequest<CreatePaymentTokenResponse>(
      url, 
      {
        method: 'POST',
      }, 
      true
    );
  },

  /**
   * Get available payment methods
   */
  getPaymentMethods: (): PaymentMethod[] => {
    return [
      {
        value: 'card',
        label: 'Credit/Debit Card',
        description: 'Pay with your credit or debit card'
      },
      {
        value: 'wallet',
        label: 'Mobile Wallet',
        description: 'Pay with your mobile wallet'
      }
    ];
  },

  /**
   * Open payment URL in a new window
   */
  openPaymentWindow: (redirectUrl: string): Window | null => {
    const paymentWindow = window.open(
      redirectUrl,
      'paymob_payment',
      'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no'
    );
    
    return paymentWindow;
  }
};
