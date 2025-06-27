// API Configuration - Centralized API URL settings

// Determine if we're running in a production environment
const isProduction = import.meta.env.PROD;

// Get API URL from environment variable or use fallback
const FALLBACK_API_URL = "https://elcentre-api.runasp.net";

// Production Vercel deployment URL for images
const PRODUCTION_URL = "https://elcentre-learn.vercel.app";

// Use relative URL in production (for Vercel proxy) and environment/fallback URL in development
export const API_BASE_URL = isProduction 
  ? "/api" 
  : (import.meta.env.VITE_API_BASE_URL || FALLBACK_API_URL);

// Direct API URL for SignalR and operations that need direct access (bypassing proxy)
// SignalR WebSocket connections cannot go through Vercel proxy, so always use direct URL
export const DIRECT_API_URL = import.meta.env.VITE_API_BASE_URL || FALLBACK_API_URL;

// For image URLs, we need to handle them differently in production vs development
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder.svg";
  
  // If it's a complete URL, return it directly
  if (path.startsWith('http')) {
    return path;
  }
    // If it already contains our API URL, don't double-prefix it
  if (path.includes(FALLBACK_API_URL)) {
    return path;
  }
  
  // Clean the path - remove any leading slashes
  const cleanPath = path.replace(/^\//, '');
  
  if (isProduction) {
    // In production, all images go through the Vercel proxy
    return `${PRODUCTION_URL}/api/${cleanPath}`;  } else {
    // In local development, use the direct API URL
    return `${FALLBACK_API_URL}/${cleanPath}`;
  }
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