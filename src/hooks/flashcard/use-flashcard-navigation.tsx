
// src/hooks/flashcard/use-flashcard-navigation.tsx

"use client";

import { useState, useEffect } from 'react';
import type { Flashcard } from '@/lib/types';

export function useFlashcardNavigation(filteredFlashcards: Flashcard[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [hasBeenRatedThisTurn, setHasBeenRatedThisTurn] = useState(false);

  // Initialize and update shuffled indices when filtered cards change
  useEffect(() => {
    if (filteredFlashcards.length > 0) {
      // Check if current index is out of bounds
      if (currentIndex >= filteredFlashcards.length) {
        setCurrentIndex(0); // Reset to the first card
      }
      setShuffledIndices(Array.from(Array(filteredFlashcards.length).keys()));
    } else {
      // Handle case where no cards are selected
      setShuffledIndices([]);
      setCurrentIndex(0);
    }
  }, [filteredFlashcards]);

  // Reset card state when changing cards
  const resetCardState = () => {
    setIsFlipped(false);
    setHasBeenRatedThisTurn(false);
  };

  // Get current card
  const currentCard = filteredFlashcards.length > 0 ? filteredFlashcards[shuffledIndices[currentIndex]] : null;

  // Reset card state when card changes
  useEffect(() => {
    resetCardState();
  }, [currentCard?.id]);

  const handleNext = () => {
    if (filteredFlashcards.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredFlashcards.length);
  };

  const handlePrevious = () => {
    if (filteredFlashcards.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + filteredFlashcards.length) % filteredFlashcards.length);
  };

  const handleShuffle = () => {
    if (filteredFlashcards.length === 0) return;
    setIsShuffling(true);
    const newShuffledIndices = [...shuffledIndices].sort(() => Math.random() - 0.5);
    setShuffledIndices(newShuffledIndices);
    setCurrentIndex(0);
    setTimeout(() => setIsShuffling(false), 500);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const markAsRated = () => {
    setHasBeenRatedThisTurn(true);
  };

  const progressPercentage = filteredFlashcards.length > 0 ? ((currentIndex + 1) / filteredFlashcards.length) * 100 : 0;

  return {
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
    markAsRated,
    resetCardState
  };
}
