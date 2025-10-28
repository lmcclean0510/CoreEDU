import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Puzzle as PuzzleIcon, Clock, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { StepNavigation } from './StepNavigation';
import { OverviewStep } from './OverviewStep';
import { AddTasksStep } from './AddTasksStep';
import { PreviewStep } from './PreviewStep';
import type { ClassInfo, UserProfile, Flashcard, Puzzle, HomeworkTask, HomeworkCreationStep } from '@/lib/types';

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
    <div className="container mx-auto max-w-7xl py-6 px-4 space-y-6">
      {/* Compact Header with Back Button Inline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/teacher/class/${classInfo.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Create Homework
              </h1>
              <p className="text-sm text-muted-foreground">
                {classInfo.className}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Summary Bar (only show if tasks selected) */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{flashcardCount} Flashcard{flashcardCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <PuzzleIcon className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">{puzzleCount} Puzzle{puzzleCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Est. time:</span>
            <Badge variant="secondary">{formatTime()}</Badge>
          </div>
        </div>
      )}

      {/* Step Navigation */}
      <StepNavigation
        currentStep={currentStep}
        onStepChange={onStepChange}
        canProceedFromOverview={canProceedFromOverview}
        canProceedFromAddTasks={canProceedFromAddTasks}
        selectedTasksCount={selectedTasks.length}
      />

      {/* Main Content */}
      <div>
        {renderCurrentStep()}
      </div>
    </div>
  );
}
