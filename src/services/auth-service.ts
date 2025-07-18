import { apiRequest } from "./api";
import { LoginDTO, RegisterDTO, UserDTO } from "@/types/api";
import { DIRECT_API_URL } from "@/config/api-config";

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

// Direct API fetch function for auth operations
const directApiRequest = async <T>(endpoint: string, options: RequestInit = {}, requiresAuth = false): Promise<T> => {
  // Construct the full URL with the direct API URL
  const url = `${DIRECT_API_URL}${endpoint}`;
  
  // Set default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Add authorization header if required and token exists
  if (requiresAuth) {
    const token = getCookie('jwt');
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Merge provided options with defaults
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    },
    credentials: 'include', // Always include credentials for auth operations
    mode: 'cors'
  };
  try {
    const response = await fetch(url, requestOptions);
    
    // Extract JWT token from response headers if available
    const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenFromHeader = authHeader.substring(7);
      setCookie('jwt', tokenFromHeader, 7);
    }
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        
        // Extract error message from various possible formats
        let errorMessage = '';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = `API Error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      } catch (e) {
        // If e is already our custom error, re-throw it
        if (e instanceof Error && e.message !== `API Error: ${response.status}`) {
          throw e;
        }
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
    }
      // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const AuthService = {
  login: async (credentials: LoginDTO): Promise<any> => {
    try {
      // Use direct API connection for login to ensure cookies are set properly
      const response = await directApiRequest<any>("/Account/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      }, false);
      
      // Check for token in response and manually set it as a cookie if needed
      if (response) {
        // Try to extract token from multiple possible locations in the response
        let token = null;
        
        // Check common locations where the token might be
        if (typeof response === 'string') {
          // Sometimes backend returns the token directly as a string
          token = response;
        } else {
          // Look in various possible properties
          token = response.message || 
                  response.token || 
                  response.accessToken || 
                  response.jwt ||
                  response.access_token ||
                  (response.data && (
                    response.data.token || 
                    response.data.accessToken ||
                    response.data.jwt
                  ));
        }
          if (token) {
          // Remove any existing token cookie that might be present
          document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          // Set the JWT as a cookie that expires in 7 days
          setCookie('jwt', token, 7);
        }
      }
      
      return response;
    } catch (error) {
      // Handle account not verified error
      if (error.name === 'ACCOUNT_NOT_VERIFIED') {
        // Store the email in sessionStorage so the verification page can use it
        if (credentials.email) {
          sessionStorage.setItem('unverifiedEmail', credentials.email);
        }
        
        // Redirect to verification page
        window.location.href = '/verify-account';
        
        // Return a clear error for handling in the UI
        return Promise.reject({
          isUnverified: true,
          message: error.message || 'Account not verified. Please verify your account.'
        });
      }
      
      // Re-throw other errors
      return Promise.reject(error);
    }
  },
  
  register: async (userData: RegisterDTO): Promise<any> => {
    // Use direct API connection for registration
    return directApiRequest<any>("/Account/register", {
      method: "POST",
      body: JSON.stringify(userData)
    }, false);
  },
  
  activeAccount: async (email: string, code: string): Promise<any> => {
    return apiRequest<any>("/Account/active-account", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }, false);
  },
    logout: async (): Promise<any> => {
    // Import SignalR service here to avoid circular dependencies
    const { signalRService } = await import('./signalr-service');
    
    // Disconnect SignalR before logout
    signalRService.forceDisconnect();
    
    const response = await apiRequest<any>("/Account/logout", {
      method: "POST",
      credentials: "include"
    }, true);
    
    // Clear client-side auth state if needed
    return response;
  },
    getProfile: async (): Promise<UserDTO> => {
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

  updateProfileWithPicture: async (userData: UserDTO, profilePicture?: File): Promise<any> => {
    const formData = new FormData();
    
    // Add user data fields (always send as FormData since backend expects it)
    formData.append('firstName', userData.firstName);
    formData.append('lastName', userData.lastName);
    formData.append('phoneNumber', userData.phoneNumber);
    formData.append('country', userData.country);
    formData.append('gender', userData.gender);
    formData.append('dateOfBirth', userData.dateOfBirth);
    if (userData.bio) {
      formData.append('bio', userData.bio);
    }
    
    // Add profile picture only if provided (backend will keep existing if null)
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }
    // Note: If no profilePicture is provided, we don't add the field at all
    // Your backend will handle this case by keeping the existing profile picture

    // Use direct API request for form data
    const url = `${DIRECT_API_URL}/Account/edit-profile`;
    return fetch(url, {
      method: "PUT",
      body: formData,
      credentials: "include",
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${getCookie('jwt')}`,
      }
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }
      return response.json();
    });
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
  },
  
  // Debug function to check auth state
  checkAuthState: (): { hasToken: boolean; tokenValue: string | null; isExpired: boolean } => {
    const token = getCookie('jwt');
    const hasToken = !!token;
    let isExpired = false;
    
    if (token) {
      try {
        // Simple check - if token looks like JWT, try to decode the payload (without verification)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          isExpired = payload.exp && payload.exp < currentTime;
        }
      } catch (error) {
        console.warn('Could not decode JWT token:', error);
      }
    }
    
    return { hasToken, tokenValue: token, isExpired };
  },

  // Google authentication methods
  googleLogin: () => {
    const googleAuthUrl = `${DIRECT_API_URL}/Account/google-login`;
    window.location.href = googleAuthUrl;
  },

  googleRegister: (role: string) => {
    const googleAuthUrl = `${DIRECT_API_URL}/Account/google-login?role=${encodeURIComponent(role)}`;
    window.location.href = googleAuthUrl;
  },
  
};
