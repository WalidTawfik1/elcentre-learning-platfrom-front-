
import { toast } from "@/components/ui/use-toast";

// Updated API URL with HTTP protocol (not HTTPS)
const API_BASE_URL = "http://elcentre.runasp.net";

// Generic request handler with error management
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Include credentials to manage cookies
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
    
    // For 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    
    // Create a more user-friendly error message
    let errorMessage = "Network error. Please check your connection.";
    if (error instanceof Error) {
      errorMessage = error.message;
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    // For development, throw a more detailed error
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
    credentials: "include",
    method: "POST",
    body: formData,
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`;
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
    
    let errorMessage = "Network error. Please check your connection.";
    if (error instanceof Error) {
      errorMessage = error.message;
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    throw error;
  }
}
