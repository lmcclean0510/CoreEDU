"use client";

import { ReactNode } from 'react';

interface GameContainerProps {
  isPlaying: boolean;
  children: ReactNode;
}

/**
 * GameContainer - Renders game in a maximized view without browser fullscreen
 * 
 * When isPlaying is true:
 * - Renders children in a container that fills the content area
 * - No actual fullscreen API calls
 * - Stays within the app layout
 * 
 * When isPlaying is false:
 * - Returns null (parent shows menu in normal layout)
 */
export function GameContainer({ isPlaying, children }: GameContainerProps) {
  if (!isPlaying) return null;

  return (
    <div className="fixed inset-0 lg:left-64 top-[57px] bg-background z-40">
      {children}
    </div>
  );
}
