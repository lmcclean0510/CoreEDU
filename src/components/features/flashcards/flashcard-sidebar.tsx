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
      
      {/* Topic Information */}
      {currentCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-center">
              Topic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <p><strong>Topic:</strong> {currentCard.topic}</p>
            <p><strong>Sub-Topic:</strong> {currentCard.subTopic}</p>
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
