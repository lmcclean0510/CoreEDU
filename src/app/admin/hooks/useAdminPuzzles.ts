// src/app/admin/hooks/useAdminPuzzles.ts
import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/shared/use-toast';
import type { Puzzle } from '@/lib/types';

// Form data type (Puzzle without id)
export interface PuzzleFormData extends Omit<Puzzle, 'id'> {}

export function useAdminPuzzles() {
  const { toast } = useToast();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false - no auto-loading
  const [isSaving, setIsSaving] = useState(false);

  // Load puzzles (limited to prevent over-fetching)
  const loadPuzzles = useCallback(async () => {
    setIsLoading(true);
    try {
      const puzzlesRef = collection(db, 'puzzles');
      const q = query(puzzlesRef, orderBy('challengeLevel'), limit(500));
      const snapshot = await getDocs(q);
      const fetchedPuzzles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Puzzle));
      setPuzzles(fetchedPuzzles);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load puzzles.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save puzzle (create or update)
  const savePuzzle = useCallback(async (puzzle: PuzzleFormData, editingId?: string) => {
    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing
        const docRef = doc(db, 'puzzles', editingId);
        await updateDoc(docRef, {
          ...puzzle,
          updatedAt: serverTimestamp()
        });
        setPuzzles(prev => prev.map(p => 
          p.id === editingId ? { ...puzzle, id: editingId } : p
        ));
        toast({
          title: 'Success',
          description: 'Puzzle updated successfully.'
        });
      } else {
        // Add new
        const docRef = await addDoc(collection(db, 'puzzles'), {
          ...puzzle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setPuzzles(prev => [...prev, { ...puzzle, id: docRef.id }]);
        toast({
          title: 'Success',
          description: 'Puzzle created successfully.'
        });
      }
      return true; // Success
    } catch (error) {
      console.error('Error saving puzzle:', error);
      toast({
        title: 'Error',
        description: 'Failed to save puzzle.',
        variant: 'destructive'
      });
      return false; // Failure
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Delete puzzle
  const deletePuzzle = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'puzzles', id));
      setPuzzles(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Puzzle deleted successfully.'
      });
      return true;
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete puzzle.',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  return {
    // State
    puzzles,
    isLoading,
    isSaving,
    
    // Actions
    loadPuzzles,
    savePuzzle,
    deletePuzzle
  };
}