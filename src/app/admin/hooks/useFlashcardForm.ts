// src/app/admin/hooks/useFlashcardForm.ts
import { useState } from 'react';
import type { Flashcard } from '@/lib/types';
import type { FlashcardFormData } from './useAdminFlashcards';

export function useFlashcardForm(initialFlashcard?: Flashcard) {
  const [formData, setFormData] = useState<FlashcardFormData>(
    initialFlashcard || {
      subject: '',
      examBoard: '',
      specification: '',
      specificationCode: '',
      specificationPoint: '',
      topic: '',
      subTopic: '',
      term: '',
      definition: '',
      alternativeDefinitions: [],
      simpleDefinition: '',
      examples: [],
      relatedTerms: [],
      hints: []
    }
  );

  // Temporary input states for adding to arrays
  const [alternativeDefinition, setAlternativeDefinition] = useState('');
  const [example, setExample] = useState('');
  const [relatedTerm, setRelatedTerm] = useState('');
  const [hint, setHint] = useState('');

  // Generic function to add items to array fields
  const addToArray = (
    field: keyof FlashcardFormData, 
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      const currentArray = formData[field] as string[];
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
      setter('');
    }
  };

  // Generic function to remove items from array fields
  const removeFromArray = (field: keyof FlashcardFormData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  // Update a single field
  const updateField = (field: keyof FlashcardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialFlashcard || {
      subject: '',
      examBoard: '',
      specification: '',
      specificationCode: '',
      specificationPoint: '',
      topic: '',
      subTopic: '',
      term: '',
      definition: '',
      alternativeDefinitions: [],
      simpleDefinition: '',
      examples: [],
      relatedTerms: [],
      hints: []
    });
    setAlternativeDefinition('');
    setExample('');
    setRelatedTerm('');
    setHint('');
  };

  return {
    // Form data
    formData,
    setFormData,
    
    // Temporary input states
    alternativeDefinition,
    setAlternativeDefinition,
    example,
    setExample,
    relatedTerm,
    setRelatedTerm,
    hint,
    setHint,
    
    // Actions
    addToArray,
    removeFromArray,
    updateField,
    resetForm
  };
}