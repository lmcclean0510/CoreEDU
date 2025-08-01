// src/components/flashcard-system/flashcard-client.tsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useFlashcardProgress } from '@/hooks/flashcard/use-flashcard-progress';
import { useFlashcardNavigation } from '@/hooks/flashcard/use-flashcard-navigation';
import { FlashcardRenderer } from './flashcard-renderer';
import { FlashcardControls } from './flashcard-controls';
import { FlashcardSidebar } from './flashcard-sidebar';
import { groupTopicsByHierarchy } from '@/lib/flashcard-system/utils';
import type { 
  Flashcard, 
  FlashcardSettings, 
  ConfidenceLevel 
} from '@/lib/types';

interface FlashCardClientProps {
  flashcards: Flashcard[];
}

export function FlashCardClient({ flashcards: allFlashcards }: FlashCardClientProps) {
  const { ratings, isSaving, handleConfidenceRating, handleSelfAssessment } = useFlashcardProgress();
  
  // State for filtering
  const [enabledSubTopics, setEnabledSubTopics] = useState<Set<string>>(new Set());
  const [enabledConfidences, setEnabledConfidences] = useState<Set<ConfidenceLevel>>(
    new Set([1, 2, 3, null])
  );
  const [settings, setSettings] = useState<FlashcardSettings>({
    showSimpleDefinition: true
  });

  // Group topics and subtopics for the filter UI
  const groupedTopics = useMemo(() => groupTopicsByHierarchy(allFlashcards), [allFlashcards]);
  
  // Initialize filter state once flashcards are loaded
  useEffect(() => {
    if (allFlashcards.length > 0) {
      const allSubTopics = new Set<string>();
      allFlashcards.forEach(card => {
        allSubTopics.add(card.subTopic);
      });
      setEnabledSubTopics(allSubTopics);
    }
  }, [allFlashcards]);
  
  // Create the filtered list of flashcards
  const filteredFlashcards = useMemo(() => {
    return allFlashcards.filter(card => {
      const topicMatch = enabledSubTopics.has(card.subTopic);
      const cardConfidence = ratings[card.id]?.confidence ?? null;
      const confidenceMatch = enabledConfidences.has(cardConfidence);
      return topicMatch && confidenceMatch;
    });
  }, [allFlashcards, enabledSubTopics, enabledConfidences, ratings]);

  // Navigation hook
  const {
    currentIndex,
    currentCard,
    isFlipped,
    isShuffling,
    hasBeenRatedThisTurn,
    progressPercentage,
    handleNext,
    handlePrevious,
    handleShuffle,
    handleFlip,
    markAsRated
  } = useFlashcardNavigation(filteredFlashcards);

  // Filter handlers
  const handleSubTopicToggle = (subTopic: string, isEnabled: boolean) => {
    setEnabledSubTopics(prev => {
      const newSet = new Set(prev);
      if (isEnabled) {
        newSet.add(subTopic);
      } else {
        newSet.delete(subTopic);
      }
      return newSet;
    });
  };

  const handleTopicToggle = (topic: string, isEnabled: boolean) => {
    const subTopicsToToggle = groupedTopics[topic].subTopics;
    setEnabledSubTopics(prev => {
      const newSet = new Set(prev);
      subTopicsToToggle.forEach(subTopic => {
        if (isEnabled) {
          newSet.add(subTopic);
        } else {
          newSet.delete(subTopic);
        }
      });
      return newSet;
    });
  };

  const handleSelectAllTopics = () => {
    const allSubTopics = new Set<string>();
    Object.values(groupedTopics).forEach(({subTopics}) => {
      subTopics.forEach(subTopic => {
        allSubTopics.add(subTopic);
      });
    });
    setEnabledSubTopics(allSubTopics);
  };

  const handleDeselectAllTopics = () => {
    setEnabledSubTopics(new Set());
  };
  
  const handleConfidenceFilterChange = (confidence: ConfidenceLevel, isEnabled: boolean) => {
    setEnabledConfidences(prev => {
      const newSet = new Set(prev);
      if (isEnabled) {
        newSet.add(confidence);
      } else {
        newSet.delete(confidence);
      }
      return newSet;
    });
  };
  
  const handleSelectAllConfidences = () => {
    setEnabledConfidences(new Set([1, 2, 3, null]));
  };

  const handleDeselectAllConfidences = () => {
    setEnabledConfidences(new Set());
  };

  // Self assessment handler
  const handleSelfAssessmentClick = async (wasCorrect: boolean) => {
    if (!currentCard || hasBeenRatedThisTurn) return;
    markAsRated();
    await handleSelfAssessment(currentCard.id, wasCorrect);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 w-full flex-grow items-start h-full">
      {/* Main content area */}
      <div className="flex flex-col items-center justify-start gap-6 w-full h-full">
        {filteredFlashcards.length > 0 && currentCard ? (
          <>
            {/* Main flashcard */}
            <FlashcardRenderer
              flashcard={currentCard}
              settings={settings}
              isFlipped={isFlipped}
              hasBeenRatedThisTurn={hasBeenRatedThisTurn}
              onFlip={handleFlip}
              onSelfAssessment={handleSelfAssessmentClick}
            />

            {/* Navigation controls */}
            <FlashcardControls
              currentIndex={currentIndex}
              totalCards={filteredFlashcards.length}
              isFlipped={isFlipped}
              hasBeenRated={hasBeenRatedThisTurn}
              isShuffling={isShuffling}
              progressPercentage={progressPercentage}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onFlip={handleFlip}
              onShuffle={handleShuffle}
            />
          </>
        ) : (
          <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No Cards Selected</h3>
            <p className="text-muted-foreground text-center">
              Please adjust your filters to see more cards.
            </p>
          </div>
        )}
      </div>
      
      {/* Sidebar */}
      <FlashcardSidebar
        allFlashcards={allFlashcards}
        filteredFlashcards={filteredFlashcards}
        currentCard={currentCard}
        ratings={ratings}
        settings={settings}
        groupedTopics={groupedTopics}
        enabledSubTopics={enabledSubTopics}
        enabledConfidences={enabledConfidences}
        isSaving={isSaving}
        isFlipped={isFlipped}
        onSettingsChange={setSettings}
        onSubTopicToggle={handleSubTopicToggle}
        onTopicToggle={onTopicToggle}
        onSelectAllTopics={handleSelectAllTopics}
        onDeselectAllTopics={handleDeselectAllTopics}
        onConfidenceFilterChange={onConfidenceFilterChange}
        onSelectAllConfidences={handleSelectAllConfidences}
        onDeselectAllConfidences={handleDeselectAllConfidences}
        onConfidenceRating={handleConfidenceRating}
      />
    </div>
  );
}
