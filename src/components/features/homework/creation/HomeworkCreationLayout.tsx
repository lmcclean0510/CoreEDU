import { Badge } from '@/components/ui/badge';
import { BookOpen, Puzzle as PuzzleIcon, Clock } from 'lucide-react';
import { StickyHomeworkNav } from './StickyHomeworkNav';
import { OverviewStep } from './OverviewStep';
import { AddTasksStep } from './AddTasksStep';
import { PreviewStep } from './PreviewStep';
import type { ClassInfo, UserProfile, Flashcard, Puzzle, HomeworkTask } from '@/lib/types';
import type { HomeworkCreationStep } from '@/hooks/homework/use-homework-creation';

interface HomeworkCreationLayoutProps {
  // Data
  classInfo: ClassInfo;
  students: UserProfile[];
  flashcards: Flashcard[];
  puzzles: Puzzle[];

  // State from hook
  currentStep: HomeworkCreationStep;
  title: string;
  instructions: string;
  dueDate: string;
  selectedTasks: HomeworkTask[];
  searchQuery: string;
  activeTab: 'flashcards' | 'puzzles';
  selectedTopics: string[];
  selectedDifficulties: number[];
  canSubmit: boolean;
  isDueDateValid: boolean;
  isCreating: boolean;

  // Computed data
  filteredFlashcards: Flashcard[];
  filteredPuzzles: Puzzle[];
  availableTopics: string[];
  availableDifficulties: number[];
  canProceedFromOverview: boolean;
  canProceedFromAddTasks: boolean;

  // Actions
  onStepChange: (step: HomeworkCreationStep) => void;
  onNext: () => void;
  onPrevious: () => void;
  onTitleChange: (title: string) => void;
  onInstructionsChange: (instructions: string) => void;
  onDueDateChange: (dueDate: string) => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: 'flashcards' | 'puzzles') => void;
  onTopicToggle: (topic: string) => void;
  onDifficultyToggle: (difficulty: number) => void;
  onTaskToggle: (task: HomeworkTask) => void;
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (fromIndex: number, toIndex: number) => void;
  onClearAllTasks: () => void;
  onClearFilters: () => void;
  onCreateHomework: () => void;
  onCancel: () => void;

  // Helper functions
  isTaskSelected: (taskId: string) => boolean;
}

export function HomeworkCreationLayout({
  classInfo,
  students,
  flashcards,
  puzzles,
  currentStep,
  title,
  instructions,
  dueDate,
  selectedTasks,
  searchQuery,
  activeTab,
  selectedTopics,
  selectedDifficulties,
  canSubmit,
  isDueDateValid,
  isCreating,
  filteredFlashcards,
  filteredPuzzles,
  availableTopics,
  availableDifficulties,
  canProceedFromOverview,
  canProceedFromAddTasks,
  onStepChange,
  onNext,
  onPrevious,
  onTitleChange,
  onInstructionsChange,
  onDueDateChange,
  onSearchChange,
  onTabChange,
  onTopicToggle,
  onDifficultyToggle,
  onTaskToggle,
  onRemoveTask,
  onReorderTasks,
  onClearAllTasks,
  onClearFilters,
  onCreateHomework,
  onCancel,
  isTaskSelected,
}: HomeworkCreationLayoutProps) {

  // Calculate task summary
  const flashcardCount = selectedTasks.filter(t => t.type === 'flashcard').length;
  const puzzleCount = selectedTasks.filter(t => t.type === 'puzzle').length;
  const totalMinutes = (flashcardCount * 2) + (puzzleCount * 5);

  const formatTime = () => {
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <OverviewStep
            title={title}
            instructions={instructions}
            dueDate={dueDate}
            classInfo={classInfo}
            students={students}
            onTitleChange={onTitleChange}
            onInstructionsChange={onInstructionsChange}
            onDueDateChange={onDueDateChange}
            onNext={onNext}
            canProceed={canProceedFromOverview}
            isDueDateValid={isDueDateValid}
          />
        );

      case 'add-tasks':
        return (
          <AddTasksStep
            flashcards={flashcards}
            puzzles={puzzles}
            selectedTasks={selectedTasks}
            searchQuery={searchQuery}
            activeTab={activeTab}
            selectedTopics={selectedTopics}
            selectedDifficulties={selectedDifficulties}
            filteredFlashcards={filteredFlashcards}
            filteredPuzzles={filteredPuzzles}
            availableTopics={availableTopics}
            availableDifficulties={availableDifficulties}
            onSearchChange={onSearchChange}
            onTabChange={onTabChange}
            onTopicToggle={onTopicToggle}
            onDifficultyToggle={onDifficultyToggle}
            onTaskToggle={onTaskToggle}
            onRemoveTask={onRemoveTask}
            onReorderTasks={onReorderTasks}
            onClearAllTasks={onClearAllTasks}
            onClearFilters={onClearFilters}
            onPrevious={onPrevious}
            onNext={onNext}
            canProceed={canProceedFromAddTasks}
            isTaskSelected={isTaskSelected}
          />
        );

      case 'preview':
        return (
          <PreviewStep
            title={title}
            instructions={instructions}
            dueDate={dueDate}
            selectedTasks={selectedTasks}
            classInfo={classInfo}
            students={students}
            canSubmit={canSubmit}
            isCreating={isCreating}
            onRemoveTask={onRemoveTask}
            onReorderTasks={onReorderTasks}
            onClearAllTasks={onClearAllTasks}
            onCreateHomework={onCreateHomework}
            onPrevious={onPrevious}
            onEditOverview={() => onStepChange('overview')}
            onEditTasks={() => onStepChange('add-tasks')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Sticky Navigation */}
      <StickyHomeworkNav
        currentStep={currentStep}
        canProceedFromOverview={canProceedFromOverview}
        canProceedFromAddTasks={canProceedFromAddTasks}
        canSubmit={canSubmit}
        isCreating={isCreating}
        selectedTasksCount={selectedTasks.length}
        onStepChange={onStepChange}
        onExit={onCancel}
        onPublish={onCreateHomework}
      />

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {renderCurrentStep()}
      </div>
    </>
  );
}
