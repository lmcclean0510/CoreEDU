import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, BookOpen, Puzzle, Search, Filter, X } from 'lucide-react';
import { TaskCard } from './TaskCard';
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
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Add Tasks</h2>
        <p className="text-muted-foreground mt-1">
          Select flashcards and puzzles to include in your homework
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Task Library - Full Width */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Task Library</CardTitle>
            <CardDescription>
              Browse and select tasks to include in your homework assignment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col p-6 pt-0">
            {/* Tabs Section - Moved to Top */}
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'flashcards' | 'puzzles')} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="flashcards" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Flashcards
                  <Badge variant="secondary" className="ml-1">
                    {filteredFlashcards.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="puzzles" className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4" />
                  Puzzles
                  <Badge variant="secondary" className="ml-1">
                    {filteredPuzzles.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Search and Filters Section */}
              <div className="space-y-4 mb-6">
                {/* Search and Filter Button Row */}
                <div className="flex gap-2">
                  {/* Search - Takes most space */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Button - Compact */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className="flex items-center gap-2 h-10"
                    >
                      <Filter className="w-4 h-4" />
                      {(selectedTopics.length > 0 || selectedDifficulties.length > 0) && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {selectedTopics.length + selectedDifficulties.length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Filter Content - Full Width Below */}
                {isFiltersOpen && (
                  <Card className="w-full">
                    <CardContent className="p-4">
                      {(selectedTopics.length > 0 || selectedDifficulties.length > 0) && (
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-muted-foreground">Active filters:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="h-auto p-1 text-xs"
                          >
                            Clear all
                          </Button>
                        </div>
                      )}

                      {/* Flashcard Topics */}
                      {activeTab === 'flashcards' && availableTopics.length > 0 && (
                        <div className="space-y-3">
                          <CardDescription className="text-xs font-medium">Topics</CardDescription>
                          <div className="flex flex-wrap gap-2">
                            {availableTopics.map((topic) => {
                              const isSelected = selectedTopics.includes(topic);
                              return (
                                <Button
                                  key={topic}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => onTopicToggle(topic)}
                                  className={cn(
                                    "h-7 text-xs",
                                    isSelected && "bg-primary text-primary-foreground"
                                  )}
                                >
                                  {topic}
                                  {isSelected && (
                                    <X className="w-3 h-3 ml-1" />
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Puzzle Difficulties */}
                      {activeTab === 'puzzles' && availableDifficulties.length > 0 && (
                        <div className="space-y-3">
                          <CardDescription className="text-xs font-medium">Difficulty Levels</CardDescription>
                          <div className="flex flex-wrap gap-2">
                            {availableDifficulties.map((difficulty) => {
                              const isSelected = selectedDifficulties.includes(difficulty);
                              return (
                                <Button
                                  key={difficulty}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => onDifficultyToggle(difficulty)}
                                  className={cn(
                                    "h-7 text-xs",
                                    isSelected && "bg-primary text-primary-foreground"
                                  )}
                                >
                                  Level {difficulty}
                                  {isSelected && (
                                    <X className="w-3 h-3 ml-1" />
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No filters available */}
                      {((activeTab === 'flashcards' && availableTopics.length === 0) ||
                        (activeTab === 'puzzles' && availableDifficulties.length === 0)) && (
                        <div className="text-center py-4">
                          <CardDescription className="text-xs">
                            No filters available for {activeTab}
                          </CardDescription>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards" className="flex-1 mt-0">
                <ScrollArea className="h-[500px] pr-4">
                  {filteredFlashcards.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredFlashcards.map((flashcard) => (
                        <TaskCard
                          key={flashcard.id}
                          task={flashcard}
                          type="flashcard"
                          isSelected={isTaskSelected(flashcard.id)}
                          onToggle={onTaskToggle}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState 
                      type="flashcards" 
                      hasSearchQuery={searchQuery.length > 0}
                      hasFilters={selectedTopics.length > 0}
                      onClearFilters={onClearFilters}
                    />
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Puzzles Tab */}
              <TabsContent value="puzzles" className="flex-1 mt-0">
                <ScrollArea className="h-[500px] pr-4">
                  {filteredPuzzles.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredPuzzles.map((puzzle) => (
                        <TaskCard
                          key={puzzle.id}
                          task={puzzle}
                          type="puzzle"
                          isSelected={isTaskSelected(puzzle.id)}
                          onToggle={onTaskToggle}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState 
                      type="puzzles" 
                      hasSearchQuery={searchQuery.length > 0}
                      hasFilters={selectedDifficulties.length > 0}
                      onClearFilters={onClearFilters}
                    />
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected Tasks - Full Width Below */}
        <SelectedTasksList
          tasks={selectedTasks}
          onRemoveTask={onRemoveTask}
          onReorderTasks={onReorderTasks}
          onClearAll={onClearAllTasks}
        />
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back: Overview
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {canProceed 
                  ? `Ready to preview with ${selectedTasks.length} tasks`
                  : "Select at least one task to continue"
                }
              </p>
            </div>
            
            <Button 
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              Next: Preview
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
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
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      
      {hasSearchQuery || hasFilters ? (
        <>
          <CardTitle className="text-lg mb-2">No {type} found</CardTitle>
          <CardDescription className="mb-4">
            Try adjusting your search or filters to find more {type}.
          </CardDescription>
          <button
            onClick={onClearFilters}
            className="text-primary hover:underline text-sm"
          >
            Clear all filters
          </button>
        </>
      ) : (
        <>
          <CardTitle className="text-lg mb-2">No {type} available</CardTitle>
          <CardDescription>
            There are no {type} in the system yet. Contact your administrator to add content.
          </CardDescription>
        </>
      )}
    </div>
  );
}