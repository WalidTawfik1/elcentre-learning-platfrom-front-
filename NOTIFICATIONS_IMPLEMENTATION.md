# Real-time Notifications Implementation

This document describes the implementation of real-time notifications using SignalR in the ElCentre Learning Platform.

## Overview

The notification system allows instructors to send real-time notifications to enrolled students in their courses. Students can subscribe/unsubscribe to course notifications and receive updates about assignments, announcements, and other important course information.

## Features

### For Students:
- **Notification Bell**: Real-time notification indicator in the navbar
- **Subscription Toggle**: Option to enable/disable notifications for each enrolled course
- **Real-time Updates**: Instant notifications via SignalR connection
- **Notification History**: View past notifications with read/unread status

### For Instructors:
- **Create Notifications**: Send announcements to all enrolled students
- **Multiple Types**: Support for different notification types (announcement, assignment, reminder, etc.)
- **Course Management**: Integrated into course content management interface

## Technical Implementation

### Backend Integration
The system connects to a SignalR hub at `{BASE_API}/hubs/notifications` with the following methods:

#### Hub Methods:
- `JoinCourseGroup(courseId)` - Join notifications for a specific course
- `LeaveCourseGroup(courseId)` - Leave notifications for a specific course
- `GetCourseNotifications(userId, courseId, unreadOnly)` - Retrieve notifications
- `MarkCourseNotificationAsRead(notificationId, userId)` - Mark as read
- `MarkAllCourseNotificationsAsRead(userId, courseId)` - Mark all as read

#### Hub Events:
- `ReceiveCourseNotification` - Triggered when new notifications are sent

### API Endpoints:
- `POST /Notifications/create-course-notification` - Create notification (instructors)
- `GET /Notifications/get-course-notifications/{courseId}` - Get course notifications
- `POST /Notifications/mark-notification-asread/{notificationId}` - Mark as read
- `POST /Notifications/mark-all-notifications-asread/{courseId}` - Mark all as read

## Components

### Core Services
- **SignalRService** (`src/services/signalr-service.ts`): Manages SignalR connection and hub communication
- **NotificationService** (`src/services/notification-service.ts`): Handles API calls for notifications

### React Components
- **NotificationBell** (`src/components/notifications/notification-bell.tsx`): Navbar notification indicator
- **NotificationSubscriptionToggle** (`src/components/notifications/notification-subscription-toggle.tsx`): Course subscription toggle
- **CreateNotificationForm** (`src/components/notifications/create-notification-form.tsx`): Instructor notification creation

### Hooks
- **useNotifications** (`src/hooks/use-notifications.tsx`): React context for notification state management

## Integration Points

### Student Experience:
1. **Course Detail Page**: Subscription toggle for enrolled students
2. **Course Learning Page**: Subscription management in sidebar
3. **Navbar**: Real-time notification bell with dropdown

### Instructor Experience:
1. **Course Management**: Notification creation in content management interface
2. **Real-time Delivery**: Notifications sent instantly to subscribed students

## Authentication

All API endpoints and SignalR connections use Bearer token authentication. The JWT token is automatically included in:
- API request headers
- SignalR connection setup

## Usage Examples

### For Students:
1. Enroll in a course
2. Toggle notification subscription on course detail or learning pages
3. Receive real-time notifications in the notification bell
4. Click notifications to mark as read

### For Instructors:
1. Navigate to course content management
2. Go to "Notifications" tab
3. Create and send notifications to enrolled students
4. Students receive notifications instantly if subscribed

## Configuration

### Environment Variables:
- `VITE_API_BASE_URL`: Base API URL for SignalR hub connection

### Dependencies:
- `@microsoft/signalr`: SignalR client library
- `date-fns`: Date formatting for notification timestamps

## File Structure

```
src/
├── components/
│   └── notifications/
│       ├── notification-bell.tsx
│       ├── notification-subscription-toggle.tsx
│       └── create-notification-form.tsx
├── hooks/
│   └── use-notifications.tsx
├── services/
│   ├── signalr-service.ts
│   └── notification-service.ts
└── pages/
    ├── courses/course-detail.tsx (updated)
    ├── my-courses/[id]/learn.tsx (updated)
    └── dashboard/instructor/courses/[id]/content.tsx (updated)
```

## Error Handling

The system includes comprehensive error handling for:
- SignalR connection failures
- API request errors
- Network interruptions
- Authentication issues

Fallback mechanisms ensure users can still access notifications via HTTP API even if real-time connection fails.

## Performance Considerations

- SignalR connections are managed per user session
- Automatic reconnection with exponential backoff
- Course groups prevent unnecessary message broadcasting
- Notifications are paginated and limited to recent items

## Security

- JWT authentication for all communications
- Course enrollment verification for subscriptions
- Instructor verification for notification creation
- Input validation and sanitization

## Future Enhancements

Potential future features could include:
- Email notification fallback
- Push notifications for mobile
- Notification categories and filtering
- Bulk notification management
- Analytics for notification engagement
