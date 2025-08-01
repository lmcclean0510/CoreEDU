// src/components/flashcard-system/flashcard-renderer.tsx

"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MousePointerClick, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Flashcard, FlashcardSettings } from '@/lib/types';

interface FlashcardRendererProps {
  flashcard: Flashcard;
  settings: FlashcardSettings;
  isFlipped: boolean;
  hasBeenRatedThisTurn: boolean;
  onFlip: () => void;
  onSelfAssessment: (wasCorrect: boolean) => void;
}

export function FlashcardRenderer({
  flashcard,
  settings,
  isFlipped,
  hasBeenRatedThisTurn,
  onFlip,
  onSelfAssessment
}: FlashcardRendererProps) {
  return (
    <div 
      className="w-full min-h-[60vh]" 
      style={{ perspective: '1000px' }} 
      onClick={!isFlipped ? onFlip : undefined}
    >
      <div
        className={cn(
          'relative w-full h-full cursor-pointer transition-transform duration-700 ease-in-out group', 
          isFlipped && 'rotate-y-180'
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Question Side */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-card to-muted shadow-lg border-2 border-primary/20">
            <CardHeader className="absolute top-4 left-4 text-left p-0">
              <p className="text-sm font-semibold text-primary">
                {flashcard.specificationPoint} {flashcard.subTopic}
              </p>
            </CardHeader>
            <CardContent className="p-0 text-center">
              <p className="text-muted-foreground text-lg mb-2">The term:</p>
              <p className="text-3xl md:text-5xl font-bold">{flashcard.term}</p>
            </CardContent>
            <div className="absolute bottom-4 flex items-center gap-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-xs">Click to flip</span>
            </div>
          </Card>
        </div>

        {/* Answer Side */}
        <div
          className={cn(
            "absolute w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300", 
            isFlipped ? 'opacity-100' : 'opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-card to-muted shadow-lg border-2 border-primary/20">
            <CardHeader className="absolute top-4 left-4 text-left p-0">
              <p className="text-sm font-semibold text-primary">
                {flashcard.specificationPoint} {flashcard.subTopic}
              </p>
            </CardHeader>
            <CardContent className="p-0 text-center">
              <p className="text-lg md:text-xl">
                {settings.showSimpleDefinition ? flashcard.simpleDefinition : flashcard.definition}
              </p>
            </CardContent>
            
            {/* Self Assessment Buttons */}
            <div className="absolute bottom-4 left-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-destructive/10 hover:bg-destructive/20 border-destructive" 
                onClick={() => onSelfAssessment(false)} 
                disabled={hasBeenRatedThisTurn}
              >
                <X className="h-6 w-6 text-destructive" />
              </Button>
            </div>
            <div className="absolute bottom-4 right-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-success/10 hover:bg-success/20 border-success" 
                onClick={() => onSelfAssessment(true)} 
                disabled={hasBeenRatedThisTurn}
              >
                <Check className="h-6 w-6 text-success" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
