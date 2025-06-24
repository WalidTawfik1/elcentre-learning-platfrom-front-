import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Wifi, WifiOff, TestTube } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import { NotificationService, NotificationTypes } from '@/services/notification-service';
import { signalRService } from '@/services/signalr-service';
import { toast } from '@/components/ui/use-toast';

export function NotificationDemo() {
  const { user, isAuthenticated } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    joinCourseGroup, 
    leaveCourseGroup,
    markAsRead,
    markAllAsRead 
  } = useNotifications();

  const [testCourseId] = useState(1); // Use a test course ID
  const [isInGroup, setIsInGroup] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      const status = signalRService.getConnectionStatus();
      setConnectionStatus(status ? 'Connected' : 'Disconnected');
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test notifications.",
        variant: "destructive",
      });
      return;
    }

    const success = await joinCourseGroup(testCourseId);
    if (success) {
      setIsInGroup(true);
      toast({
        title: "Joined Course Group",
        description: `You will now receive notifications for course ${testCourseId}.`,
      });
    } else {
      toast({
        title: "Failed to Join",
        description: "Could not join the course notification group.",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async () => {
    const success = await leaveCourseGroup(testCourseId);
    if (success) {
      setIsInGroup(false);
      toast({
        title: "Left Course Group",
        description: `You will no longer receive notifications for course ${testCourseId}.`,
      });
    } else {
      toast({
        title: "Failed to Leave",
        description: "Could not leave the course notification group.",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = async () => {
    if (!isAuthenticated || user?.userType !== "Instructor") {
      toast({
        title: "Instructor Access Required",
        description: "Only instructors can create test notifications.",
        variant: "destructive",
      });
      return;
    }

    try {      await NotificationService.createCourseNotification({
        title: "Test Notification",
        message: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
        courseId: testCourseId,
        notificationType: NotificationTypes.Announcement
      });

      toast({
        title: "Test Notification Sent",
        description: "A test notification has been sent to all subscribers.",
      });
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: "Could not send test notification.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(testCourseId);
    toast({
      title: "Marked as Read",
      description: "All notifications have been marked as read.",
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Notification System Demo
          </CardTitle>
          <CardDescription>
            Please log in to test the notification system.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Notification System Demo
          </CardTitle>
          <CardDescription>
            Test the real-time notification system for course communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">SignalR Connection</span>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {connectionStatus}
            </Badge>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Logged in as: {user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground">Role: {user?.userType}</p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>{unreadCount} unread notifications</span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Course Group Management</h4>
              <div className="flex gap-2">
                <Button
                  onClick={handleJoinGroup}
                  disabled={isInGroup || !isConnected}
                  size="sm"
                >
                  Join Test Course
                </Button>
                <Button
                  onClick={handleLeaveGroup}
                  disabled={!isInGroup || !isConnected}
                  variant="outline"
                  size="sm"
                >
                  Leave Test Course
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isInGroup ? "✅ Subscribed to course notifications" : "❌ Not subscribed"}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Testing Actions</h4>
              <div className="flex gap-2">
                {user?.userType === "Instructor" && (
                  <Button
                    onClick={handleTestNotification}
                    disabled={!isConnected}
                    size="sm"
                  >
                    Send Test Notification
                  </Button>
                )}
                <Button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  variant="outline"
                  size="sm"
                >
                  Mark All Read
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Ensure you're logged in and SignalR is connected</li>
              <li>Click "Join Test Course" to subscribe to notifications</li>
              <li>If you're an instructor, click "Send Test Notification"</li>
              <li>Check the notification bell in the navbar for real-time updates</li>
              <li>Use "Mark All Read" to clear unread status</li>
            </ol>
          </div>

          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Recent Notifications</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg ${
                      notification.isRead ? 'opacity-60' : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
