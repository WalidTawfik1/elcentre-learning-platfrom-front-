// API Configuration - Centralized API URL settings

// Determine if we're running in a production environment
const isProduction = import.meta.env.PROD;

// The original API URL that should be used for direct connections when in development
const ORIGIN_API_URL = "http://elcentre.runasp.net";

// Use relative URL in production (for Vercel proxy) and direct URL in development
export const API_BASE_URL = isProduction 
  ? "/api" 
  : (import.meta.env.VITE_API_BASE_URL || ORIGIN_API_URL);

// Direct API URL for images and auth operations that might need direct access
export const DIRECT_API_URL = isProduction
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL || ORIGIN_API_URL);

// For image URLs, need direct access in both environments
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder.svg";
  
  // If it's already a full URL, use it as is
  if (path.startsWith('http')) return path;
  
  // Use the appropriate URL based on environment
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

// Note: Using the API proxy in production to avoid mixed content issues
// Other API settings can be added here as needed