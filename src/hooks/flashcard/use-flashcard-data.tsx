
// src/hooks/flashcard/use-flashcard-data.tsx

"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Flashcard } from '@/lib/types';

interface UseFlashcardDataProps {
  subject: string;
  orderByField?: string;
}

export function useFlashcardData({ subject, orderByField = 'term' }: UseFlashcardDataProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlashcards = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const flashcardsRef = collection(db, 'flashcards');
        const q = query(
          flashcardsRef,
          where('subject', '==', subject),
          orderBy(orderByField),
          limit(500) // Limit to 500 flashcards per subject to prevent over-fetching
        );
        const querySnapshot = await getDocs(q);
        const fetchedFlashcards = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Flashcard));

        if (fetchedFlashcards.length === 0) {
          setError("No flashcards were found. They may not have been added to the database yet.");
        } else {
          // Convert Firestore Timestamps to plain objects for Next.js serialization
          setFlashcards(JSON.parse(JSON.stringify(fetchedFlashcards)));
        }
      } catch (err) {
        console.error("Error fetching flashcards:", err);
        setError("An error occurred while fetching flashcards. Please check your connection and Firestore security rules.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [subject, orderByField]);

  return { flashcards, isLoading, error };
}
