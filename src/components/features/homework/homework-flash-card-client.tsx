"use client";

import { useState, useEffect } from 'react';
import type { Flashcard } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeworkFlashCardClientProps {
  flashcard: Flashcard;
  onCompleted: () => void;
}

export function HomeworkFlashCardClient({ flashcard, onCompleted }: HomeworkFlashCardClientProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [flashcard.id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  return (
    <div className="h-full w-full flex flex-col p-6">
      {/* Main Flashcard Area - Takes most space */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl h-full max-h-[500px]" style={{ perspective: '1000px' }}>
          <div
            className={cn(
              'relative w-full h-full cursor-pointer transition-transform duration-700 ease-in-out group',
              isFlipped && 'rotate-y-180'
            )}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={handleFlip}
          >
            {/* Front of card - Term */}
            <div className="absolute w-full h-full backface-hidden">
              <Card className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20 shadow-xl border-2 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 text-center flex items-center justify-center h-full">
                  <div>
                    <p className="text-6xl md:text-8xl font-bold text-foreground mb-4">
                      {flashcard.term}
                    </p>
                    <p className="text-muted-foreground text-lg">
                      Click to reveal definition
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Back of card - Definition */}
            <div
              className="absolute w-full h-full backface-hidden rotate-y-180"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl border-2 border-primary/20">
                <CardContent className="p-8 text-center flex items-center justify-center h-full">
                  <div className="max-w-3xl">
                    <p className="text-xl md:text-2xl leading-relaxed text-foreground">
                      {flashcard.definition}
                    </p>
                    {flashcard.examples && flashcard.examples.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border/20">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Examples:</p>
                        <p className="text-base text-muted-foreground">
                          {flashcard.examples.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Control Area - Fixed at bottom */}
      <div className="w-full max-w-2xl mx-auto space-y-4 mt-6">
        <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-xl border">
          <Button size="lg" className="flex-1 text-lg py-3" onClick={handleFlip}>
            {isFlipped ? 'Show Term' : 'Show Definition'}
          </Button>
        </div>
        <Button 
          className="w-full text-lg py-4" 
          onClick={onCompleted} 
          size="lg"
          disabled={!isFlipped}
        >
          <Check className="mr-2 w-5 h-5" />
          I've Revised This Card
        </Button>
        {!isFlipped && (
          <p className="text-center text-sm text-muted-foreground">
            View the definition first to mark as complete
          </p>
        )}
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