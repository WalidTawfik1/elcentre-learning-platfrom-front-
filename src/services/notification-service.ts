import { apiRequest } from "./api";

export interface CreateNotificationRequest {
  title: string;
  message: string;
  courseId: number;
  courseName: string;
  notificationType: string;
  // Note: createdById and createdByName will be set by the backend based on the authenticated user
}

export interface NotificationResponse {
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
  isRead: boolean; // This would be calculated based on NotificationReadStatus
}

export interface NotificationSubscription {
  id: number;
  userId: number;
  courseId: number;
  isSubscribed: boolean;
  createdAt: string;
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
      `/Notifications/course/${courseId}?${params}`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Get all notifications for a user
  getAllNotifications: async (unreadOnly: boolean = false, page: number = 1, pageSize: number = 20): Promise<NotificationResponse[]> => {
    const params = new URLSearchParams({
      unreadOnly: unreadOnly.toString(),
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    
    return apiRequest<NotificationResponse[]>(
      `/Notifications/all?${params}`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Get notification summary (lighter payload for faster loading)
  getNotificationSummary: async (): Promise<{ unreadCount: number; recentNotifications: Array<{ id: number; title: string; createdAt: string; isRead: boolean }> }> => {
    return apiRequest<{ unreadCount: number; recentNotifications: Array<{ id: number; title: string; createdAt: string; isRead: boolean }> }>(
      `/Notifications/summary`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Get all notifications with optimized defaults for faster loading
  getAllNotificationsOptimized: async (): Promise<NotificationResponse[]> => {
    const params = new URLSearchParams({
      unreadOnly: 'false',
      page: '1',
      pageSize: '200' // Higher limit for better performance
    });
    
    return apiRequest<NotificationResponse[]>(
      `/Notifications/all?${params}`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return apiRequest<{ unreadCount: number }>(
      `/Notifications/unread-count`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Get course unread count
  getCourseUnreadCount: async (courseId: number): Promise<{ unreadCount: number }> => {
    return apiRequest<{ unreadCount: number }>(
      `/Notifications/course/${courseId}/unread-count`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Mark a notification as read
  markNotificationAsRead: async (notificationId: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/Notifications/${notificationId}/read`,
      {
        method: 'PUT',
      },
      true
    );
  },

  // Mark all course notifications as read
  markAllCourseNotificationsAsRead: async (courseId: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/Notifications/course/${courseId}/read-all`,
      {
        method: 'PUT',
      },
      true
    );
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/Notifications/read-all`,
      {
        method: 'PUT',
      },
      true
    );
  },

  // Get notification history
  getNotificationHistory: async (fromDate?: Date, toDate?: Date): Promise<NotificationResponse[]> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate.toISOString());
    if (toDate) params.append('toDate', toDate.toISOString());
    
    return apiRequest<NotificationResponse[]>(
      `/Notifications/history?${params}`,
      {
        method: 'GET',
      },
      true
    );
  },

  // Delete notification
  deleteNotification: async (notificationId: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/Notifications/${notificationId}`,
      {
        method: 'DELETE',
      },
      true
    );
  },

  // Send course status notification (admin only)
  sendCourseStatusNotification: async (courseId: number, status: string, instructorId: string, reason?: string): Promise<void> => {
    return apiRequest<void>(
      `/Notifications/course-status`,
      {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          status,
          instructorId,
          reason
        }),
      },
      true
    );
  },

  // Send new lesson notification (instructor only)
  sendNewLessonNotification: async (courseId: number, lessonTitle: string): Promise<void> => {
    return apiRequest<void>(
      `/Notifications/new-lesson`,
      {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          lessonTitle
        }),
      },
      true
    );
  },

  // Cleanup expired notifications (admin only)
  cleanupExpiredNotifications: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/Notifications/cleanup-expired`,
      {
        method: 'POST',
      },
      true
    );
  },

  // Note: Subscription management is handled entirely through SignalR groups
  // No backend endpoints are needed for subscription status as this is managed locally
};
