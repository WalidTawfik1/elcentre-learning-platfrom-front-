// API Configuration - Centralized API URL settings

// Determine if we're running in a production environment (like Vercel)
const isProduction = import.meta.env.PROD;
const baseApiUrl = import.meta.env.VITE_API_BASE_URL || "http://elcentre.runasp.net";

// In production (Vercel), use our API proxy to avoid CORS issues with HTTP endpoints
// In development, use the direct API URL
export const API_BASE_URL = isProduction 
  ? `/api/proxy?url=${encodeURIComponent(baseApiUrl)}`
  : baseApiUrl;

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