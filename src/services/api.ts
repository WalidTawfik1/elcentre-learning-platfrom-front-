import { toast } from "@/components/ui/use-toast";

// API URL with HTTP protocol
const API_BASE_URL = "http://elcentre.runasp.net";

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

// Check if JWT cookie exists
const hasJwtCookie = () => {
  return document.cookie.includes('jwt=');
};

// Get JWT token from cookie
const getJwtToken = () => {
  return getCookie('jwt');
};

// Generic request handler with improved error management
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Configure request options with proper CORS settings
  const defaultOptions: RequestInit = {
    credentials: "include", // Always include credentials for cookie-based auth
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
  };

  // Add Authorization header with JWT token if we have one in the cookie
  const jwtToken = getJwtToken();
  if (requiresAuth && jwtToken) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      "Authorization": `Bearer ${jwtToken}`,
    };
  }

  const mergedOptions = { ...defaultOptions, ...options };
  
  // Debug output for authentication tracking
  console.log(`API Request: ${endpoint}`, { 
    requiresAuth,
    hasJwtCookie: hasJwtCookie(),
    hasToken: !!jwtToken,
    method: mergedOptions.method || 'GET'
  });
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
      } catch {
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      
      // Handle authentication errors
      if (response.status === 401 && requiresAuth) {
        console.error("Authentication error:", errorMessage);
        // Don't show toast for /profile endpoint when not logged in
        if (!endpoint.includes("/Account/profile")) {
          toast({
            title: "Authentication Error",
            description: "Please log in to continue",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "API Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      throw new Error(errorMessage);
    }
    
    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    
    // Don't show generic network errors for profile fetch
    if (!endpoint.includes("/Account/profile")) {
      // Create a more user-friendly error message
      let errorMessage = "Network error. Please check your connection or verify API server is accessible.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    throw error;
  }
}

// Multipart form data request (for file uploads)
export async function apiFormRequest<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Don't set Content-Type header for multipart/form-data
  // Browser will set it automatically with boundary
  const defaultOptions: RequestInit = {
    credentials: "include", // Always include credentials for cookie-based auth
    mode: "cors",
    method: "POST",
    body: formData,
  };

  // Add Authorization header with JWT token if we have one in the cookie
  const jwtToken = getJwtToken();
  if (jwtToken) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      "Authorization": `Bearer ${jwtToken}`,
    };
  }

  try {
    console.log(`Making API form request to: ${url}`, {
      hasJwtCookie: hasJwtCookie(),
      hasToken: !!jwtToken
    });
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
      } catch {
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API form request failed:", error);
    
    let errorMessage = "Network error. Please check your connection or verify API server is accessible.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Request Failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    throw error;
  }
}
