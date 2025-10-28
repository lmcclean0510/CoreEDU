import { useState, useCallback, useMemo } from 'react';
import type { HomeworkTask, Flashcard, Puzzle } from '@/lib/types';

export type HomeworkCreationStep = 'overview' | 'add-tasks' | 'preview';

export interface HomeworkCreationState {
  // Current step
  currentStep: HomeworkCreationStep;
  
  // Overview data
  title: string;
  instructions: string;
  dueDate: string; // ISO string for form input
  
  // Tasks data
  selectedTasks: HomeworkTask[];
  
  // Add tasks filters
  searchQuery: string;
  activeTab: 'flashcards' | 'puzzles';
  selectedTopics: string[];
  selectedDifficulties: number[];
}

export function useHomeworkCreation() {
  const [state, setState] = useState<HomeworkCreationState>({
    currentStep: 'overview',
    title: '',
    instructions: '',
    dueDate: '',
    selectedTasks: [],
    searchQuery: '',
    activeTab: 'flashcards',
    selectedTopics: [],
    selectedDifficulties: [],
  });

  // Step navigation
  const setCurrentStep = useCallback((step: HomeworkCreationStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const goToNextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep === 'overview') return { ...prev, currentStep: 'add-tasks' };
      if (prev.currentStep === 'add-tasks') return { ...prev, currentStep: 'preview' };
      return prev;
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep === 'preview') return { ...prev, currentStep: 'add-tasks' };
      if (prev.currentStep === 'add-tasks') return { ...prev, currentStep: 'overview' };
      return prev;
    });
  }, []);

  // Overview form updates
  const updateTitle = useCallback((title: string) => {
    setState(prev => ({ ...prev, title }));
  }, []);

  const updateInstructions = useCallback((instructions: string) => {
    setState(prev => ({ ...prev, instructions }));
  }, []);

  const updateDueDate = useCallback((dueDate: string) => {
    setState(prev => ({ ...prev, dueDate }));
  }, []);

  // Task management
  const addTask = useCallback((task: HomeworkTask) => {
    setState(prev => {
      const isAlreadySelected = prev.selectedTasks.some(t => t.id === task.id);
      return {
        ...prev,
        selectedTasks: isAlreadySelected
          ? prev.selectedTasks.filter(t => t.id !== task.id) // Remove if already selected (toggle off)
          : [...prev.selectedTasks, task] // Add if not selected (toggle on)
      };
    });
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      selectedTasks: prev.selectedTasks.filter(t => t.id !== taskId)
    }));
  }, []);

  const reorderTasks = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newTasks = [...prev.selectedTasks];
      const [movedTask] = newTasks.splice(fromIndex, 1);
      newTasks.splice(toIndex, 0, movedTask);
      return { ...prev, selectedTasks: newTasks };
    });
  }, []);

  const clearAllTasks = useCallback(() => {
    setState(prev => ({ ...prev, selectedTasks: [] }));
  }, []);

  // Search and filter methods
  const updateSearchQuery = useCallback((searchQuery: string) => {
    setState(prev => ({ ...prev, searchQuery }));
  }, []);

  const setActiveTab = useCallback((activeTab: 'flashcards' | 'puzzles') => {
    setState(prev => ({ ...prev, activeTab }));
  }, []);

  const toggleTopic = useCallback((topic: string) => {
    setState(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic]
    }));
  }, []);

  const toggleDifficulty = useCallback((difficulty: number) => {
    setState(prev => ({
      ...prev,
      selectedDifficulties: prev.selectedDifficulties.includes(difficulty)
        ? prev.selectedDifficulties.filter(d => d !== difficulty)
        : [...prev.selectedDifficulties, difficulty]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      selectedTopics: [],
      selectedDifficulties: [],
    }));
  }, []);

  // Helper methods
  const isTaskSelected = useCallback((taskId: string) => {
    return state.selectedTasks.some(t => t.id === taskId);
  }, [state.selectedTasks]);

  // Validation for each step
  const canProceedFromOverview = useMemo(() => {
    return state.title.trim().length > 0;
  }, [state.title]);

  const canProceedFromAddTasks = useMemo(() => {
    return state.selectedTasks.length > 0;
  }, [state.selectedTasks]);

  const canSubmit = useMemo(() => {
    return canProceedFromOverview && canProceedFromAddTasks;
  }, [canProceedFromOverview, canProceedFromAddTasks]);

  // Due date validation
  const isDueDateValid = useMemo(() => {
    if (!state.dueDate) return true; // Optional field
    const selectedDate = new Date(state.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return selectedDate >= today;
  }, [state.dueDate]);

  // Filter methods for tasks
  const filterFlashcards = useCallback((flashcards: Flashcard[]) => {
    return flashcards.filter(card => {
      const matchesSearch = state.searchQuery === '' || 
        card.term.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        card.definition.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        card.topic.toLowerCase().includes(state.searchQuery.toLowerCase());

      const matchesTopi = state.selectedTopics.length === 0 || 
        state.selectedTopics.includes(card.topic);

      return matchesSearch && matchesTopi;
    });
  }, [state.searchQuery, state.selectedTopics]);

  const filterPuzzles = useCallback((puzzles: Puzzle[]) => {
    return puzzles.filter(puzzle => {
      const matchesSearch = state.searchQuery === '' ||
        puzzle.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        puzzle.description.toLowerCase().includes(state.searchQuery.toLowerCase());

      const matchesDifficulty = state.selectedDifficulties.length === 0 ||
        state.selectedDifficulties.includes(puzzle.challengeLevel);

      return matchesSearch && matchesDifficulty;
    });
  }, [state.searchQuery, state.selectedDifficulties]);

  // Get unique values for filters
  const getUniqueTopics = useCallback((flashcards: Flashcard[]) => {
    return [...new Set(flashcards.map(card => card.topic))].sort();
  }, []);

  const getUniqueDifficulties = useCallback((puzzles: Puzzle[]) => {
    return [...new Set(puzzles.map(puzzle => puzzle.challengeLevel))].sort((a, b) => a - b);
  }, []);

  return {
    // State
    ...state,
    
    // Step navigation
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    
    // Overview actions
    updateTitle,
    updateInstructions,
    updateDueDate,
    
    // Task actions
    addTask,
    removeTask,
    reorderTasks,
    clearAllTasks,
    
    // Filter actions
    updateSearchQuery,
    setActiveTab,
    toggleTopic,
    toggleDifficulty,
    clearFilters,
    
    // Computed
    isTaskSelected,
    canProceedFromOverview,
    canProceedFromAddTasks,
    canSubmit,
    isDueDateValid,
    filterFlashcards,
    filterPuzzles,
    getUniqueTopics,
    getUniqueDifficulties,
  };
}