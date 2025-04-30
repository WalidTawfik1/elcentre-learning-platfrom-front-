// API Configuration - Centralized API URL settings

// Determine if we're running in a production environment
const isProduction = import.meta.env.PROD;

// The original API URL that should be used for direct connections
const ORIGIN_API_URL = "http://elcentre.runasp.net";

// Base API URL with environment-specific handling for API requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ORIGIN_API_URL;

// Direct API URL for images and auth operations that need to bypass the proxy
export const DIRECT_API_URL = import.meta.env.VITE_API_BASE_URL || ORIGIN_API_URL;

// For image URLs, need direct access in both environments
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder.svg";
  
  // If it's already a full URL, use it as is
  if (path.startsWith('http')) return path;
  
  // Always use direct URL for images to avoid CORS issues
  return `${DIRECT_API_URL}/${path.replace(/^\//, '')}`;
};

// Helper function to check if the API is reachable 
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/ping`, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('API connection check failed:', error);
    return false;
  }
};

// Note: Using HTTP as required by the server configuration
// Other API settings can be added here as needed