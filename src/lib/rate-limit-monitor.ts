// Rate Limit Error Monitoring and Logging System

interface RateLimitError {
  timestamp: number;
  endpoint: string;
  method: string;
  userAgent: string;
  userId?: string;
  retryCount: number;
  stackTrace?: string;
}

interface RateLimitStats {
  totalErrors: number;
  errorsLast24h: number;
  errorsLastHour: number;
  mostFrequentEndpoints: Array<{ endpoint: string; count: number }>;
  peakTimes: Array<{ hour: number; count: number }>;
}

class RateLimitMonitor {
  private errors: RateLimitError[] = [];
  private readonly maxStoredErrors = 1000;
  private readonly storageKey = 'rate_limit_errors';

  constructor() {
    this.loadFromStorage();
    this.setupGlobalErrorHandler();
  }

  /**
   * Load existing errors from localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.errors = JSON.parse(stored);
        // Clean old errors (older than 7 days)
        this.cleanOldErrors();
      }
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Save errors to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.errors));
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Clean errors older than 7 days
   */
  private cleanOldErrors() {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.errors = this.errors.filter(error => error.timestamp > sevenDaysAgo);
    
    // Keep only the most recent errors if we have too many
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }
  }

  /**
   * Set up global error handler for network requests
   */
  private setupGlobalErrorHandler() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (response.status === 429) {
          this.logRateLimitError(args[0], 'GET', 0);
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('429') || event.reason?.status === 429) {
        this.logRateLimitError('unknown', 'unknown', 0);
      }
    });
  }

  /**
   * Log a rate limit error
   */
  logRateLimitError(
    endpoint: string | URL | Request,
    method: string,
    retryCount: number,
    additionalInfo?: any
  ) {
    const error: RateLimitError = {
      timestamp: Date.now(),
      endpoint: this.extractEndpoint(endpoint),
      method: method.toUpperCase(),
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      retryCount,
      stackTrace: new Error().stack
    };

    this.errors.push(error);
    this.cleanOldErrors();
    this.saveToStorage();

    // Send to analytics in production (if configured)
    if (import.meta.env.PROD) {
      this.sendToAnalytics(error);
    }
  }

  /**
   * Extract endpoint from various input types
   */
  private extractEndpoint(input: string | URL | Request): string {
    if (typeof input === 'string') {
      return this.sanitizeEndpoint(input);
    } else if (input instanceof URL) {
      return this.sanitizeEndpoint(input.pathname);
    } else if (input instanceof Request) {
      return this.sanitizeEndpoint(input.url);
    }
    return 'unknown';
  }

  /**
   * Remove sensitive information from endpoint
   */
  private sanitizeEndpoint(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      // Remove query parameters that might contain sensitive data
      const path = urlObj.pathname;
      // Replace dynamic IDs with placeholders
      return path.replace(/\/\d+/g, '/{id}');
    } catch {
      return url;
    }
  }

  /**
   * Get current user ID if available
   */
  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user ID from various sources
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id?.toString();
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Send error data to analytics (implement based on your analytics provider)
   */
  private sendToAnalytics(error: RateLimitError) {
    // Example implementation - replace with your analytics provider
    try {
      // Google Analytics, Mixpanel, etc.
      if ((window as any).gtag) {
        (window as any).gtag('event', 'rate_limit_error', {
          endpoint: error.endpoint,
          method: error.method,
          retry_count: error.retryCount,
          user_id: error.userId
        });
      }
    } catch (analyticsError) {
      // Silent error handling
    }
  }

  /**
   * Get statistics about rate limit errors
   */
  getStats(): RateLimitStats {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const errorsLast24h = this.errors.filter(e => e.timestamp > last24h);
    const errorsLastHour = this.errors.filter(e => e.timestamp > lastHour);

    // Count errors by endpoint
    const endpointCounts = new Map<string, number>();
    this.errors.forEach(error => {
      const count = endpointCounts.get(error.endpoint) || 0;
      endpointCounts.set(error.endpoint, count + 1);
    });

    const mostFrequentEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Count errors by hour
    const hourCounts = new Map<number, number>();
    errorsLast24h.forEach(error => {
      const hour = new Date(error.timestamp).getHours();
      const count = hourCounts.get(hour) || 0;
      hourCounts.set(hour, count + 1);
    });

    const peakTimes = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalErrors: this.errors.length,
      errorsLast24h: errorsLast24h.length,
      errorsLastHour: errorsLastHour.length,
      mostFrequentEndpoints,
      peakTimes
    };
  }

  /**
   * Get all errors (for debugging)
   */
  getAllErrors(): RateLimitError[] {
    return [...this.errors];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): RateLimitError[] {
    return this.errors
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Clear all stored errors
   */
  clearErrors() {
    this.errors = [];
    this.saveToStorage();
  }

  /**
   * Export errors as JSON for analysis
   */
  exportErrors(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      errors: this.errors,
      stats: this.getStats()
    }, null, 2);
  }
}

// Singleton instance
export const rateLimitMonitor = new RateLimitMonitor();

// React hook for monitoring rate limit errors in components
export function useRateLimitMonitor() {
  const logError = (endpoint: string, method: string, retryCount: number) => {
    rateLimitMonitor.logRateLimitError(endpoint, method, retryCount);
  };

  const getStats = () => rateLimitMonitor.getStats();
  const getRecentErrors = (limit?: number) => rateLimitMonitor.getRecentErrors(limit);
  const clearErrors = () => rateLimitMonitor.clearErrors();
  const exportErrors = () => rateLimitMonitor.exportErrors();

  return {
    logError,
    getStats,
    getRecentErrors,
    clearErrors,
    exportErrors
  };
}

// Global error tracking for development
if (import.meta.env.DEV) {
  // Make monitor available globally for debugging
  (window as any).rateLimitMonitor = rateLimitMonitor;
  
}
