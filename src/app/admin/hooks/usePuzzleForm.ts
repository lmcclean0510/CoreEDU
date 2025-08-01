// src/app/admin/hooks/usePuzzleForm.ts
import { useState } from 'react';
import type { Puzzle } from '@/lib/types';
import type { PuzzleFormData } from './useAdminPuzzles';

export function usePuzzleForm(initialPuzzle?: Puzzle) {
  const [formData, setFormData] = useState<PuzzleFormData>(
    initialPuzzle || {
      title: '',
      description: '',
      skillSection: '',
      sectionId: '',
      challengeLevel: 1,
      codeSnippet: '',
      initialBlocks: [],
      solution: [],
      expectedOutput: '',
      isDynamic: false,
      inputPrompt: ''
    }
  );

  // Temporary input states for adding to arrays
  const [initialBlock, setInitialBlock] = useState('');
  const [solutionLine, setSolutionLine] = useState('');

  // Function to add items to array fields
  const addToArray = (
    field: 'initialBlocks' | 'solution', 
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
    }
  };

  // Function to remove items from array fields
  const removeFromArray = (field: 'initialBlocks' | 'solution', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Update a single field
  const updateField = <K extends keyof PuzzleFormData>(field: K, value: PuzzleFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData(initialPuzzle || {
      title: '',
      description: '',
      skillSection: '',
      sectionId: '',
      challengeLevel: 1,
      codeSnippet: '',
      initialBlocks: [],
      solution: [],
      expectedOutput: '',
      isDynamic: false,
      inputPrompt: ''
    });
    setInitialBlock('');
    setSolutionLine('');
  };

  return {
    // Form data
    formData,
    setFormData,
    
    // Temporary input states
    initialBlock,
    setInitialBlock,
    solutionLine,
    setSolutionLine,
    
    // Actions
    addToArray,
    removeFromArray,
    updateField,
    resetForm
  };
}