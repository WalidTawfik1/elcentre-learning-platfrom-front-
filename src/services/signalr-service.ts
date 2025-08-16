import * as signalR from "@microsoft/signalr";
import { DIRECT_API_URL, SIGNALR_CONFIG } from "@/config/api-config";
import { AuthService } from "./auth-service";
import { UserDTO } from "@/types/api";
import { toast } from "@/components/ui/use-toast";

export interface CourseNotification {
  id: number;
  title: string;
  message: string;
  courseId: number;
  courseName: string; // Course name for display
  createdById: string; // Creator ID (Instructor, Admin, System)
  createdByName: string; // Creator Name
  creatorImage?: string; // Creator profile image URL
  createdAt: string;
  notificationType: string; // "NewLesson", "Announcement", "CourseApproved", "CourseRejected", etc.
  targetUserRole: string; // "Student", "Instructor", "All"
  targetUserId?: string; // Specific user ID (optional)
  isGlobal: boolean; // Global notifications for all users
  priority: string; // "Low", "Normal", "High", "Urgent"
  expiresAt?: string; // Optional expiration date
  isActive: boolean; // Can be used to soft delete notifications
  isRead?: boolean; // This would be calculated on frontend based on NotificationReadStatus
}

// Notification Types (matching backend)
export const NotificationTypes = {
  // Course-related notifications
  NewLesson: "NewLesson",
  Announcement: "Announcement",
  CourseUpdate: "CourseUpdate",
  QuizAvailable: "QuizAvailable",
  GradePosted: "GradePosted",
  AssignmentDue: "AssignmentDue",
  
  // Admin/Course status notifications
  CourseApproved: "CourseApproved",
  CourseRejected: "CourseRejected",
  CoursePendingReview: "CoursePendingReview",
  
  // System notifications
  Welcome: "Welcome",
  SystemMaintenance: "SystemMaintenance",
  AccountUpdated: "AccountUpdated",
  
  // Enrollment notifications
  EnrollmentConfirmed: "EnrollmentConfirmed",
  CertificateReady: "CertificateReady"
} as const;

// Notification Priority (matching backend)
export const NotificationPriority = {
  Low: "Low",
  Normal: "Normal",
  High: "High",
  Urgent: "Urgent"
} as const;

