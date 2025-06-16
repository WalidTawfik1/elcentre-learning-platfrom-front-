import React, { useState } from 'react';
import { Send, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { NotificationService, CreateNotificationRequest } from '@/services/notification-service';

interface CreateNotificationFormProps {
  courseId: number;
  courseName: string;
  variant?: 'dialog' | 'card';
  className?: string;
  onNotificationCreated?: () => void;
}

const notificationTypes = [
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'assignment', label: 'Assignment', icon: '📝' },
  { value: 'reminder', label: 'Reminder', icon: '⏰' },
  { value: 'update', label: 'Course Update', icon: '🔄' },
  { value: 'deadline', label: 'Deadline', icon: '📅' },
  { value: 'general', label: 'General', icon: '📬' },
];

export function CreateNotificationForm({
  courseId,
  courseName,
  variant = 'dialog',
  className = '',
  onNotificationCreated
}: CreateNotificationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notificationType: 'general'
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const notification: CreateNotificationRequest = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        courseId,
        notificationType: formData.notificationType
      };

      await NotificationService.createCourseNotification(notification);

      toast({
        title: "Notification sent!",
        description: "Your notification has been sent to all enrolled students.",
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        notificationType: 'general'
      });

      // Close dialog if it's a dialog variant
      if (variant === 'dialog') {
        setIsOpen(false);
      }

      // Call callback if provided
      if (onNotificationCreated) {
        onNotificationCreated();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const NotificationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Notification Title</Label>
        <Input
          id="title"
          placeholder="Enter notification title..."
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Notification Type</Label>
        <Select
          value={formData.notificationType}
          onValueChange={(value) => handleInputChange('notificationType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select notification type" />
          </SelectTrigger>
          <SelectContent>
            {notificationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Enter your notification message..."
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          rows={4}
          maxLength={500}
        />
        <div className="text-xs text-muted-foreground text-right">
          {formData.message.length}/500 characters
        </div>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg">
        <p className="text-sm text-muted-foreground">
          This notification will be sent to all students enrolled in "{courseName}".
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Send Notification
      </Button>
    </form>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Course Notification
          </CardTitle>
          <CardDescription>
            Notify all enrolled students about important updates, assignments, or announcements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm />
        </CardContent>
      </Card>
    );
  }

  // dialog variant (default)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Bell className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Course Notification</DialogTitle>
          <DialogDescription>
            Send a notification to all students enrolled in "{courseName}".
          </DialogDescription>
        </DialogHeader>
        <NotificationForm />
      </DialogContent>
    </Dialog>
  );
}
