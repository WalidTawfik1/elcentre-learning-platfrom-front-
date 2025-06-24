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
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '@/config/api-config';

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: any) => {
    // Mark as read first
    await markAsRead(notification.id);
    
    // Close the dropdown
    setIsOpen(false);
    
    // Navigate to the course learn page with notification hash
    navigate(`/my-courses/${notification.courseId}/learn#notification-${notification.id}`);
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
        return '🔄';
      default:
        return '📬';
    }
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
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message}
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
