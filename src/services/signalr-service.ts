import * as signalR from "@microsoft/signalr";
import { DIRECT_API_URL } from "@/config/api-config";
import { AuthService } from "./auth-service";
import { toast } from "@/components/ui/use-toast";

export interface CourseNotification {
  id: number;
  title: string;
  message: string;
  courseId: number;
  createdById: string; // Instructor ID
  createdByName: string; // Instructor Name
  createdAt: string;
  notificationType: string; // "NewLesson", "Announcement", etc.
  isRead?: boolean; // This would be calculated on frontend based on NotificationReadStatus
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;
  private onNotificationReceived: ((notification: CourseNotification) => void) | null = null;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    // Get the JWT token for authentication
    const token = AuthService.getAuthToken();
    
    if (!token) {
      console.warn("No authentication token found for SignalR connection");
      return;
    }    // Build the SignalR connection with authentication
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${DIRECT_API_URL}/hubs/notifications`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: true
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
      .build();

    // Set up event handlers
    this.setupEventHandlers();
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
  }

  async connect(): Promise<boolean> {
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
      console.log("SignalR connected successfully");
      return true;
    } catch (error) {
      console.error("SignalR connection failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log("SignalR disconnected");
      } catch (error) {
        console.error("Error disconnecting SignalR:", error);
      }
    }
  }
  // Join a course group to receive notifications
  async joinCourseGroup(courseId: number): Promise<boolean> {
    if (!this.connection || !this.isConnected) {
      console.warn("SignalR not connected when trying to join course group");
      return false;
    }

    try {
      await this.connection.invoke("JoinCourseGroup", courseId.toString());
      console.log(`Joined course group ${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error joining course group ${courseId}:`, error);
      return false;
    }
  }

  // Leave a course group
  async leaveCourseGroup(courseId: number): Promise<boolean> {
    if (!this.connection || !this.isConnected) {
      console.warn("SignalR not connected when trying to leave course group");
      return false;
    }

    try {
      await this.connection.invoke("LeaveCourseGroup", courseId.toString());
      console.log(`Left course group ${courseId}`);
      return true;
    } catch (error) {
      console.error(`Error leaving course group ${courseId}:`, error);
      return false;
    }
  }
  // Get existing notifications
  async getCourseNotifications(userId: string, courseId: number, unreadOnly: boolean = false): Promise<CourseNotification[]> {
    if (!this.connection || !this.isConnected) {
      console.warn("SignalR not connected when trying to get notifications");
      return [];
    }

    try {
      const notifications = await this.connection.invoke("GetCourseNotifications", userId, courseId, unreadOnly);
      return notifications || [];
    } catch (error) {
      console.error("Error getting course notifications:", error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: number, userId: string): Promise<boolean> {
    if (!this.connection || !this.isConnected) {
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
    if (!this.connection || !this.isConnected) {
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

  // Set callback for when notifications are received
  setNotificationCallback(callback: (notification: CourseNotification) => void): void {
    this.onNotificationReceived = callback;
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Reinitialize connection (useful when user logs in/out)
  reinitialize(): void {
    this.disconnect().then(() => {
      this.initializeConnection();
    });
  }
}

// Export a singleton instance
export const signalRService = new SignalRService();
export default signalRService;
