// src/app/admin/components/PuzzleManagement.tsx
import { Plus, Edit, Trash2, Code, Search, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Puzzle } from '@/lib/types';
import { useContentSearch } from '../hooks/useContentSearch';

interface PuzzleManagementProps {
  puzzles: Puzzle[];
  onEdit: (puzzle: Puzzle) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function PuzzleManagement({ 
  puzzles, 
  onEdit, 
  onDelete, 
  onAdd 
}: PuzzleManagementProps) {
  // Use our reusable search hook
  const {
    searchTerm,
    filterValue,
    filteredItems: filteredPuzzles,
    setSearchTerm,
    setFilterValue,
    clearSearch,
    hasActiveFilters,
    availableFilterOptions,
    filteredCount,
    totalItems
  } = useContentSearch(puzzles, {
    searchFields: ['title', 'description', 'skillSection'],
    filterField: 'challengeLevel',
    filterOptions: ['1', '2', '3', '4', '5'],
    defaultFilter: 'all'
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search puzzles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {[1, 2, 3, 4, 5].map(level => (
              <SelectItem key={level} value={level.toString()}>
                Level {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearSearch}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalItems} puzzles
          {searchTerm && (
            <span> matching "{searchTerm}"</span>
          )}
          {filterValue !== 'all' && (
            <span> at Level {filterValue}</span>
          )}
        </div>
      )}

      {/* Puzzles List */}
      <div className="grid gap-4">
        {filteredPuzzles.map((puzzle) => (
          <Card key={puzzle.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{puzzle.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">Level {puzzle.challengeLevel}</Badge>
                    <Badge variant="secondary">{puzzle.skillSection}</Badge>
                    {puzzle.isDynamic && <Badge variant="destructive">Dynamic</Badge>}
                  </div>
                  <CardDescription>
                    {puzzle.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(puzzle)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(puzzle.id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Code Blocks ({puzzle.initialBlocks.length}):</Label>
                  <div className="mt-2 space-y-1">
                    {puzzle.initialBlocks.slice(0, 3).map((block, idx) => (
                      <div key={idx} className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {block}
                      </div>
                    ))}
                    {puzzle.initialBlocks.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{puzzle.initialBlocks.length - 3} more blocks
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Expected Output:</Label>
                  <div className="mt-2 bg-green-50 px-2 py-1 rounded text-xs font-mono border-l-4 border-green-500">
                    {puzzle.expectedOutput}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPuzzles.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {hasActiveFilters ? 'No puzzles found' : 'No puzzles yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first coding puzzle.'
              }
            </p>
            {hasActiveFilters ? (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={clearSearch}>
                  Clear Filters
                </Button>
                <Button onClick={onAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Puzzle
                </Button>
              </div>
            ) : (
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Puzzle
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}