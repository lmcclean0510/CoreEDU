import { useState, useEffect } from 'react';
import { LoaderCircle, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface JoinRequestsButtonProps {
  onClick: () => void;
  isLoading: boolean;
  isInCooldown: boolean;
  cooldownSeconds: number;
  className?: string;
}

export function JoinRequestsButton({
  onClick,
  isLoading,
  isInCooldown,
  cooldownSeconds,
  className
}: JoinRequestsButtonProps) {
  const [isTimerAnimatingOut, setIsTimerAnimatingOut] = useState(false);
  const [prevCooldownSeconds, setPrevCooldownSeconds] = useState(cooldownSeconds);

  // Detect when cooldown ends to trigger slide-out animation
  useEffect(() => {
    if (prevCooldownSeconds > 0 && cooldownSeconds === 0 && !isInCooldown) {
      setIsTimerAnimatingOut(true);
      const timeout = setTimeout(() => setIsTimerAnimatingOut(false), 500);
      return () => clearTimeout(timeout);
    }
    setPrevCooldownSeconds(cooldownSeconds);
  }, [cooldownSeconds, isInCooldown, prevCooldownSeconds]);

  const showTimer = isInCooldown || isTimerAnimatingOut;
  const isDisabled = isLoading || isInCooldown;
  const shouldPulseButton = !isInCooldown && !isTimerAnimatingOut && prevCooldownSeconds > 0 && cooldownSeconds === 0;

  return (
    <>
      {/* Component-scoped animations */}
      <style jsx>{`
        @keyframes button-ready-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes timer-slide-out {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translateX(10px) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateX(20px) scale(0.6);
          }
        }
        
        @keyframes timer-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(0.95);
            opacity: 0.8;
          }
        }
        
        .button-ready-pulse {
          animation: button-ready-pulse 0.6s ease-in-out;
        }
        
        .timer-slide-out {
          animation: timer-slide-out 0.5s ease-in-out forwards;
        }
        
        .timer-pulse {
          animation: timer-pulse 1s ease-in-out infinite;
        }
      `}</style>

      <div className={cn("flex items-center gap-3", className)}>
        {/* Cooldown Timer */}
        {showTimer && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md",
            "bg-orange-50 border border-orange-200 text-orange-700",
            "transition-all duration-300 ease-in-out select-none",
            cooldownSeconds <= 3 && cooldownSeconds > 0 && !isTimerAnimatingOut && "timer-pulse",
            isTimerAnimatingOut && "timer-slide-out"
          )}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="text-sm font-medium tabular-nums min-w-[20px]">
              {Math.max(0, cooldownSeconds)}s
            </span>
          </div>
        )}
        
        {/* Main Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            isDisabled ? "opacity-60 cursor-not-allowed" : "hover:scale-105 active:scale-95",
            shouldPulseButton && "button-ready-pulse"
          )}
        >
          {isLoading ? (
            <>
              <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              <span>Join Requests</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}