import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Puzzle, Search, SlidersHorizontal, X, CheckCircle2, Plus, Minus } from 'lucide-react';
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
  isTaskSelected,
}: AddTasksStepProps) {

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleType | null>(null);

  const hasActiveFilters = selectedTopics.length > 0 || selectedDifficulties.length > 0;

  const handleFlashcardClick = (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setSelectedPuzzle(null);
  };

  const handlePuzzleClick = (puzzle: PuzzleType) => {
    setSelectedPuzzle(puzzle);
    setSelectedFlashcard(null);
  };

  const currentDetail = selectedFlashcard || selectedPuzzle;
  const currentDetailIsSelected = currentDetail ? isTaskSelected(currentDetail.id) : false;

  const handleDetailToggle = () => {
    if (!currentDetail) return;

    if (selectedFlashcard) {
      onTaskToggle({ id: selectedFlashcard.id, type: 'flashcard', title: selectedFlashcard.term });
    } else if (selectedPuzzle) {
      onTaskToggle({ id: selectedPuzzle.id, type: 'puzzle', title: selectedPuzzle.title });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'flashcards' | 'puzzles')}>
              <TabsList className="grid w-full max-w-sm grid-cols-2">
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
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
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
        </div>
      </Card>

      {/* Split View - List and Detail */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Panel - Compact List */}
        <Card className="h-[600px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} className="h-full flex flex-col">
              {/* Flashcards List */}
              <TabsContent value="flashcards" className="flex-1 m-0">
                <div className="h-full overflow-y-auto">
                  {filteredFlashcards.length > 0 ? (
                    <div className="divide-y">
                      {filteredFlashcards.map((flashcard) => {
                        const selected = isTaskSelected(flashcard.id);
                        const isActive = selectedFlashcard?.id === flashcard.id;
                        return (
                          <div
                            key={flashcard.id}
                            className={cn(
                              "p-3 hover:bg-muted/30 transition-colors cursor-pointer",
                              selected && "bg-primary/5",
                              isActive && "bg-muted/50"
                            )}
                            onClick={() => handleFlashcardClick(flashcard)}
                          >
                            <div className="flex items-start gap-3">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() => onTaskToggle({ id: flashcard.id, type: 'flashcard', title: flashcard.term })}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{flashcard.term}</p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {flashcard.topic}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState type="flashcards" hasSearchQuery={searchQuery.length > 0} hasFilters={selectedTopics.length > 0} onClearFilters={onClearFilters} />
                  )}
                </div>
              </TabsContent>

              {/* Puzzles List */}
              <TabsContent value="puzzles" className="flex-1 m-0">
                <div className="h-full overflow-y-auto">
                  {filteredPuzzles.length > 0 ? (
                    <div className="divide-y">
                      {filteredPuzzles.map((puzzle) => {
                        const selected = isTaskSelected(puzzle.id);
                        const isActive = selectedPuzzle?.id === puzzle.id;
                        return (
                          <div
                            key={puzzle.id}
                            className={cn(
                              "p-3 hover:bg-muted/30 transition-colors cursor-pointer",
                              selected && "bg-primary/5",
                              isActive && "bg-muted/50"
                            )}
                            onClick={() => handlePuzzleClick(puzzle)}
                          >
                            <div className="flex items-start gap-3">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() => onTaskToggle({ id: puzzle.id, type: 'puzzle', title: puzzle.title })}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="default" className="text-xs">
                                    Level {puzzle.challengeLevel}
                                  </Badge>
                                </div>
                                <p className="font-medium text-sm line-clamp-1">{puzzle.title}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState type="puzzles" hasSearchQuery={searchQuery.length > 0} hasFilters={selectedDifficulties.length > 0} onClearFilters={onClearFilters} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Right Panel - Detail View */}
        <Card className="h-[400px] flex flex-col">
          {currentDetail ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6">
                {selectedFlashcard && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{selectedFlashcard.term}</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary">{selectedFlashcard.topic}</Badge>
                          {selectedFlashcard.subTopic && (
                            <Badge variant="outline">{selectedFlashcard.subTopic}</Badge>
                          )}
                        </div>
                      </div>
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Definition</h4>
                      <p className="text-sm">{selectedFlashcard.definition}</p>
                    </div>

                    {selectedFlashcard.hints?.length ? (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Hint</h4>
                        <p className="text-sm text-muted-foreground">{selectedFlashcard.hints[0]}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {selectedPuzzle && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{selectedPuzzle.title}</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="default">Level {selectedPuzzle.challengeLevel}</Badge>
                          <Badge variant="outline">{selectedPuzzle.skillSection}</Badge>
                        </div>
                      </div>
                      <Puzzle className="w-6 h-6 text-secondary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                      <p className="text-sm">{selectedPuzzle.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">Details</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedPuzzle.initialBlocks?.length || 0} blocks to arrange
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="border-t p-4">
                <Button
                  onClick={handleDetailToggle}
                  className="w-full"
                  variant={currentDetailIsSelected ? "destructive" : "default"}
                >
                  {currentDetailIsSelected ? (
                    <>
                      <Minus className="w-4 h-4 mr-2" />
                      Remove from Homework
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Homework
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  {activeTab === 'flashcards' ? (
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <Puzzle className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">No {activeTab === 'flashcards' ? 'flashcard' : 'puzzle'} selected</h3>
                <p className="text-sm text-muted-foreground">
                  Click on a {activeTab === 'flashcards' ? 'flashcard' : 'puzzle'} to view details
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Selected Tasks */}
      {selectedTasks.length > 0 && (
        <SelectedTasksList
          tasks={selectedTasks}
          onRemoveTask={onRemoveTask}
          onReorderTasks={onReorderTasks}
          onClearAll={onClearAllTasks}
        />
      )}
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
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>

      {hasSearchQuery || hasFilters ? (
        <>
          <h3 className="text-lg font-semibold mb-2">No {type} found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filters
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
