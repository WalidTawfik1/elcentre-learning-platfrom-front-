import React from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionStatus() {
  const { isConnected, isRateLimited, connectionStatus, forceReconnect } = useNotifications();

  if (!isRateLimited && isConnected) {
    return null; // Don't show anything when everything is working fine
  }

  const handleForceReconnect = async () => {
    await forceReconnect();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {isRateLimited && (
        <Alert variant="destructive" className="mb-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <div>
                Connection rate limited. Recovery attempts in progress...
                {connectionStatus.reconnectAttempts > 0 && (
                  <span className="block text-xs mt-1">
                    Recovery attempts: {connectionStatus.reconnectAttempts}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleForceReconnect}
                className="w-fit bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Force Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {!isConnected && !isRateLimited && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col gap-2">
              <div>Notifications disconnected. Attempting to reconnect...</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleForceReconnect}
                className="w-fit"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
