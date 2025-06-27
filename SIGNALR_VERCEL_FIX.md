# SignalR Notification System - Vercel Deployment Fix

## Issue Description
The notification system was working locally but not on Vercel deployment. This is because SignalR WebSocket connections cannot be proxied through Vercel's standard rewrite functionality.

## Root Cause
1. **WebSocket Proxy Limitation**: Vercel's rewrite rules work for HTTP requests but not for WebSocket connections
2. **Configuration Issue**: The production build was trying to use `/api` prefix for SignalR, which routes through the proxy
3. **Mixed Content**: HTTPS frontend trying to connect to HTTP WebSocket endpoints

## Solution Implemented

### 1. API Configuration Update
Updated `src/config/api-config.ts` to always use direct API URL for SignalR connections:

```typescript
// Direct API URL for SignalR - bypasses proxy for WebSocket connections
export const DIRECT_API_URL = import.meta.env.VITE_API_BASE_URL || FALLBACK_API_URL;
```

### 2. Environment Variables
- Production: `VITE_API_BASE_URL=https://elcentre-api.runasp.net`
- Development: Uses localhost or configured URL

### 3. SignalR Configuration
- Uses direct API URL for hub connections
- Enables all transport types (WebSockets, SSE, Long Polling)
- Proper CORS configuration with `withCredentials: false`
- Enhanced error logging for debugging

### 4. Transport Fallback Strategy
SignalR will automatically try:
1. WebSockets (preferred)
2. Server-Sent Events (fallback)
3. Long Polling (final fallback)

## Backend Requirements
The backend API must have proper CORS configuration for SignalR:

```csharp
// In Program.cs or Startup.cs
app.UseCors(builder =>
{
    builder.WithOrigins("https://elcentre-learn.vercel.app", "http://localhost:5173")
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials();
});

// SignalR Hub mapping
app.MapHub<NotificationsHub>("/hubs/notifications");
```

## Verification Steps
1. Deploy to Vercel
2. Check browser console for SignalR connection logs
3. Verify WebSocket connection in Network tab
4. Test notification functionality

## Troubleshooting
If notifications still don't work:

1. **Check Browser Console**: Look for SignalR connection errors
2. **Network Tab**: Verify WebSocket connection to `wss://elcentre-api.runasp.net/hubs/notifications`
3. **Backend CORS**: Ensure backend allows requests from Vercel domain
4. **HTTPS**: Ensure backend supports HTTPS/WSS connections

## Environment Variables Required for Deployment
Add to Vercel environment variables:
- `VITE_API_BASE_URL=https://elcentre-api.runasp.net`

## Key Changes Made
1. ✅ Fixed `DIRECT_API_URL` to bypass proxy for SignalR
2. ✅ Enhanced error logging for debugging
3. ✅ Added transport fallback strategy
4. ✅ Updated CORS configuration
5. ✅ Created environment variable documentation

This fix ensures that SignalR connections work both locally and on Vercel by using direct connections to the backend API for WebSocket communications while still using the proxy for regular HTTP API calls.
