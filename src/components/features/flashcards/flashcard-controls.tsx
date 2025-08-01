// src/components/flashcard-system/flashcard-controls.tsx

"use client";

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardControlsProps {
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  hasBeenRated: boolean;
  isShuffling: boolean;
  progressPercentage: number;
  onPrevious: () => void;
  onNext: () => void;
  onFlip: () => void;
  onShuffle: () => void;
}

export function FlashcardControls({
  currentIndex,
  totalCards,
  isFlipped,
  hasBeenRated,
  isShuffling,
  progressPercentage,
  onPrevious,
  onNext,
  onFlip,
  onShuffle
}: FlashcardControlsProps) {
  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="w-full px-2">
        <Progress value={progressPercentage} className="w-full h-2" />
        <p className="text-center text-sm font-mono text-muted-foreground mt-2">
          Card {currentIndex + 1} of {totalCards}
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg border">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); onPrevious(); }} 
          disabled={isFlipped && !hasBeenRated}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button 
          size="lg" 
          className="flex-1" 
          onClick={(e) => { e.stopPropagation(); onFlip(); }}
        >
          {isFlipped ? 'Show Term' : 'Show Definition'}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); onNext(); }} 
          disabled={isFlipped && !hasBeenRated}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={(e) => { e.stopPropagation(); onShuffle(); }} 
          className="justify-center"
        >
          <RefreshCw className={cn('h-5 w-5 mr-2', isShuffling && 'animate-spin')} />
          Shuffle
        </Button>
      </div>
    </div>
  );
}
