import React from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const { isConnected, isRateLimited, connectionStatus } = useNotifications();

  if (!isRateLimited && isConnected) {
    return null; // Don't show anything when everything is working fine
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {isRateLimited && (
        <Alert variant="destructive" className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connection rate limited. Retrying in a moment...
            {connectionStatus.reconnectAttempts > 0 && (
              <span className="block text-xs mt-1">
                Reconnect attempts: {connectionStatus.reconnectAttempts}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {!isConnected && !isRateLimited && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Notifications disconnected. Attempting to reconnect...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
