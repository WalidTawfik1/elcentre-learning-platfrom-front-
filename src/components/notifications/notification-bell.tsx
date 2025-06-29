import React, { useState } from 'react';
import { Bell, BellRing, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '@/config/api-config';
import { NotificationTypes } from '@/services/notification-service';

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: any) => {
    const isInstructor = user?.userType === 'Instructor' || user?.userType === 'Admin'; 
    // Mark as read first
    await markAsRead(notification.id);
    
    // Close the dropdown
    setIsOpen(false);
    
    // Determine navigation based on notification type and user role
    const navigateToNotification = () => {
      const notificationType = notification.notificationType;
      
      
      // Course status notifications for instructors should go to course edit page
      if (isInstructor && (
        notificationType === NotificationTypes.CourseApproved ||
        notificationType === NotificationTypes.CourseRejected ||
        notificationType === NotificationTypes.CoursePendingReview
      )) {
        // Navigate to course edit page
        navigate(`/dashboard/instructor/courses/${notification.courseId}/edit`);
        return;
      }
      
      // Course update notifications for instructors should also go to course edit
      if (isInstructor && notificationType === NotificationTypes.CourseUpdate) {
        navigate(`/dashboard/instructor/courses/${notification.courseId}/edit`);
        return;
      }
      
      // Q&A notifications should go to appropriate Q&A section based on user type
      if (notificationType === 'NewQuestion' || notificationType === 'NewAnswer' || 
          notificationType === NotificationTypes.NewQuestion || notificationType === NotificationTypes.NewAnswer) {
        
        if (isInstructor) {
          // Instructors should go to course viewing mode (like students but read-only)
          if (notification.questionId) {
            const url = `/my-courses/${notification.courseId}/learn?instructor=true#question-${notification.questionId}`;
            navigate(url, { state: { activeTab: 'qa' } });
          } else if (notification.answerId) {
            const url = `/my-courses/${notification.courseId}/learn?instructor=true#answer-${notification.answerId}`;
            navigate(url, { state: { activeTab: 'qa' } });
          } else {
            // Fallback to course viewing page with Q&A tab
            const url = `/my-courses/${notification.courseId}/learn?instructor=true`;
            navigate(url, { state: { activeTab: 'qa' } });
          }
        } else {
          // Students go to learn page Q&A section
          if (notification.questionId) {
            const url = `/my-courses/${notification.courseId}/learn#question-${notification.questionId}`;
            navigate(url, { state: { activeTab: 'qa' } });
          } else if (notification.answerId) {
            const url = `/my-courses/${notification.courseId}/learn#answer-${notification.answerId}`;
            navigate(url, { state: { activeTab: 'qa' } });
          } else {
            // Fallback to Q&A tab if no specific ID
            const url = `/my-courses/${notification.courseId}/learn`;
            navigate(url, { state: { activeTab: 'qa' } });
          }
        }
        return;
      }
      
      // For other notifications, navigate based on user type
      if (isInstructor) {
        // Instructors go to course viewing mode for general notifications
        const url = `/my-courses/${notification.courseId}/learn?instructor=true#notification-${notification.id}`;
        navigate(url, { state: { activeTab: 'notifications' } });
      } else {
        // Students go to course learn page announcements
        const url = `/my-courses/${notification.courseId}/learn#notification-${notification.id}`;
        navigate(url, { state: { activeTab: 'notifications' } });
      }
    };
    
    navigateToNotification();
  };

  const handleMarkAsRead = async (notificationId: number, courseId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    // Get unique course IDs from unread notifications
    const courseIds = [...new Set(
      notifications
        .filter(n => !n.isRead)
        .map(n => n.courseId)
    )];

    // Mark all as read for each course
    for (const courseId of courseIds) {
      await markAllAsRead(courseId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment':
        return '📝';
      case 'announcement':
        return '📢';
      case 'reminder':
        return '⏰';
      case 'update':
      case 'courseupdate':
        return '🔄';
      case 'courseapproved':
        return '✅';
      case 'courserejected':
        return '❌';
      case 'coursependingreview':
        return '⏳';
      case 'newlesson':
        return '📚';
      case 'newquestion':
        return '❓';
      case 'newanswer':
        return '💬';
      case 'quizavailable':
        return '📝';
      case 'gradeposted':
        return '🎯';
      case 'enrollmentconfirmed':
        return '🎓';
      case 'certificateready':
        return '🏆';
      case 'welcome':
        return '👋';
      default:
        return '📬';
    }
  };

  const getNotificationActionHint = (notification: any) => {
    const isInstructor = user?.userType === 'Instructor' || user?.userType === 'Admin';
    const notificationType = notification.notificationType;
    
    if (isInstructor && (
      notificationType === NotificationTypes.CourseApproved ||
      notificationType === NotificationTypes.CourseRejected ||
      notificationType === NotificationTypes.CoursePendingReview ||
      notificationType === NotificationTypes.CourseUpdate
    )) {
      return 'Click to edit course';
    }
    
    // Q&A specific hints
    if (notificationType === 'NewQuestion' || notificationType === NotificationTypes.NewQuestion) {
      return 'Click to view question';
    }
    
    if (notificationType === 'NewAnswer' || notificationType === NotificationTypes.NewAnswer) {
      return 'Click to view answer';
    }
    
    return 'Click to view';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {isConnected ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <>
            {unreadCount > 0 && (
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read ({unreadCount})
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
              <ScrollArea className="h-[400px]">
              {notifications.map((notification) => (                <DropdownMenuItem 
                  key={notification.id} 
                  className="p-0 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >                  <Card className={`w-full border-0 shadow-none ${
                    notification.isRead ? 'opacity-60' : 'bg-blue-50/50'
                  }`}>
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">
                            {getNotificationIcon(notification.notificationType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium line-clamp-1 mb-1">
                              {notification.title}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">                              <div className="flex items-center gap-1">
                                {notification.creatorImage && (
                                  <img 
                                    src={getImageUrl(notification.creatorImage)} 
                                    alt={notification.createdByName}
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  />
                                )}
                                <span className="font-medium">{notification.createdByName}</span>
                              </div>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="truncate">{notification.courseName}</span>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {getNotificationActionHint(notification)}
                      </p>
                    </CardContent>
                  </Card>
                </DropdownMenuItem>              ))}
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
