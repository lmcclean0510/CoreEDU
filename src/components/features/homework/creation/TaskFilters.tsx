import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, Filter, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'flashcards' | 'puzzles';
  
  // Flashcard filters
  availableTopics?: string[];
  selectedTopics?: string[];
  onTopicToggle?: (topic: string) => void;
  
  // Puzzle filters
  availableDifficulties?: number[];
  selectedDifficulties?: number[];
  onDifficultyToggle?: (difficulty: number) => void;
  
  // Clear filters
  onClearFilters: () => void;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  availableTopics = [],
  selectedTopics = [],
  onTopicToggle,
  availableDifficulties = [],
  selectedDifficulties = [],
  onDifficultyToggle,
  onClearFilters,
}: TaskFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const hasActiveFilters = selectedTopics.length > 0 || selectedDifficulties.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs ml-1">
              {selectedTopics.length + selectedDifficulties.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Content - Full Width */}
      {isFiltersOpen && (
        <Card className="w-full">
          <CardContent className="p-4">
            {hasActiveFilters && (
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
                        onClick={() => onTopicToggle?.(topic)}
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
                        onClick={() => onDifficultyToggle?.(difficulty)}
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
  );
}