import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Puzzle, Clock } from 'lucide-react';
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
    <div className="h-screen flex">
      {/* Narrower Full-Height Left Sidebar - Kraken Pro Style */}
      <div className="w-64 bg-muted/30 border-r border-border flex flex-col">
        {/* Compact Header with Progress */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Link href={`/dashboard/teacher/class/${classInfo.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Back to Class</span>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>
                {canProceedFromOverview ? (canProceedFromAddTasks ? '3' : '2') : '1'}/3
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${canProceedFromOverview ? (canProceedFromAddTasks ? 100 : 66) : 33}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Step Navigation */}
        <div className="flex-1 p-4">
          <StepNavigation
            currentStep={currentStep}
            onStepChange={onStepChange}
            canProceedFromOverview={canProceedFromOverview}
            canProceedFromAddTasks={canProceedFromAddTasks}
            selectedTasksCount={selectedTasks.length}
          />
          
          {/* Homework Summary */}
          {selectedTasks.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="font-medium text-sm mb-3">Homework Summary</h4>
              
              {/* Task counts */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium">Flashcards</span>
                  </div>
                  <p className="text-sm font-bold">{selectedTasks.filter(t => t.type === 'flashcard').length}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Puzzle className="w-3 h-3 text-secondary" />
                    <span className="text-xs font-medium">Puzzles</span>
                  </div>
                  <p className="text-sm font-bold">{selectedTasks.filter(t => t.type === 'puzzle').length}</p>
                </div>
              </div>
              
              {/* Estimated time */}
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium">Est. time:</span>
                <Badge variant="secondary" className="text-xs">
                  {(() => {
                    const flashcardCount = selectedTasks.filter(t => t.type === 'flashcard').length;
                    const puzzleCount = selectedTasks.filter(t => t.type === 'puzzle').length;
                    const totalMinutes = (flashcardCount * 2) + (puzzleCount * 5);
                    
                    if (totalMinutes < 60) {
                      return `${totalMinutes} min`;
                    } else {
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
                    }
                  })()}
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        {/* Reserved space for future feature */}
        <div className="p-4 border-t border-border">
          {/* Space reserved for your future idea */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-6xl py-8 px-8">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
}