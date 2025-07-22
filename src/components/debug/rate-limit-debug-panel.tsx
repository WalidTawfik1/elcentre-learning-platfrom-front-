import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRateLimitMonitor } from '@/lib/rate-limit-monitor';
import { rateLimiter } from '@/lib/rate-limiter';
import { RefreshCw, Download, Trash2, AlertTriangle } from 'lucide-react';

/**
 * Rate Limit Debug Component
 * Shows current rate limiting status and recent errors
 * Only shown in development mode
 */
export function RateLimitDebugPanel() {
  const { getStats, getRecentErrors, clearErrors, exportErrors } = useRateLimitMonitor();
  const [stats, setStats] = useState(getStats());
  const [recentErrors, setRecentErrors] = useState(getRecentErrors(5));
  const [rateLimiterStatus, setRateLimiterStatus] = useState(rateLimiter.getStatus());

  const refreshData = () => {
    setStats(getStats());
    setRecentErrors(getRecentErrors(5));
    setRateLimiterStatus(rateLimiter.getStatus());
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const data = exportErrors();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-limit-errors-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all rate limit error data?')) {
      clearErrors();
      refreshData();
    }
  };

  // Don't show in production
  if (import.meta.env.PROD) {
    return null;
  }

  const hasRecentErrors = stats.errorsLastHour > 0;

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className={`${hasRecentErrors ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {hasRecentErrors && <AlertTriangle className="h-4 w-4 text-red-500" />}
              Rate Limit Monitor
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={refreshData}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleExport}>
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Rate Limiter Status */}
          <div>
            <h4 className="font-medium mb-1">Active Requests</h4>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={rateLimiterStatus.activeRequests > 0 ? "default" : "secondary"}>
                Active: {rateLimiterStatus.activeRequests}
              </Badge>
              <Badge variant={rateLimiterStatus.queuedRequests > 0 ? "default" : "secondary"}>
                Queued: {rateLimiterStatus.queuedRequests}
              </Badge>
              <Badge variant={rateLimiterStatus.pendingDebounces > 0 ? "default" : "secondary"}>
                Debouncing: {rateLimiterStatus.pendingDebounces}
              </Badge>
            </div>
          </div>

          {/* Error Statistics */}
          <div>
            <h4 className="font-medium mb-1">429 Errors</h4>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={stats.errorsLastHour > 0 ? "destructive" : "secondary"}>
                Last hour: {stats.errorsLastHour}
              </Badge>
              <Badge variant={stats.errorsLast24h > 0 ? "destructive" : "secondary"}>
                Last 24h: {stats.errorsLast24h}
              </Badge>
              <Badge variant="outline">
                Total: {stats.totalErrors}
              </Badge>
            </div>
          </div>

          {/* Most Frequent Endpoints */}
          {stats.mostFrequentEndpoints.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Top Error Endpoints</h4>
              <div className="space-y-1">
                {stats.mostFrequentEndpoints.slice(0, 3).map((endpoint, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="truncate">{endpoint.endpoint}</span>
                    <Badge variant="outline" className="ml-2">
                      {endpoint.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Errors */}
          {recentErrors.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Recent Errors</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentErrors.map((error, index) => (
                  <div key={index} className="text-xs bg-gray-100 p-1 rounded">
                    <div className="flex justify-between">
                      <span className="font-mono">{error.method}</span>
                      <span className="text-gray-500">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="truncate">{error.endpoint}</div>
                    {error.retryCount > 0 && (
                      <div className="text-orange-600">
                        Retry {error.retryCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {hasRecentErrors && (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
              <p className="text-yellow-800 text-xs">
                <strong>Tips to reduce 429 errors:</strong>
                <br />• Increase debounce times for search
                <br />• Reduce polling frequency
                <br />• Batch API requests where possible
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
