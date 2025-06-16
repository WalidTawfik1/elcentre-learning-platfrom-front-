import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signalRService, CourseNotification } from '@/services/signalr-service';
import { NotificationService, NotificationResponse } from '@/services/notification-service';
import { EnrollmentService } from '@/services/enrollment-service';
import { useAuth } from './use-auth';

// Local subscription management (stored in localStorage)
interface LocalNotificationSubscription {
  courseId: number;
  isSubscribed: boolean;
  courseName?: string;
}

interface NotificationContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  isConnected: boolean;
  joinCourseGroup: (courseId: number) => Promise<boolean>;
  leaveCourseGroup: (courseId: number) => Promise<boolean>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: (courseId: number) => Promise<void>;
  refreshNotifications: (courseId?: number) => Promise<void>;
  clearNotifications: () => void;
  // Local subscription management
  isSubscribedToCourse: (courseId: number) => boolean;
  toggleCourseSubscription: (courseId: number, courseName?: string) => Promise<void>;
  getAllSubscriptions: () => LocalNotificationSubscription[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  // Local storage key for subscriptions
  const getSubscriptionsKey = () => user ? `notifications_subscriptions_${user.id}` : null;
  
  // Local storage key for read statuses (as backup/cache)
  const getReadStatusKey = () => user ? `notifications_read_status_${user.id}` : null;

  // Local read status management (as cache/backup)
  const getLocalReadStatuses = (): Record<number, boolean> => {
    const key = getReadStatusKey();
    if (!key) return {};
    
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading read statuses from localStorage:', error);
      return {};
    }
  };

  const saveLocalReadStatuses = (statuses: Record<number, boolean>) => {
    const key = getReadStatusKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(statuses));
    } catch (error) {
      console.error('Error saving read statuses to localStorage:', error);
    }
  };

  // Local subscription management functions
  const getLocalSubscriptions = (): LocalNotificationSubscription[] => {
    const key = getSubscriptionsKey();
    if (!key) return [];
    
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading subscriptions from localStorage:', error);
      return [];
    }
  };

  const saveLocalSubscriptions = (subscriptions: LocalNotificationSubscription[]) => {
    const key = getSubscriptionsKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Error saving subscriptions to localStorage:', error);
    }
  };

  // Initialize SignalR connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSignalR();
    } else {
      disconnectSignalR();
    }

    return () => {
      disconnectSignalR();
    };
  }, [isAuthenticated, user]);
  const initializeSignalR = async () => {
    try {
      const connected = await signalRService.connect();
      setIsConnected(connected);

      if (connected) {        // Set up callback for new notifications
        signalRService.setNotificationCallback((notification: CourseNotification) => {
          // Convert CourseNotification to NotificationResponse format
          const notificationResponse: NotificationResponse = {
            ...notification,
            isRead: notification.isRead ?? false, // Default to false if not provided
            createdById: notification.createdById,
            createdByName: notification.createdByName
          };
          setNotifications(prev => [notificationResponse, ...prev]);
        });

        // Auto-subscribe students to their enrolled courses if they haven't manually set preferences
        if (user?.userType === "Student") {
          await autoSubscribeToEnrolledCourses();
        }        // Auto-join all subscribed course groups and load notifications
        const subscriptions = getLocalSubscriptions();
        const allNotifications: NotificationResponse[] = [];
        
        for (const subscription of subscriptions) {
          if (subscription.isSubscribed) {
            await signalRService.joinCourseGroup(subscription.courseId);            // Load existing notifications for this course
            try {
              const courseNotifications = await signalRService.getCourseNotifications(
                user.id.toString(), 
                subscription.courseId
              );
              
              // Apply local read status cache
              const localReadStatuses = getLocalReadStatuses();
              
              // Convert CourseNotification[] to NotificationResponse[]
              const convertedNotifications: NotificationResponse[] = courseNotifications.map(n => ({
                ...n,
                isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
                createdById: n.createdById,
                createdByName: n.createdByName
              }));
              allNotifications.push(...convertedNotifications);
            } catch (error) {
              console.error(`Error loading notifications for course ${subscription.courseId}:`, error);
            }
          }
        }
        
        // Sort by creation date (newest first) and set initial notifications
        allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
      setIsConnected(false);
    }
  };

  const autoSubscribeToEnrolledCourses = async () => {
    try {
      const enrollments = await EnrollmentService.getStudentEnrollments();
      const currentSubscriptions = getLocalSubscriptions();
      
      for (const enrollment of enrollments) {
        const existingSubscription = currentSubscriptions.find(
          sub => sub.courseId === enrollment.courseId
        );
        
        // If no subscription exists for this course, create one (subscribed by default)
        if (!existingSubscription) {
          const updatedSubscriptions = [
            ...currentSubscriptions,
            {
              courseId: enrollment.courseId,
              isSubscribed: true,
              courseName: enrollment.courseName || `Course ${enrollment.courseId}`
            }
          ];
          saveLocalSubscriptions(updatedSubscriptions);
        }
      }
    } catch (error) {
      console.error('Error auto-subscribing to enrolled courses:', error);
    }
  };

  const disconnectSignalR = async () => {
    try {
      await signalRService.disconnect();
      setIsConnected(false);
      setNotifications([]);
    } catch (error) {
      console.error('Error disconnecting SignalR:', error);
    }
  };

  const joinCourseGroup = useCallback(async (courseId: number): Promise<boolean> => {
    if (!isConnected) return false;
    return await signalRService.joinCourseGroup(courseId);
  }, [isConnected]);

  const leaveCourseGroup = useCallback(async (courseId: number): Promise<boolean> => {
    if (!isConnected) return false;
    return await signalRService.leaveCourseGroup(courseId);
  }, [isConnected]);

  const isSubscribedToCourse = useCallback((courseId: number): boolean => {
    const subscriptions = getLocalSubscriptions();
    const subscription = subscriptions.find(s => s.courseId === courseId);
    return subscription?.isSubscribed ?? false;
  }, [user]);

  const toggleCourseSubscription = useCallback(async (courseId: number, courseName?: string): Promise<void> => {
    const subscriptions = getLocalSubscriptions();
    const existingIndex = subscriptions.findIndex(s => s.courseId === courseId);
    
    if (existingIndex >= 0) {
      // Toggle existing subscription
      subscriptions[existingIndex].isSubscribed = !subscriptions[existingIndex].isSubscribed;
      if (courseName) {
        subscriptions[existingIndex].courseName = courseName;
      }
    } else {
      // Create new subscription
      subscriptions.push({
        courseId,
        isSubscribed: true,
        courseName
      });
    }
    
    saveLocalSubscriptions(subscriptions);
    
    // Update SignalR group membership
    const subscription = subscriptions[existingIndex >= 0 ? existingIndex : subscriptions.length - 1];
    if (subscription.isSubscribed) {
      await joinCourseGroup(courseId);
    } else {
      await leaveCourseGroup(courseId);
    }
  }, [user, joinCourseGroup, leaveCourseGroup]);

  const getAllSubscriptions = useCallback((): LocalNotificationSubscription[] => {
    return getLocalSubscriptions();
  }, [user]);  const markAsRead = useCallback(async (notificationId: number): Promise<void> => {
    try {
      // Update local state immediately for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update local read status cache
      const readStatuses = getLocalReadStatuses();
      readStatuses[notificationId] = true;
      saveLocalReadStatuses(readStatuses);

      // Mark via SignalR if connected (primary method)
      if (isConnected && user) {
        await signalRService.markNotificationAsRead(notificationId, user.id.toString());
      } else {
        // Fallback to REST API if SignalR is not connected
        try {
          await NotificationService.markNotificationAsRead(notificationId);
        } catch (apiError) {
          // If REST API fails with JSON parse error, it might still have worked
          // Log the error but don't throw since local state is already updated
          console.warn('REST API for marking notification as read returned non-JSON response, but operation may have succeeded:', apiError);
        }
      }
    } catch (error) {
      // Revert local state change if there's an error
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: false }
            : notification
        )
      );
      
      // Revert local read status cache
      const readStatuses = getLocalReadStatuses();
      readStatuses[notificationId] = false;
      saveLocalReadStatuses(readStatuses);
      
      console.error('Error marking notification as read:', error);
      throw error; // Re-throw so UI can show error message
    }
  }, [isConnected, user]);  const markAllAsRead = useCallback(async (courseId: number): Promise<void> => {
    try {
      // Get notifications for this course
      const courseNotifications = notifications.filter(n => n.courseId === courseId);
      
      // Update local state immediately for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.courseId === courseId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update local read status cache
      const readStatuses = getLocalReadStatuses();
      courseNotifications.forEach(notification => {
        readStatuses[notification.id] = true;
      });
      saveLocalReadStatuses(readStatuses);

      // Mark via SignalR if connected (primary method)
      if (isConnected && user) {
        await signalRService.markAllNotificationsAsRead(user.id.toString(), courseId);
      } else {
        // Fallback to REST API if SignalR is not connected
        try {
          await NotificationService.markAllNotificationsAsRead(courseId);
        } catch (apiError) {
          // If REST API fails with JSON parse error, it might still have worked
          // Log the error but don't throw since local state is already updated
          console.warn('REST API for marking all notifications as read returned non-JSON response, but operation may have succeeded:', apiError);
        }
      }
    } catch (error) {
      // Revert local state change if there's an error
      setNotifications(prev =>
        prev.map(notification =>
          notification.courseId === courseId
            ? { ...notification, isRead: false }
            : notification
        )
      );
      
      // Revert local read status cache
      const courseNotifications = notifications.filter(n => n.courseId === courseId);
      const readStatuses = getLocalReadStatuses();
      courseNotifications.forEach(notification => {
        readStatuses[notification.id] = false;
      });
      saveLocalReadStatuses(readStatuses);
      
      console.error('Error marking all notifications as read:', error);
      throw error; // Re-throw so UI can show error message
    }
  }, [isConnected, user, notifications]);
  const refreshNotifications = useCallback(async (courseId?: number): Promise<void> => {
    if (!isAuthenticated || !user || !isConnected) return;

    try {
      if (courseId) {        // Get notifications for specific course via SignalR
        const courseNotifications = await signalRService.getCourseNotifications(
          user.id.toString(), 
          courseId
        );
        
        // Apply local read status cache
        const localReadStatuses = getLocalReadStatuses();
        
        // Convert and update notifications for this course
        const convertedNotifications: NotificationResponse[] = courseNotifications.map(n => ({
          ...n,
          isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
          createdById: n.createdById,
          createdByName: n.createdByName
        }));
        
        setNotifications(prev => {
          const filtered = prev.filter(n => n.courseId !== courseId);
          return [...convertedNotifications, ...filtered];
        });
      } else {
        // Get notifications for all subscribed courses
        const subscriptions = getLocalSubscriptions();
        const allNotifications: NotificationResponse[] = [];
        
        for (const subscription of subscriptions) {
          if (subscription.isSubscribed) {
            try {              const courseNotifications = await signalRService.getCourseNotifications(
                user.id.toString(), 
                subscription.courseId
              );
              
              // Apply local read status cache
              const localReadStatuses = getLocalReadStatuses();
              
              // Convert CourseNotification[] to NotificationResponse[]
              const convertedNotifications: NotificationResponse[] = courseNotifications.map(n => ({
                ...n,
                isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
                createdById: n.createdById,
                createdByName: n.createdByName
              }));
              allNotifications.push(...convertedNotifications);
            } catch (error) {
              console.error(`Error loading notifications for course ${subscription.courseId}:`, error);
            }
          }
        }
        
        // Sort by creation date (newest first)
        allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [isAuthenticated, user, isConnected, getLocalSubscriptions]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    joinCourseGroup,
    leaveCourseGroup,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    clearNotifications,
    isSubscribedToCourse,
    toggleCourseSubscription,
    getAllSubscriptions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
