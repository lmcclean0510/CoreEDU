
// src/hooks/flashcard/use-flashcard-progress.tsx

"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/UserProvider';
import { useToast } from '@/hooks/shared/use-toast';
import type { FlashcardRating, ConfidenceLevel } from '@/lib/types';

export function useFlashcardProgress() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Record<string, FlashcardRating>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchRatings = async () => {
        const userRatingsRef = doc(db, 'userFlashcardRatings', user.uid);
        const docSnap = await getDoc(userRatingsRef);
        if (docSnap.exists()) {
          setRatings(docSnap.data().ratings || {});
        }
      };
      fetchRatings();
    }
  }, [user]);

  const handleConfidenceRating = async (cardId: string, confidence: ConfidenceLevel) => {
    if (!user) return;
    const currentRating = ratings[cardId];
    const newConfidence = currentRating?.confidence === confidence ? null : confidence;
    
    setRatings(prev => ({ 
      ...prev, 
      [cardId]: { ...prev[cardId], confidence: newConfidence } 
    }));
    
    setIsSaving(true);
    try {
      const userRatingsRef = doc(db, 'userFlashcardRatings', user.uid);
      await setDoc(userRatingsRef, { 
        userId: user.uid, 
        ratings: { [cardId]: { confidence: newConfidence } }, 
        lastRated: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      console.error("Error saving confidence rating:", error);
      setRatings(ratings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelfAssessment = async (cardId: string, wasCorrect: boolean) => {
    if (!user) return;
    const fieldToIncrement = wasCorrect ? 'correct' : 'incorrect';
    setRatings(prev => ({ 
      ...prev, 
      [cardId]: { 
        ...prev[cardId], 
        [fieldToIncrement]: (prev[cardId]?.[fieldToIncrement] || 0) + 1, 
        totalAttempts: (prev[cardId]?.totalAttempts || 0) + 1 
      } 
    }));
    
    try {
      const userRatingsRef = doc(db, 'userFlashcardRatings', user.uid);
      await setDoc(userRatingsRef, { 
        ratings: { 
          [cardId]: { 
            [fieldToIncrement]: increment(1), 
            totalAttempts: increment(1) 
          } 
        }, 
        lastRated: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({ 
        title: "Error", 
        description: "Could not save your progress.", 
        variant: "destructive" 
      });
      setRatings(ratings);
    }
  };

  return {
    ratings,
    isSaving,
    handleConfidenceRating,
    handleSelfAssessment
  };
}
