// Notification Components
export { NotificationBell } from './notification-bell';
export { NotificationSubscriptionToggle } from './notification-subscription-toggle';
export { CreateNotificationForm } from './create-notification-form';
export { NotificationDemo } from './notification-demo';

// Re-export types
export type { CourseNotification } from '@/services/signalr-service';
export type { 
  CreateNotificationRequest, 
  NotificationResponse, 
  NotificationSubscription 
} from '@/services/notification-service';
