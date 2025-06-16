import { apiRequest } from "./api";

export interface CreateNotificationRequest {
  title: string;
  message: string;
  courseId: number;
  notificationType: string;
  // Note: createdById and createdByName will be set by the backend based on the authenticated user
}

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  courseId: number;
  createdById: string; // Instructor ID
  createdByName: string; // Instructor Name
  createdAt: string;
  notificationType: string; // "NewLesson", "Announcement", etc.
  isRead: boolean; // This would be calculated based on NotificationReadStatus
}

export interface NotificationSubscription {
  id: number;
  userId: number;
  courseId: number;
  isSubscribed: boolean;
  createdAt: string;
}

export const NotificationService = {
  // Create a new course notification (for instructors)
  createCourseNotification: async (notification: CreateNotificationRequest): Promise<NotificationResponse> => {
    return apiRequest<NotificationResponse>(
      '/Notifications/create-course-notification',
      {
        method: 'POST',
        body: JSON.stringify(notification),
      },
      true
    );
  },

  // Get course notifications for a user
  getCourseNotifications: async (courseId: number, unreadOnly: boolean = false): Promise<NotificationResponse[]> => {
    const params = new URLSearchParams({
      unreadOnly: unreadOnly.toString()
    });
    
    return apiRequest<NotificationResponse[]>(
      `/Notifications/get-course-notifications/${courseId}?${params}`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Mark a notification as read
  markNotificationAsRead: async (notificationId: number): Promise<void> => {
    return apiRequest<void>(
      `/Notifications/mark-notification-asread/${notificationId}`,
      {
        method: 'POST',
      },
      true
    );
  },

  // Mark all notifications as read for a course
  markAllNotificationsAsRead: async (courseId: number): Promise<void> => {
    return apiRequest<void>(
      `/Notifications/mark-all-notifications-asread/${courseId}`,
      {
        method: 'POST',
      },
      true
    );
  },
  // Note: Subscription management is handled entirely through SignalR groups
  // No backend endpoints are needed for subscription status as this is managed locally
};
