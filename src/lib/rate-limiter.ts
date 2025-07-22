// Rate Limiter and Request Coordinator
// Prevents 429 errors by managing API request frequency and implementing debouncing

interface RequestConfig {
  endpoint: string;
  method?: string;
  priority?: 'high' | 'medium' | 'low';
  debounceMs?: number;
  maxRetries?: number;
}

interface PendingRequest {
  config: RequestConfig;
  promise: Promise<any>;
  timestamp: number;
  retryCount: number;
}

class APIRateLimiter {
  private requestQueue: Map<string, PendingRequest> = new Map();
  private lastRequestTimes: Map<string, number> = new Map();
  private pendingDebounces: Map<string, NodeJS.Timeout> = new Map();
  private activeRequests: Set<string> = new Set();
  
  // Rate limiting configuration
  private readonly config = {
    // Minimum time between identical requests (in ms)
    minRequestInterval: {
      'high': 100,      // Critical requests (auth, payments)
      'medium': 500,    // Normal requests (course data, enrollments)
      'low': 1000       // Background requests (notifications, analytics)
    },
    
    // Maximum concurrent requests per priority
    maxConcurrentRequests: {
      'high': 3,
      'medium': 2,
      'low': 1
    },
    
    // Default debounce times by request type
    defaultDebounceMs: {
      'search': 300,
      'form-submit': 0,
      'navigation': 100,
      'background-update': 1000
    },
    
    // Exponential backoff for 429 errors
    backoffConfig: {
      initialDelay: 2000,
      maxDelay: 30000,
      multiplier: 2,
      jitter: 0.1
    }
  };

  /**
   * Create a unique key for the request
   */
  private getRequestKey(config: RequestConfig): string {
    const { endpoint, method = 'GET' } = config;
    return `${method}:${endpoint}`;
  }

  /**
   * Get the count of active requests for a priority level
   */
  private getActiveRequestCount(priority: 'high' | 'medium' | 'low'): number {
    return Array.from(this.activeRequests).filter(key => {
      const pending = this.requestQueue.get(key);
      return pending && pending.config.priority === priority;
    }).length;
  }

  /**
   * Check if request should be rate limited
   */
  private shouldRateLimit(config: RequestConfig): boolean {
    const key = this.getRequestKey(config);
    const priority = config.priority || 'medium';
    const now = Date.now();
    
    // Check if we have too many concurrent requests
    const activeCount = this.getActiveRequestCount(priority);
    if (activeCount >= this.config.maxConcurrentRequests[priority]) {
      return true;
    }
    
    // Check minimum interval between identical requests
    const lastRequest = this.lastRequestTimes.get(key);
    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest;
      const minInterval = this.config.minRequestInterval[priority];
      if (timeSinceLastRequest < minInterval) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate backoff delay for retry
   */
  private calculateBackoffDelay(retryCount: number): number {
    const { initialDelay, maxDelay, multiplier, jitter } = this.config.backoffConfig;
    
    let delay = Math.min(
      initialDelay * Math.pow(multiplier, retryCount),
      maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitterRange = delay * jitter;
    delay += Math.random() * jitterRange * 2 - jitterRange;
    
    return Math.floor(delay);
  }

  /**
   * Execute request with rate limiting and retry logic
   */
  private async executeRequest<T>(
    config: RequestConfig,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.getRequestKey(config);
    const maxRetries = config.maxRetries || 3;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait if rate limited
        while (this.shouldRateLimit(config)) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Mark request as active
        this.activeRequests.add(key);
        this.lastRequestTimes.set(key, Date.now());
        
        const result = await requestFn();
        
        // Success - clean up and return
        this.activeRequests.delete(key);
        this.requestQueue.delete(key);
        
        return result;
        
      } catch (error: any) {
        this.activeRequests.delete(key);
        lastError = error;
        
        // Check if it's a 429 error
        if (error.message?.includes('429') || error.status === 429) {
          if (attempt < maxRetries) {
            const delay = this.calculateBackoffDelay(attempt);
            console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For non-429 errors or max retries reached, break
        break;
      }
    }
    
    // Clean up and throw the last error
    this.requestQueue.delete(key);
    throw lastError;
  }

  /**
   * Debounced request execution
   */
  async request<T>(
    config: RequestConfig,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const key = this.getRequestKey(config);
    const debounceMs = config.debounceMs || this.config.defaultDebounceMs['background-update'];
    
    // Clear existing debounce if any
    const existingTimeout = this.pendingDebounces.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Return existing request if it's already pending
    const existingRequest = this.requestQueue.get(key);
    if (existingRequest && debounceMs === 0) {
      return existingRequest.promise;
    }
    
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        this.pendingDebounces.delete(key);
        
        try {
          const result = await this.executeRequest(config, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);
      
      this.pendingDebounces.set(key, timeout);
    });
  }

  /**
   * Get current rate limiting status
   */
  getStatus() {
    return {
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.size,
      pendingDebounces: this.pendingDebounces.size,
      recentRequests: Object.fromEntries(this.lastRequestTimes)
    };
  }

  /**
   * Clear all pending requests and debounces
   */
  clear() {
    // Clear all debounce timeouts
    for (const timeout of this.pendingDebounces.values()) {
      clearTimeout(timeout);
    }
    
    this.pendingDebounces.clear();
    this.requestQueue.clear();
    this.activeRequests.clear();
  }
}

// Singleton instance
export const rateLimiter = new APIRateLimiter();

// Helper functions for common use cases

/**
 * Debounced search request
 */
export function debouncedSearch<T>(
  searchFn: () => Promise<T>,
  endpoint: string,
  debounceMs: number = 300
): Promise<T> {
  return rateLimiter.request(
    {
      endpoint: `search:${endpoint}`,
      priority: 'medium',
      debounceMs,
      maxRetries: 2
    },
    searchFn
  );
}

/**
 * High priority request (auth, payments)
 */
export function highPriorityRequest<T>(
  requestFn: () => Promise<T>,
  endpoint: string
): Promise<T> {
  return rateLimiter.request(
    {
      endpoint,
      priority: 'high',
      debounceMs: 0,
      maxRetries: 3
    },
    requestFn
  );
}

/**
 * Background request (notifications, analytics)
 */
export function backgroundRequest<T>(
  requestFn: () => Promise<T>,
  endpoint: string,
  debounceMs: number = 1000
): Promise<T> {
  return rateLimiter.request(
    {
      endpoint,
      priority: 'low',
      debounceMs,
      maxRetries: 5
    },
    requestFn
  );
}

/**
 * Form submission with minimal debouncing
 */
export function debouncedFormSubmit<T>(
  submitFn: () => Promise<T>,
  endpoint: string,
  debounceMs: number = 100
): Promise<T> {
  return rateLimiter.request(
    {
      endpoint,
      priority: 'high',
      debounceMs,
      maxRetries: 3
    },
    submitFn
  );
}

// React hook for using the rate limiter
export function useRateLimiter() {
  return {
    request: rateLimiter.request.bind(rateLimiter),
    debouncedSearch,
    highPriorityRequest,
    backgroundRequest,
    debouncedFormSubmit,
    getStatus: rateLimiter.getStatus.bind(rateLimiter),
    clear: rateLimiter.clear.bind(rateLimiter)
  };
}
