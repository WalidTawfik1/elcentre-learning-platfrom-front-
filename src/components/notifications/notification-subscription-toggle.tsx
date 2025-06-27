import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';

interface NotificationSubscriptionToggleProps {
  courseId: number;
  courseName: string;
  variant?: 'card' | 'inline' | 'button';
  className?: string;
}

export function NotificationSubscriptionToggle({
  courseId,
  courseName,
  variant = 'inline',
  className = ''
}: NotificationSubscriptionToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { isSubscribedToCourse, toggleCourseSubscription, isConnected } = useNotifications();
  const { user, isAuthenticated } = useAuth();

  const isSubscribed = isSubscribedToCourse(courseId);

  const handleToggleSubscription = async (subscribe: boolean) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage notification preferences.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Connection required",
        description: "Please wait for the notification system to connect.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      await toggleCourseSubscription(courseId, courseName);

      toast({
        title: subscribe ? "Notifications enabled" : "Notifications disabled",
        description: subscribe 
          ? `You will now receive notifications for ${courseName}.`
          : `You will no longer receive notifications for ${courseName}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Course Notifications
          </CardTitle>
          <CardDescription>
            Get notified about important updates, assignments, and announcements for this course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Enable notifications for "{courseName}"
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive real-time updates about this course
              </p>
            </div>            <div className="flex items-center gap-2">
              <Switch
                id="notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggleSubscription}
                disabled={isUpdating || !isConnected}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'button') {
    return (      <Button
        variant={isSubscribed ? "default" : "outline"}
        size="sm"
        onClick={() => handleToggleSubscription(!isSubscribed)}
        disabled={isUpdating || !isConnected}
        className={className}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isSubscribed ? (
          <Bell className="h-4 w-4 mr-2" />
        ) : (
          <BellOff className="h-4 w-4 mr-2" />
        )}
        {isSubscribed ? 'Notifications On' : 'Get Notifications'}
      </Button>
    );
  }

  // inline variant (default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <Bell className="h-4 w-4 text-primary" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        <Label htmlFor={`notifications-${courseId}`} className="text-sm cursor-pointer">
          Course notifications
        </Label>
      </div>      <Switch
        id={`notifications-${courseId}`}
        checked={isSubscribed}
        onCheckedChange={handleToggleSubscription}
        disabled={isUpdating || !isConnected}
      />
    </div>
  );
}
