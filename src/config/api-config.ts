// API Configuration - Centralized API URL settings

// Access the environment variable or use fallback
// Using explicit check for undefined to handle empty string cases properly
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : "http://elcentre.runasp.net";

export const API_BASE_URL = apiBaseUrl;

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