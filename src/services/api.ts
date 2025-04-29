import { toast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config/api-config";

// Configuration for rate limiting and retries
const API_CONFIG = {
  maxRetries: 3,             // Maximum number of retry attempts
  initialBackoffMs: 1000,    // Start with 1 second delay
  maxBackoffMs: 10000,       // Maximum delay of 10 seconds
  backoffFactor: 2,          // Double the delay on each retry
  retryStatusCodes: [429]    // Status codes that should trigger a retry
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

// Helper function to sleep for a specified number of milliseconds
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Calculate backoff time using exponential backoff algorithm
const calculateBackoff = (attempt: number): number => {
  const backoff = Math.min(
    API_CONFIG.maxBackoffMs,
    API_CONFIG.initialBackoffMs * Math.pow(API_CONFIG.backoffFactor, attempt)
  );
  // Add some randomness (jitter) to prevent synchronized retries
  return Math.floor(backoff * (0.8 + Math.random() * 0.4));
};

// Check if JWT cookie exists
const hasJwtCookie = () => {
  return document.cookie.includes('jwt=');
};

// Get JWT token from cookie
const getJwtToken = () => {
  return getCookie('jwt');
};

// Generic request handler with improved error management and retry logic
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
  
  // Initialize retry counter
  let retryCount = 0;
  let lastError: any = null;

  // Keep trying while we have retries left
  while (retryCount <= API_CONFIG.maxRetries) {
    try {
      // If this is a retry, add a delay with exponential backoff
      if (retryCount > 0) {
        const backoffMs = calculateBackoff(retryCount - 1);
        console.log(`Rate limited (429). Retry ${retryCount}/${API_CONFIG.maxRetries} after ${backoffMs}ms delay`);
        await sleep(backoffMs);
      }
      
      // Debug output for authentication tracking (first attempt only)
      if (retryCount === 0) {
        console.log(`API Request: ${endpoint}`, { 
          requiresAuth,
          hasJwtCookie: hasJwtCookie(),
          hasToken: !!jwtToken,
          method: mergedOptions.method || 'GET'
        });
      }
      
      const response = await fetch(url, mergedOptions);
      
      // Check if we got a rate limit error (429) and should retry
      if (response.status === 429 && retryCount < API_CONFIG.maxRetries) {
        retryCount++;
        continue;
      }
      
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
        } else if (response.status !== 429 || retryCount >= API_CONFIG.maxRetries) {
          // Only show error toast if not a rate limit we're retrying
          toast({
            title: "API Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        if (response.status !== 429 || retryCount >= API_CONFIG.maxRetries) {
          throw new Error(errorMessage);
        } else {
          // For 429, we'll retry in the next loop iteration
          retryCount++;
          continue;
        }
      }
      
      // For 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Only retry network errors, not application errors
      if (!(error instanceof TypeError) || retryCount >= API_CONFIG.maxRetries) {
        break;
      }
      
      retryCount++;
    }
  }
  
  // If we get here, all retries have failed
  console.error(`API request failed after ${retryCount} retries:`, lastError);
  
  // Don't show generic network errors for profile fetch
  if (!endpoint.includes("/Account/profile")) {
    // Create a more user-friendly error message
    let errorMessage = "Network error. Please check your connection or verify API server is accessible.";
    if (lastError instanceof Error) {
      errorMessage = lastError.message;
    }
    
    toast({
      title: "Request Failed",
      description: errorMessage,
      variant: "destructive",
    });
  }
  
  throw lastError || new Error(`Request failed after ${retryCount} retries`);
}

// Multipart form data request (for file uploads) with retry mechanism
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

  // Initialize retry counter
  let retryCount = 0;
  let lastError: any = null;

  // Keep trying while we have retries left
  while (retryCount <= API_CONFIG.maxRetries) {
    try {
      // If this is a retry, add a delay with exponential backoff
      if (retryCount > 0) {
        const backoffMs = calculateBackoff(retryCount - 1);
        console.log(`Rate limited (429). Retry ${retryCount}/${API_CONFIG.maxRetries} after ${backoffMs}ms delay`);
        await sleep(backoffMs);
      }
      
      // Debug output (first attempt only)
      if (retryCount === 0) {
        console.log(`Making API form request to: ${url}`, {
          hasJwtCookie: hasJwtCookie(),
          hasToken: !!jwtToken
        });
      }
      
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      // Check if we got a rate limit error and should retry
      if (response.status === 429 && retryCount < API_CONFIG.maxRetries) {
        retryCount++;
        continue;
      }
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
        } catch {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        
        // Only show toast if not rate limiting or if we've exhausted retries
        if (response.status !== 429 || retryCount >= API_CONFIG.maxRetries) {
          toast({
            title: "API Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw new Error(errorMessage);
        } else {
          // For 429, retry in the next iteration
          retryCount++;
          continue;
        }
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Only retry network errors, not application errors
      if (!(error instanceof TypeError) || retryCount >= API_CONFIG.maxRetries) {
        break;
      }
      
      retryCount++;
    }
  }
  
  // If we get here, all retries have failed
  console.error(`API form request failed after ${retryCount} retries:`, lastError);
  
  let errorMessage = "Network error. Please check your connection or verify API server is accessible.";
  if (lastError instanceof Error) {
    errorMessage = lastError.message;
  }
  
  toast({
    title: "Request Failed",
    description: errorMessage,
    variant: "destructive",
  });
  
  throw lastError || new Error(`Form request failed after ${retryCount} retries`);
}
