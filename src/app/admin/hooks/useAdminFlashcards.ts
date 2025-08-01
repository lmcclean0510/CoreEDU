// src/app/admin/hooks/useAdminFlashcards.ts
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/shared/use-toast';
import type { Flashcard } from '@/lib/types';

// Form data type (Flashcard without id)
export interface FlashcardFormData extends Omit<Flashcard, 'id'> {}

export function useAdminFlashcards() {
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false - no auto-loading
  const [isSaving, setIsSaving] = useState(false);

  // Load all flashcards
  const loadFlashcards = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`%c[Firestore Read] %cFetching all flashcards for admin`, 'color: #3b82f6', 'color: default');
      const flashcardsRef = collection(db, 'flashcards');
      const q = query(flashcardsRef, orderBy('term'));
      const snapshot = await getDocs(q);
      const fetchedFlashcards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Flashcard));
      setFlashcards(fetchedFlashcards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flashcards.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save flashcard (create or update)
  const saveFlashcard = useCallback(async (flashcard: FlashcardFormData, editingId?: string) => {
    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing
        console.log(`%c[Firestore Write] %cUpdating flashcard ${editingId}`, 'color: #8b5cf6', 'color: default');
        const docRef = doc(db, 'flashcards', editingId);
        await updateDoc(docRef, {
          ...flashcard,
          updatedAt: serverTimestamp()
        });
        setFlashcards(prev => prev.map(f => 
          f.id === editingId ? { ...flashcard, id: editingId } : f
        ));
        toast({
          title: 'Success',
          description: 'Flashcard updated successfully.'
        });
      } else {
        // Add new
        console.log(`%c[Firestore Write] %cCreating new flashcard`, 'color: #8b5cf6', 'color: default');
        const docRef = await addDoc(collection(db, 'flashcards'), {
          ...flashcard,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setFlashcards(prev => [...prev, { ...flashcard, id: docRef.id }]);
        toast({
          title: 'Success',
          description: 'Flashcard created successfully.'
        });
      }
      return true; // Success
    } catch (error) {
      console.error('Error saving flashcard:', error);
      toast({
        title: 'Error',
        description: 'Failed to save flashcard.',
        variant: 'destructive'
      });
      return false; // Failure
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Delete flashcard
  const deleteFlashcard = useCallback(async (id: string) => {
    try {
      console.log(`%c[Firestore Write] %cDeleting flashcard ${id}`, 'color: #8b5cf6', 'color: default');
      await deleteDoc(doc(db, 'flashcards', id));
      setFlashcards(prev => prev.filter(f => f.id !== id));
      toast({
        title: 'Success',
        description: 'Flashcard deleted successfully.'
      });
      return true;
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard.',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Filter flashcards based on search and filter
  const getFilteredFlashcards = useCallback((searchTerm: string, filterSubject: string) => {
    return flashcards.filter(card => {
      const matchesSearch = card.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterSubject === 'all' || card.subject === filterSubject;
      return matchesSearch && matchesFilter;
    });
  }, [flashcards]);

  return {
    // State
    flashcards,
    isLoading,
    isSaving,
    
    // Actions
    loadFlashcards,
    saveFlashcard,
    deleteFlashcard,
    getFilteredFlashcards
  };
}