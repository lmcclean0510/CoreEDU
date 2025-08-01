// src/components/flashcard-system/flashcard-confidence-dialog.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsDown, Meh, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfidenceLevel, FlashcardRating } from '@/lib/types';

interface FlashcardConfidencePanelProps {
  currentCardId: string | null;
  ratings: Record<string, FlashcardRating>;
  isSaving: boolean;
  isFlipped: boolean;
  onConfidenceRating: (cardId: string, confidence: ConfidenceLevel) => void;
}

export function FlashcardConfidencePanel({
  currentCardId,
  ratings,
  isSaving,
  isFlipped,
  onConfidenceRating
}: FlashcardConfidencePanelProps) {
  if (!currentCardId) return null;

  const currentRatingData = ratings[currentCardId] || {};
  const currentConfidence = currentRatingData.confidence || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-center">
          Rate Your Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onConfidenceRating(currentCardId, 1)} 
            disabled={isSaving || !isFlipped} 
            className={cn(
              "transition-all h-10 w-10", 
              isFlipped && currentConfidence === 1 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive" 
                : "hover:bg-destructive/20"
            )} 
            title="Not Confident"
          >
            <ThumbsDown />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onConfidenceRating(currentCardId, 2)} 
            disabled={isSaving || !isFlipped} 
            className={cn(
              "transition-all h-10 w-10", 
              isFlipped && currentConfidence === 2 
                ? "bg-accent text-accent-foreground hover:bg-accent" 
                : "hover:bg-accent/20"
            )} 
            title="A Little Unsure"
          >
            <Meh />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onConfidenceRating(currentCardId, 3)} 
            disabled={isSaving || !isFlipped} 
            className={cn(
              "transition-all h-10 w-10", 
              isFlipped && currentConfidence === 3 
                ? "bg-success text-success-foreground hover:bg-success" 
                : "hover:bg-success/20"
            )} 
            title="Confident"
          >
            <ThumbsUp />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
