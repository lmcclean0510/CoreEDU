"use client";

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/shared/use-toast';

interface GameContainerProps {
  isActive: boolean;
  enableFullscreen?: boolean;
  onFullscreenExit?: () => void;
  children: React.ReactNode;
}

/**
 * GameContainer - Handles full-screen gameplay
 * 
 * When isActive is true and enableFullscreen is true:
 * - Requests fullscreen mode
 * - Renders children in a full-screen container
 * - Exits game on fullscreen exit
 * 
 * When isActive is false:
 * - Exits fullscreen mode
 * - Returns null (parent shows menu/setup in normal layout)
 */
export function GameContainer({ 
  isActive, 
  enableFullscreen = true,
  onFullscreenExit,
  children 
}: GameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle fullscreen on game start
  useEffect(() => {
    if (!enableFullscreen) return;

    if (isActive && containerRef.current && !document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error enabling full-screen: ${err.message}`);
        toast({
          title: "Fullscreen Denied",
          description: "Fullscreen was denied. Please allow it or disable the setting.",
          variant: "destructive",
        });
        onFullscreenExit?.();
      });
    } else if (!isActive && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [isActive, enableFullscreen, toast, onFullscreenExit]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        onFullscreenExit?.();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isActive, onFullscreenExit]);

  // Only render when game is active
  if (!isActive) return null;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-50 bg-background"
    >
      {children}
    </div>
  );
}