// Target User Roles (matching backend)
export const TargetUserRoles = {
  Student: "Student",
  Instructor: "Instructor",
  Admin: "Admin",
  All: "All"
} as const;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;
  private onNotificationReceived: ((notification: CourseNotification) => void) | null = null;
  private isInitializing = false;
  private connectionPromise: Promise<boolean> | null = null;
  private shouldMaintainConnection = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = SIGNALR_CONFIG.maxReconnectAttempts;
  private lastConnectionAttempt = 0;
  private minConnectionInterval = SIGNALR_CONFIG.minConnectionInterval;
  private isRateLimited = false;
  private rateLimitRetryDelay = SIGNALR_CONFIG.rateLimitRetryDelay;
  private connectionQueue: Array<{ resolve: (value: boolean) => void; reject: (error: any) => void }> = [];
  private isProcessingQueue = false;
  private rateLimitHealthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Set up global connection management
    this.setupGlobalConnectionManagement();
  }

  private setupGlobalConnectionManagement() {
    // Listen for auth state changes
    window.addEventListener('beforeunload', () => {
      this.shouldMaintainConnection = false;
      this.disconnect();
    });

    // Listen for visibility changes to maintain connection
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.shouldMaintainConnection && !this.isConnected) {
        // If rate limited, schedule a recovery attempt
        if (this.isRateLimited) {
          this.scheduleRateLimitRecovery();
        } else {
          this.connect();
        }
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      if (this.shouldMaintainConnection && !this.isConnected) {
        // If rate limited, schedule a recovery attempt
        if (this.isRateLimited) {
          this.scheduleRateLimitRecovery();
        } else {
          this.connect();
        }
      }
    });
  }

  private initializeConnection() {
    // Prevent multiple initializations
    if (this.connection || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    // Get the JWT token for authentication
    const token = AuthService.getAuthToken();
    
    if (!token) {
      this.isInitializing = false;
      return;
    }

    const hubUrl = `${DIRECT_API_URL}/hubs/notifications`;
    if (!import.meta.env.PROD) {
    }

    try {
      // Build the SignalR connection with authentication and fallback transports
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${DIRECT_API_URL}/hubs/notifications`, {
          accessTokenFactory: () => AuthService.getAuthToken() || "", // Always get fresh token
          transport: signalR.HttpTransportType.WebSockets | 
                    signalR.HttpTransportType.ServerSentEvents | 
                    signalR.HttpTransportType.LongPolling, // Enable all transports
          withCredentials: true, // Set to true to match CORS
          skipNegotiation: false, // Allow negotiation to determine best transport
          headers: {
            // Add rate limiting headers to help server identify clients
            'X-Client-Type': 'webapp',
            'X-Client-Version': '1.0.0'
          }
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // More aggressive exponential backoff to prevent rate limiting
            const baseDelay = this.isRateLimited ? this.rateLimitRetryDelay : 2000;
            const delay = Math.min(baseDelay * Math.pow(2, retryContext.previousRetryCount), 300000); // Max 5 minutes
            
            return delay;
          }
        })
        .configureLogging(import.meta.env.PROD ? signalR.LogLevel.Warning : signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();
    } catch (error) {
      this.connection = null;
    } finally {
      this.isInitializing = false;
    }
  }
  private setupEventHandlers() {
    if (!this.connection) return;

    // Handle incoming course notifications
    this.connection.on("ReceiveCourseNotification", (notification: CourseNotification) => {
      
      // Client-side filtering: Only process notification if it's meant for current user
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        return; // No user logged in, ignore notification
      }

      // Check if notification is targeted to a specific user
      if (notification.targetUserId) {
        // If notification has a specific target user ID, only show to that user
        if (notification.targetUserId !== currentUser.id.toString()) {
          return; // This notification is not for the current user
        }
      } else {
        // If no specific target user, check target role
        if (notification.targetUserRole && notification.targetUserRole !== "All") {
          if (notification.targetUserRole !== currentUser.userType) {
            return; // This notification is not for the current user's role
          }
        }
      }

      // Show toast notification only if it passes filtering
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });

      // Call the callback if set
      if (this.onNotificationReceived) {
        this.onNotificationReceived(notification);
      }
    });

    // Handle notification marked as read
    this.connection.on("NotificationMarkedAsRead", (notificationId: number) => {
    });

    // Handle all course notifications marked as read
    this.connection.on("AllCourseNotificationsMarkedAsRead", (courseId: number) => {
    });

    // Handle all notifications marked as read
    this.connection.on("AllNotificationsMarkedAsRead", () => {
    });

    // Handle notification deleted
    this.connection.on("NotificationDeleted", (notificationId: number) => {
    });

    // Handle connection events
    this.connection.onclose((error) => {
      this.isConnected = false;
      
      // Check if this is a rate limiting error
      if (this.isRateLimitingError(error)) {
        this.handleRateLimitError();
      }
    });

    this.connection.onreconnecting((error) => {
      this.isConnected = false;
      
      // Check if this is a rate limiting error
      if (this.isRateLimitingError(error)) {
        this.handleRateLimitError();
      }
    });

    this.connection.onreconnected((connectionId) => {
      this.isConnected = true;
      this.isRateLimited = false; // Reset rate limit flag on successful reconnection
      this.reconnectAttempts = 0; // Reset reconnect attempts
    });
  }

  private handleRateLimitError() {
    this.isRateLimited = true;
    
    // Clear any existing reconnection attempts
    this.reconnectAttempts = 0;
    
    // Start health check to detect when rate limiting expires
    this.startRateLimitHealthCheck();
    
    // Schedule progressive recovery attempts
    this.scheduleRateLimitRecovery();
  }

  private scheduleRateLimitRecovery() {
    const baseDelay = SIGNALR_CONFIG.recoveryBaseDelay;
    const recoveryAttempts = [
      baseDelay, // First attempt after base delay
      baseDelay * 1.5, // Second attempt with 50% longer delay
      baseDelay * 2, // Third attempt with double delay
      baseDelay * 3, // Fourth attempt with triple delay
    ];

    let attemptIndex = 0;

    const attemptRecovery = () => {
      if (!this.isRateLimited || !this.shouldMaintainConnection) {
        return; // Stop if rate limit cleared or connection no longer needed
      }
      
      // Temporarily clear rate limit flag to allow connection attempt
      this.isRateLimited = false;
      
      this.connect().then(connected => {
        if (connected) {
          this.reconnectAttempts = 0; // Reset on successful recovery
        } else {
          // Connection failed, restore rate limit flag and schedule next attempt
          this.isRateLimited = true;
          attemptIndex++;
          
          if (attemptIndex < recoveryAttempts.length) {
            setTimeout(attemptRecovery, recoveryAttempts[attemptIndex]);
          } else {
            // Schedule a final attempt after a longer delay
            setTimeout(() => {
              if (this.isRateLimited && this.shouldMaintainConnection) {
                this.scheduleRateLimitRecovery();
              }
            }, baseDelay * 5); // 5x longer delay for final retry cycle
          }
        }
      }).catch(error => {
        this.isRateLimited = true;
        attemptIndex++;
        
        if (attemptIndex < recoveryAttempts.length) {
          setTimeout(attemptRecovery, recoveryAttempts[attemptIndex]);
        }
      });
    };

    // Start first recovery attempt
    setTimeout(attemptRecovery, recoveryAttempts[0]);
  }  async connect(): Promise<boolean> {
    // If rate limited, don't allow new connections
    if (this.isRateLimited) {
      return false;
    }

    // Implement minimum interval between connection attempts
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.minConnectionInterval) {
      const waitTime = this.minConnectionInterval - (now - this.lastConnectionAttempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastConnectionAttempt = Date.now();

    // If already connecting, add to queue instead of creating new connection
    if (this.connectionPromise) {
      return new Promise((resolve, reject) => {
        this.connectionQueue.push({ resolve, reject });
        this.processConnectionQueue();
      });
    }

    // Set flag to maintain connection
    this.shouldMaintainConnection = true;

    // If already connected, return true
    if (this.connection && this.isConnected) {
      return true;
    }

    // Create connection promise to prevent multiple concurrent connections
    this.connectionPromise = this.performConnection();
    
    try {
      const result = await this.connectionPromise;
      this.processConnectionQueue(); // Process any queued connection requests
      return result;
    } catch (error) {
      this.processConnectionQueue(); // Process queue even on error
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async processConnectionQueue() {
    if (this.isProcessingQueue || this.connectionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const queue = [...this.connectionQueue];
    this.connectionQueue = [];

    const isConnected = this.connection && this.isConnected;

    queue.forEach(({ resolve, reject }) => {
      if (isConnected) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    this.isProcessingQueue = false;
  }

  private async performConnection(): Promise<boolean> {
    // If connection exists but is not connected, try to stop it first
    if (this.connection && !this.isConnected) {
      try {
        await this.connection.stop();
      } catch (error) {
      }
      this.connection = null;
    }

    // Initialize connection if it doesn't exist
    if (!this.connection) {
      this.initializeConnection();
    }

    if (!this.connection) {
      return false;
    }

    try {
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.isRateLimited = false; // Reset rate limit flag on successful connection
      
      // Set up automatic reconnection monitoring
      this.setupReconnectionMonitoring();
      
      return true;
    } catch (error: any) {
      if (!import.meta.env.PROD) {
      }
      this.isConnected = false;
      
      // Check if this is a rate limiting error
      if (this.isRateLimitingError(error)) {
        this.handleRateLimitError();
        return false;
      }
      
      // If connection failed, clean up
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch (stopError) {
        }
        this.connection = null;
      }
      
      // Attempt automatic reconnection if we should maintain connection and not rate limited
      if (!this.isRateLimited) {
        this.scheduleReconnection();
      }
      
      return false;
    }
  }

  private setupReconnectionMonitoring() {
    if (!this.connection) return;

    // Monitor connection state periodically with configurable intervals
    const connectionMonitor = setInterval(() => {
      if (!this.shouldMaintainConnection) {
        clearInterval(connectionMonitor);
        return;
      }

      // If rate limited, don't attempt immediate reconnection but check if we should schedule recovery
      if (this.isRateLimited) {
        return;
      }

      if (this.connection && this.connection.state === signalR.HubConnectionState.Disconnected) {
        this.isConnected = false;
        this.connect();
      }
    }, SIGNALR_CONFIG.connectionCheckInterval);
  }

  // Add periodic health check for rate limit recovery
  private startRateLimitHealthCheck() {
    // Only start if we don't already have a health check running
    if (this.rateLimitHealthCheckInterval) {
      return;
    }

    this.rateLimitHealthCheckInterval = setInterval(() => {
      // Only check if rate limited and should maintain connection
      if (!this.isRateLimited || !this.shouldMaintainConnection) {
        if (this.rateLimitHealthCheckInterval) {
          clearInterval(this.rateLimitHealthCheckInterval);
          this.rateLimitHealthCheckInterval = null;
        }
        return;
      }

      // Try a very light connection test after a reasonable delay
      // This helps detect when rate limiting has been lifted
      const now = Date.now();
      if (now - this.lastConnectionAttempt > this.minConnectionInterval * 2) {
        this.isRateLimited = false; // Temporarily clear to test
        
        this.connect().then(connected => {
          if (!connected) {
            this.isRateLimited = true; // Restore if failed
          }
        }).catch(() => {
          this.isRateLimited = true; // Restore if failed
        });
      }
    }, SIGNALR_CONFIG.connectionCheckInterval * 2); // Check less frequently than normal monitoring
  }

  private scheduleReconnection() {
    if (!this.shouldMaintainConnection || this.reconnectAttempts >= this.maxReconnectAttempts || this.isRateLimited) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      }
      return;
    }

    this.reconnectAttempts++;
    // More conservative exponential backoff to avoid rate limiting
    const baseDelay = 5000; // Start with 5 seconds
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), 300000); // Max 5 minutes
    
    
    setTimeout(() => {
      if (this.shouldMaintainConnection && !this.isConnected && !this.isRateLimited) {
        this.connect();
      }
    }, delay);
  }
  async disconnect(): Promise<void> {
    this.shouldMaintainConnection = false; // Stop maintaining connection
    
    // Clear health check interval
    if (this.rateLimitHealthCheckInterval) {
      clearInterval(this.rateLimitHealthCheckInterval);
      this.rateLimitHealthCheckInterval = null;
    }
    
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
      } catch (error) {
      } finally {
        this.connection = null;
        this.reconnectAttempts = 0;
      }
    }
  }

  // Force disconnect (for logout scenarios)
  async forceDisconnect(): Promise<void> {
    this.shouldMaintainConnection = false;
    await this.disconnect();
  }

  // Start maintaining connection (call this when user logs in)
  startMaintainingConnection(): void {
    this.shouldMaintainConnection = true;
    if (!this.isConnected) {
      this.connect();
    }
  }

  // Stop maintaining connection (call this when user logs out)
  stopMaintainingConnection(): void {
    this.shouldMaintainConnection = false;
  }  // Check if we're currently rate limited
  isRateLimitActive(): boolean {
    return this.isRateLimited;
  }

  // Get connection status with rate limit info
  getConnectionStatus(): { isConnected: boolean; isRateLimited: boolean; reconnectAttempts: number } {
    return {
      isConnected: this.isConnected,
      isRateLimited: this.isRateLimited,
      reconnectAttempts: this.reconnectAttempts
    };
  }

// Join a course group to receive notifications
  async joinCourseGroup(courseId: number): Promise<boolean> {
    if (!this.isReady() || this.isRateLimited) {
      if (this.isRateLimited) {
      } else {
      }
      return false;
    }

    try {
      await this.connection!.invoke("JoinCourseGroup", courseId.toString());
      return true;
    } catch (error: any) {
      
      // Check if this is a rate limiting error
      if (this.isRateLimitingError(error)) {
        this.handleRateLimitError();
      }
      return false;
    }
  }

  // Leave a course group
  async leaveCourseGroup(courseId: number): Promise<boolean> {
    if (!this.isReady() || this.isRateLimited) {
      if (this.isRateLimited) {
      } else {
      }
      return false;
    }

    try {
      await this.connection!.invoke("LeaveCourseGroup", courseId.toString());
      return true;
    } catch (error) {
      return false;
    }
  }  // Get existing notifications
  async getCourseNotifications(userId: string, courseId: number, unreadOnly: boolean = false): Promise<CourseNotification[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const notifications = await this.connection!.invoke("GetCourseNotifications", userId, courseId, unreadOnly);
      return notifications || [];
    } catch (error) {
      return [];
    }
  }

  // Get all notifications for user
  async getAllNotifications(userId: string, unreadOnly: boolean = false, page: number = 1, pageSize: number = 20): Promise<CourseNotification[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const notifications = await this.connection.invoke("GetAllNotifications", userId, unreadOnly, page, pageSize);
      return notifications || [];
    } catch (error) {
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const count = await this.connection.invoke("GetUnreadCount", userId);
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  // Get course unread count
  async getCourseUnreadCount(userId: string, courseId: number): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const count = await this.connection.invoke("GetCourseUnreadCount", userId, courseId);
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: number, userId: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("MarkCourseNotificationAsRead", notificationId, userId);
      return true;
    } catch (error) {
      return false;
    }
  }
  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string, courseId: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("MarkAllCourseNotificationsAsRead", userId, courseId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Mark all notifications as read (global)
  async markAllNotificationsAsReadGlobal(userId: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("MarkAllNotificationsAsRead", userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Create course notification (for instructors)
  async createCourseNotification(notification: Omit<CourseNotification, 'id' | 'createdAt' | 'createdById' | 'createdByName'>): Promise<CourseNotification | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const result = await this.connection.invoke("CreateCourseNotification", notification);
      return result;
    } catch (error) {
      return null;
    }
  }

  // Get notification history
  async getNotificationHistory(userId: string, fromDate?: Date, toDate?: Date): Promise<CourseNotification[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const notifications = await this.connection.invoke("GetNotificationHistory", userId, fromDate, toDate);
      return notifications || [];
    } catch (error) {
      return [];
    }
  }

  // Notify new lesson (for instructors)
  async notifyNewLesson(courseId: number, lessonTitle: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("NotifyNewLesson", courseId, lessonTitle);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Notify course status (for admins)
  async notifyCourseStatus(courseId: number, status: string, instructorId: string, reason?: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("NotifyCourseStatus", courseId, status, instructorId, reason);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("DeleteNotification", notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Join multiple course groups at once
  async joinCourseGroups(courseIds: number[]): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("JoinCourseGroups", courseIds.map(id => id.toString()));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Leave multiple course groups at once
  async leaveCourseGroups(courseIds: number[]): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.connection.invoke("LeaveCourseGroups", courseIds.map(id => id.toString()));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set callback for when notifications are received
  setNotificationCallback(callback: (notification: CourseNotification) => void): void {
    this.onNotificationReceived = callback;
  }

  // Reinitialize connection (useful when user logs in/out)
  reinitialize(): void {
    // Clear health check interval
    if (this.rateLimitHealthCheckInterval) {
      clearInterval(this.rateLimitHealthCheckInterval);
      this.rateLimitHealthCheckInterval = null;
    }
    
    this.disconnect().then(() => {
      // Reset state
      this.connection = null;
      this.isConnected = false;
      this.isInitializing = false;
      this.reconnectAttempts = 0;
      this.isRateLimited = false; // Reset rate limiting on reinitialize
      // If we should maintain connection, reconnect
      if (this.shouldMaintainConnection) {
        this.connect();
      }
    });
  }

  // Manually reset rate limiting (for admin/debugging purposes)
  resetRateLimit(): void {
    this.isRateLimited = false;
    this.reconnectAttempts = 0;
    
    // Attempt to reconnect if we should be maintaining connection
    if (this.shouldMaintainConnection && !this.isConnected) {
      this.connect();
    }
  }

  // Force rate limit recovery attempt
  forceRateLimitRecovery(): void {
    if (this.isRateLimited && this.shouldMaintainConnection) {
      this.scheduleRateLimitRecovery();
    }
  }

  // Check if connection is ready for operations
  isReady(): boolean {
    return this.connection !== null && this.isConnected && this.connection.state === signalR.HubConnectionState.Connected;
  }

  // Get current connection state
  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection ? this.connection.state : null;
  }

  private isRateLimitingError(error: any): boolean {
    if (!error) return false;
    
    // Check for HTTP 429 status code
    if (error.statusCode === 429) return true;
    
    // Check for rate limiting messages
    const message = error.message || error.toString() || '';
    const rateLimitIndicators = [
      '429',
      'rate limit',
      'too many requests',
      'rate exceeded',
      'throttled',
      'quota exceeded'
    ];
    
    return rateLimitIndicators.some(indicator => 
      message.toLowerCase().includes(indicator.toLowerCase())
    );
  }
}

// Export a singleton instance
export const signalRService = new SignalRService();
export default signalRService;

// Debug utilities for SignalR (available in browser console)
if (typeof window !== 'undefined') {
  (window as any).signalRDebug = {
    getStatus: () => signalRService.getConnectionStatus(),
    forceReconnect: () => signalRService.reinitialize(),
    resetRateLimit: () => signalRService.resetRateLimit(),
    forceRecovery: () => signalRService.forceRateLimitRecovery(),
    getState: () => signalRService.getConnectionState(),
    isReady: () => signalRService.isReady(),
  };
}
