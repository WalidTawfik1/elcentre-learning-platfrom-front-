import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { signalRService, CourseNotification } from '@/services/signalr-service';
import { NotificationService, NotificationResponse } from '@/services/notification-service';
import { EnrollmentService } from '@/services/enrollment-service';
import { CourseService } from '@/services/course-service';
import { useAuth } from './use-auth';
import { SIGNALR_CONFIG } from '@/config/api-config';
import { useRateLimiter } from '@/lib/rate-limiter';

// Local subscription management (stored in localStorage)
interface LocalNotificationSubscription {
  courseId: number;
  isSubscribed: boolean;
  courseName?: string;
}

interface NotificationContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  fastUnreadCount: number; // Immediate unread count via REST API
  isConnected: boolean;
  isRateLimited: boolean;
  connectionStatus: { isConnected: boolean; isRateLimited: boolean; reconnectAttempts: number };
  joinCourseGroup: (courseId: number) => Promise<boolean>;
  leaveCourseGroup: (courseId: number) => Promise<boolean>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: (courseId: number) => Promise<void>;
  refreshNotifications: (courseId?: number) => Promise<void>;
  clearNotifications: () => void;
  // Rate limit recovery
  forceReconnect: () => Promise<void>;
  // Local subscription management
  isSubscribedToCourse: (courseId: number) => boolean;
  toggleCourseSubscription: (courseId: number, courseName?: string) => Promise<void>;
  getAllSubscriptions: () => LocalNotificationSubscription[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ isConnected: false, isRateLimited: false, reconnectAttempts: 0 });
  const { user, isAuthenticated } = useAuth();
  const { backgroundRequest } = useRateLimiter();
  
  // Refs to prevent duplicate requests
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const courseCacheRef = useRef<{ instructor?: any[], student?: any[], timestamp?: number }>({});
  const initializingRef = useRef(false);
  
  // Rate limiting: minimum 30 seconds between full notification reloads
  const MIN_RELOAD_INTERVAL = 30000;
  // Cache duration: 2 minutes for course data
  const COURSE_CACHE_DURATION = 120000;
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
      return {};
    }
  };

  const saveLocalReadStatuses = (statuses: Record<number, boolean>) => {
    const key = getReadStatusKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(statuses));
    } catch (error) {
      // Silent error handling
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
      return [];
    }
  };

  const saveLocalSubscriptions = (subscriptions: LocalNotificationSubscription[]) => {
    const key = getSubscriptionsKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(subscriptions));
    } catch (error) {
      // Silent error handling
    }
  };

  // FAST PATH: Load notifications immediately via REST API (no SignalR dependency)
  const loadNotificationsImmediate = async () => {
    if (!user) return;

    try {
      let allNotifications: NotificationResponse[] = [];

      // For instructors, prioritize loading ALL notifications to ensure course status updates are included
      if (user?.userType === "Instructor") {
        try {
          const instructorNotifications = await NotificationService.getAllNotificationsOptimized();
          
          // Apply local read status cache
          const localReadStatuses = getLocalReadStatuses();
          const convertedNotifications: NotificationResponse[] = instructorNotifications.map(n => ({
            ...n,
            isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
          }));
          
          allNotifications.push(...convertedNotifications);
        } catch (error) {
          // Fall back to course-based loading below
        }
      }

      // For students or as fallback for instructors, load course-specific notifications
      if (user?.userType === "Student" || (user?.userType === "Instructor" && allNotifications.length === 0)) {
        // Auto-subscribe to courses first
        if (user?.userType === "Student") {
          await autoSubscribeToEnrolledCourses();
        } else if (user?.userType === "Instructor") {
          await autoSubscribeToInstructorCourses();
        }

        const subscriptions = getLocalSubscriptions();
        
        // Use REST API to load notifications for subscribed courses
        const courseNotificationPromises = subscriptions
          .filter(sub => sub.isSubscribed)
          .map(async (subscription) => {
            try {
              const courseNotifications = await NotificationService.getCourseNotifications(subscription.courseId, false);
              
              // Apply local read status cache
              const localReadStatuses = getLocalReadStatuses();
              return courseNotifications.map(n => ({
                ...n,
                isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
              }));
            } catch (error) {
              return [];
            }
          });

        const courseNotificationResults = await Promise.allSettled(courseNotificationPromises);
        
        courseNotificationResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allNotifications.push(...result.value);
          }
        });
      }

      // Sort by creation date (newest first) and set notifications immediately
      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(allNotifications);

    } catch (error) {
      // Silently handle notification loading errors
    }
  };

  // FAST PATH: Get unread count immediately via REST API (no SignalR dependency)
  const [fastUnreadCount, setFastUnreadCount] = useState<number>(0);

  const updateUnreadCountImmediate = useCallback(async () => {
    if (!isAuthenticated || !user || loadingRef.current) return;

    // Prevent duplicate rapid calls
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 5000) { // 5 second minimum interval
      return;
    }
    
    loadingRef.current = true;
    lastLoadTimeRef.current = now;

    try {
      const result = await backgroundRequest(
        () => NotificationService.getUnreadCount(),
        'unread-count-update',
        5000 // 5 second debounce
      );
      setFastUnreadCount(result.unreadCount);
    } catch (error) {
      // Fallback to local calculation
      const localUnreadCount = notifications.filter(n => !n.isRead).length;
      setFastUnreadCount(localUnreadCount);
    } finally {
      loadingRef.current = false;
    }
  }, [isAuthenticated, user, notifications, backgroundRequest]);

  // Update unread count immediately when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      updateUnreadCountImmediate();
    } else {
      setFastUnreadCount(0);
    }
  }, [isAuthenticated, user, updateUnreadCountImmediate]);

  // Also update when notifications change
  useEffect(() => {
    const localUnreadCount = notifications.filter(n => !n.isRead).length;
    setFastUnreadCount(localUnreadCount);
  }, [notifications]);

  // Initialize notifications and SignalR connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // FAST PATH: Load notifications immediately via REST API (don't wait for SignalR)
      loadNotificationsImmediate();
      
      // PARALLEL: Initialize SignalR for real-time updates
      initializeSignalR();
    } else {
      // Don't disconnect completely, just stop maintaining connection
      signalRService.stopMaintainingConnection();
      setIsConnected(false);
      setNotifications([]);
    }

    // Cleanup on unmount - but keep connection alive for other components
    return () => {
      // Don't disconnect here as other components might need the connection
      // Only clean up the notification callback
      signalRService.setNotificationCallback(() => {});
    };
  }, [isAuthenticated, user]);  const initializeSignalR = async () => {
    // Prevent multiple simultaneous initialization attempts
    if (initializingRef.current) {
      return;
    }
    
    initializingRef.current = true;
    
    try {
      // Check if already rate limited before attempting connection
      if (signalRService.isRateLimitActive()) {
        setIsConnected(false);
        // Attempt to force recovery when initializing
        signalRService.forceRateLimitRecovery();
        return;
      }

      // Start maintaining connection globally
      signalRService.startMaintainingConnection();
      
      const connected = await signalRService.connect();
      setIsConnected(connected);

      if (connected) {
        // Set up callback for new notifications (real-time updates)
        signalRService.setNotificationCallback((notification: CourseNotification) => {
          // Convert CourseNotification to NotificationResponse format
          const notificationResponse: NotificationResponse = {
            ...notification,
            isRead: notification.isRead ?? false, // Default to false if not provided
          };
          setNotifications(prev => [notificationResponse, ...prev]);
        });

        // Auto-subscribe users to their relevant courses if they haven't manually set preferences
        if (user?.userType === "Student") {
          await autoSubscribeToEnrolledCourses();
        } else if (user?.userType === "Instructor") {
          await autoSubscribeToInstructorCourses();
        }

        // Auto-join all subscribed course groups for real-time notifications
        const subscriptions = getLocalSubscriptions();
        for (const subscription of subscriptions) {
          if (subscription.isSubscribed) {
            await signalRService.joinCourseGroup(subscription.courseId);
          }
        }
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      initializingRef.current = false;
    }
  };

  const autoSubscribeToEnrolledCourses = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (courseCacheRef.current.student && 
          courseCacheRef.current.timestamp && 
          (now - courseCacheRef.current.timestamp) < COURSE_CACHE_DURATION) {
        return;
      }

      const enrollments = await backgroundRequest(
        () => EnrollmentService.getStudentEnrollments(),
        'student-enrollments-subscription',
        10000 // 10 second debounce for this specific call
      );
      
      // Cache the result
      courseCacheRef.current = {
        ...courseCacheRef.current,
        student: enrollments,
        timestamp: now
      };
      
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
      // Silent error handling
    }
  };

  const autoSubscribeToInstructorCourses = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (courseCacheRef.current.instructor && 
          courseCacheRef.current.timestamp && 
          (now - courseCacheRef.current.timestamp) < COURSE_CACHE_DURATION) {
        return;
      }

      const instructorCourses = await backgroundRequest(
        () => CourseService.getInstructorCourses(),
        'instructor-courses-subscription',
        10000 // 10 second debounce for this specific call
      );
      
      // Cache the result
      courseCacheRef.current = {
        ...courseCacheRef.current,
        instructor: instructorCourses,
        timestamp: now
      };
      
      const currentSubscriptions = getLocalSubscriptions();
      
      for (const course of instructorCourses) {
        const existingSubscription = currentSubscriptions.find(
          sub => sub.courseId === course.id
        );
        
        // If no subscription exists for this course, create one (subscribed by default)
        if (!existingSubscription) {
          const updatedSubscriptions = [
            ...currentSubscriptions,
            {
              courseId: course.id,
              isSubscribed: true,
              courseName: course.title || `Course ${course.id}`
            }
          ];
          saveLocalSubscriptions(updatedSubscriptions);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  // Monitor connection status changes
  useEffect(() => {
    const checkConnection = () => {
      const status = signalRService.getConnectionStatus();
      setConnectionStatus(status);
      if (status.isConnected !== isConnected) {
        setIsConnected(status.isConnected);
      }
    };

    const interval = setInterval(checkConnection, SIGNALR_CONFIG.connectionCheckInterval);
    return () => clearInterval(interval);
  }, [isConnected]);

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
      saveLocalReadStatuses(readStatuses);      // Mark via SignalR if connected (primary method)
      if (isConnected && user) {
        await signalRService.markNotificationAsRead(notificationId, user.id.toString());
      } else {
        // Fallback to REST API if SignalR is not connected
        try {
          await NotificationService.markNotificationAsRead(notificationId);
        } catch (apiError) {
          // If REST API fails with JSON parse error, it might still have worked
          // Log the error but don't throw since local state is already updated
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
      saveLocalReadStatuses(readStatuses);      // Mark via SignalR if connected (primary method)
      if (isConnected && user) {
        await signalRService.markAllNotificationsAsRead(user.id.toString(), courseId);
      } else {
        // Fallback to REST API if SignalR is not connected
        try {
          await NotificationService.markAllCourseNotificationsAsRead(courseId);
        } catch (apiError) {
          // If REST API fails with JSON parse error, it might still have worked
          // Log the error but don't throw since local state is already updated
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
      
      throw error; // Re-throw so UI can show error message
    }
  }, [isConnected, user, notifications]);
  const refreshNotifications = useCallback(async (courseId?: number): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      if (courseId) {
        // Get notifications for specific course via REST API (faster, no SignalR dependency)
        try {
          const courseNotifications = await NotificationService.getCourseNotifications(courseId, false);
          
          // Apply local read status cache
          const localReadStatuses = getLocalReadStatuses();
          
          // Convert and update notifications for this course
          const convertedNotifications: NotificationResponse[] = courseNotifications.map(n => ({
            ...n,
            isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
          }));
          
          setNotifications(prev => {
            const filtered = prev.filter(n => n.courseId !== courseId);
            return [...convertedNotifications, ...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
        } catch (error) {
          // Fallback to SignalR if available
          if (isConnected) {
            const courseNotifications = await signalRService.getCourseNotifications(
              user.id.toString(), 
              courseId
            );
            
            const localReadStatuses = getLocalReadStatuses();
            const convertedNotifications: NotificationResponse[] = courseNotifications.map(n => ({
              ...n,
              isRead: localReadStatuses[n.id] !== undefined ? localReadStatuses[n.id] : (n.isRead ?? false),
            }));
            
            setNotifications(prev => {
              const filtered = prev.filter(n => n.courseId !== courseId);
              return [...convertedNotifications, ...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
          }
        }
      } else {
        // Refresh all notifications - use the fast immediate loading method
        await loadNotificationsImmediate();
      }
    } catch (error) {
      // Silent error handling
    }
  }, [isAuthenticated, user, isConnected, getLocalReadStatuses, saveLocalReadStatuses, getLocalSubscriptions, loadNotificationsImmediate]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Force reconnect function
  const forceReconnect = useCallback(async () => {
    
    try {
      // First try force rate limit recovery if rate limited
      if (connectionStatus.isRateLimited) {
        signalRService.forceRateLimitRecovery();
      } else {
        // If not rate limited, try a full reinitialize
        signalRService.reinitialize();
      }
      
      // Wait a moment and check connection status
      setTimeout(() => {
        const newStatus = signalRService.getConnectionStatus();
        setConnectionStatus(newStatus);
        setIsConnected(newStatus.isConnected);
      }, 2000);
      
    } catch (error) {
      // Silent error handling
    }
  }, [connectionStatus.isRateLimited]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    fastUnreadCount,
    isConnected,
    isRateLimited: connectionStatus.isRateLimited,
    connectionStatus,
    joinCourseGroup,
    leaveCourseGroup,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    clearNotifications,
    forceReconnect,
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
