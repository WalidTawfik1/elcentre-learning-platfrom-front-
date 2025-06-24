import * as signalR from "@microsoft/signalr";
import { DIRECT_API_URL } from "@/config/api-config";
import { AuthService } from "./auth-service";
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
  private maxReconnectAttempts = 10;

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
        console.log('Page became visible, attempting to reconnect SignalR...');
        this.connect();
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      if (this.shouldMaintainConnection && !this.isConnected) {
        console.log('Network came online, attempting to reconnect SignalR...');
        this.connect();
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
      console.warn("No authentication token found for SignalR connection");
      this.isInitializing = false;
      return;
    }

    try {
      // Build the SignalR connection with authentication and fallback transports
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${DIRECT_API_URL}/hubs/notifications`, {
          accessTokenFactory: () => AuthService.getAuthToken() || "", // Always get fresh token
          transport: signalR.HttpTransportType.WebSockets | 
                    signalR.HttpTransportType.ServerSentEvents | 
                    signalR.HttpTransportType.LongPolling, // Enable all transports
          withCredentials: false, // Set to false to avoid CORS issues
          skipNegotiation: false // Allow negotiation to determine best transport
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // Exponential backoff: 0, 2, 10, 30 seconds then every 30 seconds
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            return 30000;
          }
        })
        .configureLogging(signalR.LogLevel.Information) // Add logging for debugging
        .build();

      // Set up event handlers
      this.setupEventHandlers();
    } catch (error) {
      console.error("Error initializing SignalR connection:", error);
      this.connection = null;
    } finally {
      this.isInitializing = false;
    }
  }
  private setupEventHandlers() {
    if (!this.connection) return;

    // Handle incoming course notifications
    this.connection.on("ReceiveCourseNotification", (notification: CourseNotification) => {
      console.log("New notification received:", notification);
      
      // Show toast notification
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
      console.log("Notification marked as read:", notificationId);
    });

    // Handle all course notifications marked as read
    this.connection.on("AllCourseNotificationsMarkedAsRead", (courseId: number) => {
      console.log("All course notifications marked as read for course:", courseId);
    });

    // Handle all notifications marked as read
    this.connection.on("AllNotificationsMarkedAsRead", () => {
      console.log("All notifications marked as read");
    });

    // Handle notification deleted
    this.connection.on("NotificationDeleted", (notificationId: number) => {
      console.log("Notification deleted:", notificationId);
    });

    // Handle connection events
    this.connection.onclose((error) => {
      this.isConnected = false;
      console.log("SignalR connection closed:", error);
    });

    this.connection.onreconnecting((error) => {
      console.log("SignalR reconnecting:", error);
      this.isConnected = false;
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR reconnected:", connectionId);
      this.isConnected = true;
    });
  }  async connect(): Promise<boolean> {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
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
      return result;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<boolean> {
    // If connection exists but is not connected, try to stop it first
    if (this.connection && !this.isConnected) {
      try {
        await this.connection.stop();
      } catch (error) {
        console.warn("Error stopping existing connection:", error);
      }
      this.connection = null;
    }

    // Initialize connection if it doesn't exist
    if (!this.connection) {
      this.initializeConnection();
    }

    if (!this.connection) {
      console.error("Failed to initialize SignalR connection");
      return false;
    }

    try {
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      console.log("SignalR connected successfully");
      
      // Set up automatic reconnection monitoring
      this.setupReconnectionMonitoring();
      
      return true;
    } catch (error) {
      console.error("SignalR connection failed:", error);
      this.isConnected = false;
      
      // If connection failed, clean up
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch (stopError) {
          console.warn("Error stopping failed connection:", stopError);
        }
        this.connection = null;
      }
      
      // Attempt automatic reconnection if we should maintain connection
      this.scheduleReconnection();
      
      return false;
    }
  }

  private setupReconnectionMonitoring() {
    if (!this.connection) return;

    // Monitor connection state periodically
    const connectionMonitor = setInterval(() => {
      if (!this.shouldMaintainConnection) {
        clearInterval(connectionMonitor);
        return;
      }

      if (this.connection && this.connection.state === signalR.HubConnectionState.Disconnected) {
        console.log('SignalR connection lost, attempting to reconnect...');
        this.isConnected = false;
        this.connect();
      }
    }, 5000); // Check every 5 seconds
  }

  private scheduleReconnection() {
    if (!this.shouldMaintainConnection || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30 seconds
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.shouldMaintainConnection && !this.isConnected) {
        this.connect();
      }
    }, delay);
  }
  async disconnect(): Promise<void> {
    this.shouldMaintainConnection = false; // Stop maintaining connection
    
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log("SignalR disconnected");
      } catch (error) {
        console.error("Error disconnecting SignalR:", error);
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
  }// Join a course group to receive notifications
  async joinCourseGroup(courseId: number): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not ready when trying to join course group");
      return false;
    }

    try {
      await this.connection!.invoke("JoinCourseGroup", courseId.toString());
      console.log(`Joined course group ${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error joining course group ${courseId}:`, error);
      return false;
    }
  }

  // Leave a course group
  async leaveCourseGroup(courseId: number): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not ready when trying to leave course group");
      return false;
    }

    try {
      await this.connection!.invoke("LeaveCourseGroup", courseId.toString());
      console.log(`Left course group ${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error leaving course group ${courseId}:`, error);
      return false;
    }
  }  // Get existing notifications
  async getCourseNotifications(userId: string, courseId: number, unreadOnly: boolean = false): Promise<CourseNotification[]> {
    if (!this.isReady()) {
      console.warn("SignalR not ready when trying to get notifications");
      return [];
    }

    try {
      const notifications = await this.connection!.invoke("GetCourseNotifications", userId, courseId, unreadOnly);
      return notifications || [];
    } catch (error) {
      console.error("Error getting course notifications:", error);
      return [];
    }
  }

  // Get all notifications for user
  async getAllNotifications(userId: string, unreadOnly: boolean = false, page: number = 1, pageSize: number = 20): Promise<CourseNotification[]> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to get all notifications");
      return [];
    }

    try {
      const notifications = await this.connection.invoke("GetAllNotifications", userId, unreadOnly, page, pageSize);
      return notifications || [];
    } catch (error) {
      console.error("Error getting all notifications:", error);
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to get unread count");
      return 0;
    }

    try {
      const count = await this.connection.invoke("GetUnreadCount", userId);
      return count || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // Get course unread count
  async getCourseUnreadCount(userId: string, courseId: number): Promise<number> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to get course unread count");
      return 0;
    }

    try {
      const count = await this.connection.invoke("GetCourseUnreadCount", userId, courseId);
      return count || 0;
    } catch (error) {
      console.error("Error getting course unread count:", error);
      return 0;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: number, userId: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to mark notification as read");
      return false;
    }

    try {
      await this.connection.invoke("MarkCourseNotificationAsRead", notificationId, userId);
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }
  // Mark all notifications as read
  async markAllNotificationsAsRead(userId: string, courseId: number): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to mark all notifications as read");
      return false;
    }

    try {
      await this.connection.invoke("MarkAllCourseNotificationsAsRead", userId, courseId);
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  // Mark all notifications as read (global)
  async markAllNotificationsAsReadGlobal(userId: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to mark all notifications as read globally");
      return false;
    }

    try {
      await this.connection.invoke("MarkAllNotificationsAsRead", userId);
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read globally:", error);
      return false;
    }
  }

  // Create course notification (for instructors)
  async createCourseNotification(notification: Omit<CourseNotification, 'id' | 'createdAt' | 'createdById' | 'createdByName'>): Promise<CourseNotification | null> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to create notification");
      return null;
    }

    try {
      const result = await this.connection.invoke("CreateCourseNotification", notification);
      return result;
    } catch (error) {
      console.error("Error creating course notification:", error);
      return null;
    }
  }

  // Get notification history
  async getNotificationHistory(userId: string, fromDate?: Date, toDate?: Date): Promise<CourseNotification[]> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to get notification history");
      return [];
    }

    try {
      const notifications = await this.connection.invoke("GetNotificationHistory", userId, fromDate, toDate);
      return notifications || [];
    } catch (error) {
      console.error("Error getting notification history:", error);
      return [];
    }
  }

  // Notify new lesson (for instructors)
  async notifyNewLesson(courseId: number, lessonTitle: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to notify new lesson");
      return false;
    }

    try {
      await this.connection.invoke("NotifyNewLesson", courseId, lessonTitle);
      return true;
    } catch (error) {
      console.error("Error notifying new lesson:", error);
      return false;
    }
  }

  // Notify course status (for admins)
  async notifyCourseStatus(courseId: number, status: string, instructorId: string, reason?: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to notify course status");
      return false;
    }

    try {
      await this.connection.invoke("NotifyCourseStatus", courseId, status, instructorId, reason);
      return true;
    } catch (error) {
      console.error("Error notifying course status:", error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: number): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to delete notification");
      return false;
    }

    try {
      await this.connection.invoke("DeleteNotification", notificationId);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  // Join multiple course groups at once
  async joinCourseGroups(courseIds: number[]): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to join course groups");
      return false;
    }

    try {
      await this.connection.invoke("JoinCourseGroups", courseIds.map(id => id.toString()));
      console.log(`Joined course groups: ${courseIds.join(', ')}`);
      return true;
    } catch (error) {
      console.error(`Error joining course groups:`, error);
      return false;
    }
  }

  // Leave multiple course groups at once
  async leaveCourseGroups(courseIds: number[]): Promise<boolean> {
    if (!this.isReady()) {
      console.warn("SignalR not connected when trying to leave course groups");
      return false;
    }

    try {
      await this.connection.invoke("LeaveCourseGroups", courseIds.map(id => id.toString()));
      console.log(`Left course groups: ${courseIds.join(', ')}`);
      return true;
    } catch (error) {
      console.error(`Error leaving course groups:`, error);
      return false;
    }
  }

  // Set callback for when notifications are received
  setNotificationCallback(callback: (notification: CourseNotification) => void): void {
    this.onNotificationReceived = callback;
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }  // Reinitialize connection (useful when user logs in/out)
  reinitialize(): void {
    this.disconnect().then(() => {
      // Reset state
      this.connection = null;
      this.isConnected = false;
      this.isInitializing = false;
      this.reconnectAttempts = 0;
      // If we should maintain connection, reconnect
      if (this.shouldMaintainConnection) {
        this.connect();
      }
    });
  }

  // Check if connection is ready for operations
  isReady(): boolean {
    return this.connection !== null && this.isConnected && this.connection.state === signalR.HubConnectionState.Connected;
  }

  // Get current connection state
  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection ? this.connection.state : null;
  }
}

// Export a singleton instance
export const signalRService = new SignalRService();
export default signalRService;
