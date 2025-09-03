// API Configuration - Centralized API URL settings

// Determine if we're running in a production environment
const isProduction = import.meta.env.PROD;

// Get API URL from environment variable or use fallback
const FALLBACK_API_URL = "https://elcentre-api.runasp.net";

// Production Vercel deployment URL for images
const PRODUCTION_URL = "https://elcentre-learn.vercel.app";

// Use environment URL if provided, otherwise use proxy in production for non-auth endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_HUB || (isProduction 
  ? "/api" 
  : FALLBACK_API_URL);

// Direct API URL for SignalR and operations that need direct access (bypassing proxy)
// SignalR WebSocket connections cannot go through Vercel proxy, so always use direct URL
export const DIRECT_API_URL = import.meta.env.VITE_API_BASE_URL || FALLBACK_API_URL;
export const DIRECT_API_URL_HUB = import.meta.env.VITE_API_BASE_URL_HUB || FALLBACK_API_URL;

// SignalR Configuration for rate limiting prevention
export const SIGNALR_CONFIG = {
  // Connection settings
  minConnectionInterval: isProduction ? 30000 : 15000, // 30s in prod, 15s in dev (increased significantly)
  maxReconnectAttempts: isProduction ? 3 : 5, // Reduced attempts to prevent rate limiting
  rateLimitRetryDelay: isProduction ? 300000 : 180000, // 5 minutes in prod, 3 minutes in dev (increased)
  
  // Monitoring settings - much less frequent to prevent 429 errors
  connectionCheckInterval: isProduction ? 120000 : 60000, // 2 minutes in prod, 1 minute in dev (significantly increased)
  
  // Transport preferences (prefer more stable transports in production)
  transportPriority: isProduction 
    ? ['WebSockets', 'ServerSentEvents', 'LongPolling']
    : ['WebSockets', 'LongPolling', 'ServerSentEvents'],
    
  // Recovery settings
  maxRecoveryAttempts: 3, // Reduced recovery attempts
  recoveryBaseDelay: isProduction ? 240000 : 120000, // 4 minutes in prod, 2 minutes in dev (increased)
  
  // New: API request batching and coordination
  batchNotificationRequests: true,
  notificationCheckInterval: isProduction ? 60000 : 30000, // 1 minute in prod, 30s in dev
  maxConcurrentApiRequests: 2, // Limit concurrent API requests
};

// For image URLs, we need to handle them differently in production vs development
export const getImageUrl = (path: string | undefined): string => {
  if (!path) return "/placeholder.svg";

  // Handle Google Drive links
  if (path.includes("drive.google.com")) {
    // If it's already in uc?export=view format
    if (path.includes("uc?export=view&id=")) {
      return path;
    }

    let fileId = "";

    // Format 1: https://drive.google.com/open?id=FILE_ID
    const openMatch = path.match(/open\?id=([^&]+)/);
    if (openMatch) {
      fileId = openMatch[1];
    }

    // Format 2: https://drive.google.com/file/d/FILE_ID/view or similar
    const fileMatch = path.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) {
      fileId = fileMatch[1];
    }

    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  // Non-Google-Drive URLs
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Avoid double prefix
  if (path.includes(FALLBACK_API_URL)) {
    return path;
  }

  const cleanPath = path.replace(/^\//, "");

  if (isProduction) {
    return `${PRODUCTION_URL}/api/${cleanPath}`;
  } else {
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
    return false;
  }
};

// Note: Using the API proxy in production to avoid mixed content issues
// Other API settings can be added here as needed