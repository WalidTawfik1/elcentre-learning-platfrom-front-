import { apiRequest } from "./api";
import { LoginDTO, RegisterDTO, UserDTO } from "@/types/api";

// Helper function to set a cookie with expiration
const setCookie = (name: string, value: string, days = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
};

// Helper function to get a cookie value
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

export const AuthService = {
  login: async (credentials: LoginDTO): Promise<any> => {
    // Login doesn't need authentication, but we want credentials included for cookies
    const response = await apiRequest<any>("/Account/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      credentials: "include" // Ensure cookies are stored
    }, false);
    
    // Check for token in response and manually set it as a cookie if needed
    if (response) {
      // Extract token from various possible locations, primarily from message field
      const token = response.message || response.token || response.accessToken || response.jwt;
      
      if (token) {
        // Remove any existing token cookie that might be present
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // Set only the JWT as a cookie that expires in 7 days
        setCookie('jwt', token, 7);
      }
    }
    
    // Debug cookie
    setTimeout(() => {
      console.log("Checking for JWT cookie after login:", 
        document.cookie.includes('jwt=') ? "Found" : "Not found",
        "Cookie value:", getCookie('jwt')?.substring(0, 10) + "...");
    }, 300);
    
    return response;
  },
  
  register: async (userData: RegisterDTO): Promise<any> => {
    return apiRequest<any>("/Account/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }, false);
  },
  
  activeAccount: async (email: string, code: string): Promise<any> => {
    return apiRequest<any>("/Account/active-account", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }, false);
  },
  
  logout: async (): Promise<any> => {
    const response = await apiRequest<any>("/Account/logout", {
      method: "POST",
      credentials: "include"
    }, true);
    
    // Clear client-side auth state if needed
    return response;
  },
  
  getProfile: async (): Promise<UserDTO> => {
    // Debug JWT cookie presence
    console.log("JWT cookie present before profile fetch:", 
      document.cookie.includes('jwt='));
    
    return apiRequest<UserDTO>("/Account/profile", {
      credentials: "include" // Explicitly include credentials
    }, true);
  },
  
  updateProfile: async (userData: UserDTO): Promise<any> => {
    return apiRequest<any>("/Account/edit-profile", {
      method: "PUT",
      body: JSON.stringify(userData),
      credentials: "include"
    }, true);
  },
  
  verifyOTP: async (email: string, code: string): Promise<any> => {
    return apiRequest<any>("/Account/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }, false);
  },
  
  resendOTP: async (email: string): Promise<any> => {
    return apiRequest<any>("/Account/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, false);
  },
  
  requestPasswordReset: async (email: string): Promise<any> => {
    return apiRequest<any>(`/Account/send-email-forget-password?email=${encodeURIComponent(email)}`);
  },
  
  resetPassword: async (email: string, password: string, code: string): Promise<any> => {
    return apiRequest<any>("/Account/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, password, code }),
    }, false);
  },
  
  // Helper method to check if JWT cookie is present
  hasAuthCookie: (): boolean => {
    return document.cookie.includes('jwt=');
  },
  
  // Get the JWT token from cookie
  getAuthToken: (): string | null => {
    return getCookie('jwt');
  }
};
