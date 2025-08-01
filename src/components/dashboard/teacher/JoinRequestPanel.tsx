import { useEffect, useState } from 'react';
import { X, Clock, RefreshCw, Inbox, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JoinRequestCard } from './JoinRequestCard';

interface JoinRequestWithStudentInfo {
  id: string;
  classId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
  studentInfo: {
    name: string;
    email: string;
  };
  className: string;
}

interface JoinRequestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  requests: JoinRequestWithStudentInfo[];
  isLoading: boolean;
  lastChecked: number | null;
  hasCachedData: boolean;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
  onRefresh: () => void;
  isInCooldown: boolean;
  getCooldownRemaining: () => number;
}

export function JoinRequestPanel({
  isOpen,
  onClose,
  requests,
  isLoading,
  lastChecked,
  hasCachedData,
  onApprove,
  onDeny,
  onRefresh,
  isInCooldown,
  getCooldownRemaining
}: JoinRequestPanelProps) {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Update cooldown timer
  useEffect(() => {
    if (!isInCooldown) {
      setCooldownSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isInCooldown, getCooldownRemaining]);

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full bg-background border-l shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-full sm:w-[400px] lg:w-[420px]
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Join Requests</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lastChecked && (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatTimeAgo(lastChecked)}</span>
                    {hasCachedData && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        Cached
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Checking for requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {/* Status bar for cached data */}
              {hasCachedData && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Clock className="w-4 h-4" />
                      <span>
                        {requests.length} request{requests.length !== 1 ? 's' : ''} • 
                        Updated {formatTimeAgo(lastChecked!)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRefresh}
                      disabled={isInCooldown}
                      className="text-xs h-7"
                    >
                      {isInCooldown ? (
                        <>Refresh in {cooldownSeconds}s</>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Request Cards */}
              {requests.map((request) => (
                <JoinRequestCard
                  key={request.id}
                  request={request}
                  onApprove={onApprove}
                  onDeny={onDeny}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Pending Requests
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                {lastChecked ? (
                  <>
                    Last checked {formatTimeAgo(lastChecked)}. All students have been processed.
                  </>
                ) : (
                  'No students are currently waiting to join your classes.'
                )}
              </p>
              
              {/* Cooldown info */}
              {isInCooldown && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                  <p className="text-sm text-orange-800">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Refresh available in {cooldownSeconds} seconds
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {requests.length > 0 && (
          <div className="border-t p-4 bg-card">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isInCooldown}
              className="w-full"
            >
              {isInCooldown ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Refresh in {cooldownSeconds}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for New Requests
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}