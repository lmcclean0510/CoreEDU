import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, BookOpen, Puzzle, Search, SlidersHorizontal, X, CheckCircle2 } from 'lucide-react';
import { SelectedTasksList } from './SelectedTasksList';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Flashcard, Puzzle as PuzzleType, HomeworkTask } from '@/lib/types';

interface AddTasksStepProps {
  // Data
  flashcards: Flashcard[];
  puzzles: PuzzleType[];
  selectedTasks: HomeworkTask[];

  // Filters
  searchQuery: string;
  activeTab: 'flashcards' | 'puzzles';
  selectedTopics: string[];
  selectedDifficulties: number[];

  // Computed data
  filteredFlashcards: Flashcard[];
  filteredPuzzles: PuzzleType[];
  availableTopics: string[];
  availableDifficulties: number[];

  // Actions
  onSearchChange: (query: string) => void;
  onTabChange: (tab: 'flashcards' | 'puzzles') => void;
  onTopicToggle: (topic: string) => void;
  onDifficultyToggle: (difficulty: number) => void;
  onTaskToggle: (task: HomeworkTask) => void;
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (fromIndex: number, toIndex: number) => void;
  onClearAllTasks: () => void;
  onClearFilters: () => void;

  // Navigation
  onPrevious: () => void;
  onNext: () => void;
  canProceed: boolean;

  // Helper functions
  isTaskSelected: (taskId: string) => boolean;
}

export function AddTasksStep({
  flashcards,
  puzzles,
  selectedTasks,
  searchQuery,
  activeTab,
  selectedTopics,
  selectedDifficulties,
  filteredFlashcards,
  filteredPuzzles,
  availableTopics,
  availableDifficulties,
  onSearchChange,
  onTabChange,
  onTopicToggle,
  onDifficultyToggle,
  onTaskToggle,
  onRemoveTask,
  onReorderTasks,
  onClearAllTasks,
  onClearFilters,
  onPrevious,
  onNext,
  canProceed,
  isTaskSelected,
}: AddTasksStepProps) {

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const hasActiveFilters = selectedTopics.length > 0 || selectedDifficulties.length > 0;

  return (
    <div className="space-y-6">
      {/* Main Content - Task Library */}
      <Card>
        <div className="p-6">
          {/* Header Row - Tabs and Search/Filter */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'flashcards' | 'puzzles')} className="flex-1">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="flashcards" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Flashcards
                  <Badge variant="secondary" className="ml-auto">
                    {flashcards.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="puzzles" className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4" />
                  Puzzles
                  <Badge variant="secondary" className="ml-auto">
                    {puzzles.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and Filter */}
            <div className="flex items-center gap-2">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 bg-primary-foreground text-primary">
                    {selectedTopics.length + selectedDifficulties.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {isFiltersOpen && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">Filter {activeTab}</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="h-auto p-1 text-xs hover:text-destructive"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              {/* Flashcard Topics */}
              {activeTab === 'flashcards' && availableTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableTopics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <Button
                        key={topic}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onTopicToggle(topic)}
                        className="h-8"
                      >
                        {topic}
                        {isSelected && <CheckCircle2 className="w-3 h-3 ml-2" />}
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Puzzle Difficulties */}
              {activeTab === 'puzzles' && availableDifficulties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableDifficulties.map((difficulty) => {
                    const isSelected = selectedDifficulties.includes(difficulty);
                    return (
                      <Button
                        key={difficulty}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onDifficultyToggle(difficulty)}
                        className="h-8"
                      >
                        Level {difficulty}
                        {isSelected && <CheckCircle2 className="w-3 h-3 ml-2" />}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          <Tabs value={activeTab} className="space-y-4">
            {/* Flashcards Table */}
            <TabsContent value="flashcards" className="mt-0">
              {filteredFlashcards.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr className="border-b">
                          <th className="w-12 p-3 text-left">
                            <div className="flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">Select</span>
                            </div>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Term</span>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Definition</span>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Topic</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFlashcards.map((flashcard) => {
                          const selected = isTaskSelected(flashcard.id);
                          return (
                            <tr
                              key={flashcard.id}
                              className={cn(
                                "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                                selected && "bg-primary/5"
                              )}
                              onClick={() => onTaskToggle({ id: flashcard.id, type: 'flashcard', title: flashcard.term })}
                            >
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => onTaskToggle({ id: flashcard.id, type: 'flashcard', title: flashcard.term })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-medium text-sm">{flashcard.term}</span>
                              </td>
                              <td className="p-3">
                                <span className="text-sm text-muted-foreground line-clamp-2">{flashcard.definition}</span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {flashcard.topic}
                                  </Badge>
                                  {flashcard.subTopic && (
                                    <Badge variant="outline" className="text-xs">
                                      {flashcard.subTopic}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  type="flashcards"
                  hasSearchQuery={searchQuery.length > 0}
                  hasFilters={selectedTopics.length > 0}
                  onClearFilters={onClearFilters}
                />
              )}
            </TabsContent>

            {/* Puzzles Table */}
            <TabsContent value="puzzles" className="mt-0">
              {filteredPuzzles.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr className="border-b">
                          <th className="w-12 p-3 text-left">
                            <div className="flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">Select</span>
                            </div>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Level</span>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Title</span>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Description</span>
                          </th>
                          <th className="p-3 text-left">
                            <span className="text-xs font-medium text-muted-foreground">Section</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPuzzles.map((puzzle) => {
                          const selected = isTaskSelected(puzzle.id);
                          return (
                            <tr
                              key={puzzle.id}
                              className={cn(
                                "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                                selected && "bg-primary/5"
                              )}
                              onClick={() => onTaskToggle({ id: puzzle.id, type: 'puzzle', title: puzzle.title })}
                            >
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => onTaskToggle({ id: puzzle.id, type: 'puzzle', title: puzzle.title })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="default" className="text-xs">
                                  Level {puzzle.challengeLevel}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <span className="font-medium text-sm">{puzzle.title}</span>
                              </td>
                              <td className="p-3">
                                <span className="text-sm text-muted-foreground line-clamp-2">{puzzle.description}</span>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {puzzle.skillSection}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  type="puzzles"
                  hasSearchQuery={searchQuery.length > 0}
                  hasFilters={selectedDifficulties.length > 0}
                  onClearFilters={onClearFilters}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Selected Tasks */}
      {selectedTasks.length > 0 && (
        <SelectedTasksList
          tasks={selectedTasks}
          onRemoveTask={onRemoveTask}
          onReorderTasks={onReorderTasks}
          onClearAll={onClearAllTasks}
        />
      )}

      {/* Navigation */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {canProceed
                  ? `${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''} selected`
                  : "Select at least one task to continue"
                }
              </p>
            </div>

            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface EmptyStateProps {
  type: 'flashcards' | 'puzzles';
  hasSearchQuery: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({ type, hasSearchQuery, hasFilters, onClearFilters }: EmptyStateProps) {
  const icon = type === 'flashcards' ? BookOpen : Puzzle;
  const Icon = icon;

  return (
    <div className="text-center py-16 border rounded-lg bg-muted/20">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>

      {hasSearchQuery || hasFilters ? (
        <>
          <h3 className="text-lg font-semibold mb-2">No {type} found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filters to find more {type}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">No {type} available</h3>
          <p className="text-sm text-muted-foreground">
            There are no {type} in the system yet.
          </p>
        </>
      )}
    </div>
  );
}
