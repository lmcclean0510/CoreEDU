// src/components/flashcard-system/flashcard-sidebar.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlashcardFilterDialog } from './flashcard-filter-dialog';
import { FlashcardSettingsDialog } from './flashcard-settings-dialog';
import { FlashcardConfidencePanel } from './flashcard-confidence-dialog';
import type { 
  Flashcard, 
  FlashcardRating, 
  FlashcardSettings, 
  GroupedTopics, 
  ConfidenceLevel 
} from '@/lib/types';

interface FlashcardSidebarProps {
  allFlashcards: Flashcard[];
  filteredFlashcards: Flashcard[];
  currentCard: Flashcard | null;
  ratings: Record<string, FlashcardRating>;
  settings: FlashcardSettings;
  groupedTopics: GroupedTopics;
  enabledSubTopics: Set<string>;
  enabledConfidences: Set<ConfidenceLevel>;
  isSaving: boolean;
  isFlipped: boolean;
  onSettingsChange: (settings: FlashcardSettings) => void;
  onSubTopicToggle: (subTopic: string, isEnabled: boolean) => void;
  onTopicToggle: (topic: string, isEnabled: boolean) => void;
  onSelectAllTopics: () => void;
  onDeselectAllTopics: () => void;
  onConfidenceFilterChange: (confidence: ConfidenceLevel, isEnabled: boolean) => void;
  onSelectAllConfidences: () => void;
  onDeselectAllConfidences: () => void;
  onConfidenceRating: (cardId: string, confidence: ConfidenceLevel) => void;
}

export function FlashcardSidebar({
  allFlashcards,
  filteredFlashcards,
  currentCard,
  ratings,
  settings,
  groupedTopics,
  enabledSubTopics,
  enabledConfidences,
  isSaving,
  isFlipped,
  onSettingsChange,
  onSubTopicToggle,
  onTopicToggle,
  onSelectAllTopics,
  onDeselectAllTopics,
  onConfidenceFilterChange,
  onSelectAllConfidences,
  onDeselectAllConfidences,
  onConfidenceRating
}: FlashcardSidebarProps) {
  return (
    <div className="flex flex-col justify-start w-full h-full space-y-4">
      {/* Filter and Settings Controls */}
      <Card>
        <CardHeader className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <FlashcardFilterDialog
              totalCards={allFlashcards.length}
              filteredCards={filteredFlashcards.length}
              groupedTopics={groupedTopics}
              enabledSubTopics={enabledSubTopics}
              enabledConfidences={enabledConfidences}
              onSubTopicToggle={onSubTopicToggle}
              onTopicToggle={onTopicToggle}
              onSelectAllTopics={onSelectAllTopics}
              onDeselectAllTopics={onDeselectAllTopics}
              onConfidenceFilterChange={onConfidenceFilterChange}
              onSelectAllConfidences={onSelectAllConfidences}
              onDeselectAllConfidences={onDeselectAllConfidences}
            />
            <FlashcardSettingsDialog
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        </CardHeader>
      </Card>
      
      {/* Topic Information & Statistics */}
      {currentCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-center">
              Card Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {/* Topic Details */}
            <div className="space-y-1 text-muted-foreground">
              <p><strong>Topic:</strong> {currentCard.topic}</p>
              <p><strong>Sub-Topic:</strong> {currentCard.subTopic}</p>
            </div>

            {/* Statistics */}
            {(() => {
              const cardRating = ratings[currentCard.id];
              const totalAttempts = cardRating?.totalAttempts || 0;
              const correct = cardRating?.correct || 0;
              const incorrect = cardRating?.incorrect || 0;
              const successRate = totalAttempts > 0
                ? Math.round((correct / totalAttempts) * 100)
                : 0;

              return (
                <>
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Card Statistics</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p><strong>Total Attempts:</strong> {totalAttempts}</p>
                      {totalAttempts > 0 && (
                        <>
                          <p><strong>Correct:</strong> <span className="text-success">{correct}</span></p>
                          <p><strong>Incorrect:</strong> <span className="text-destructive">{incorrect}</span></p>
                          <p>
                            <strong>Success Rate:</strong>{' '}
                            <span className={successRate >= 70 ? 'text-success' : successRate >= 40 ? 'text-yellow-600' : 'text-destructive'}>
                              {successRate}%
                            </span>
                          </p>
                        </>
                      )}
                      {totalAttempts === 0 && (
                        <p className="text-xs italic">No attempts yet</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}
      
      {/* Confidence Rating Panel */}
      <FlashcardConfidencePanel
        currentCardId={currentCard?.id || null}
        ratings={ratings}
        isSaving={isSaving}
        isFlipped={isFlipped}
        onConfidenceRating={onConfidenceRating}
      />
      
      {/* Related Terms */}
      {isFlipped && currentCard?.relatedTerms && currentCard.relatedTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-center">
              Related Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 justify-center">
            {currentCard.relatedTerms.map(term => (
              <Badge key={term} variant="secondary">{term}</Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
