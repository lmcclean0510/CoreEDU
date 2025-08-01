// src/app/admin/components/AdminHeader.tsx
import { Plus, BookOpen, Puzzle, Brain, CheckCircle, Upload, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Flashcard, Puzzle as PuzzleType } from '@/lib/types';

interface AdminHeaderProps {
  flashcards: Flashcard[];
  puzzles: PuzzleType[];
  activeTab: string;
  onAddFlashcard: () => void;
  onAddPuzzle: () => void;
  onImportFlashcards: () => void;
  onImportPuzzles: () => void;
}

export function AdminHeader({ 
  flashcards, 
  puzzles, 
  activeTab,
  onAddFlashcard, 
  onAddPuzzle,
  onImportFlashcards,
  onImportPuzzles
}: AdminHeaderProps) {
  // Render different stats based on active tab
  const renderStats = () => {
    switch (activeTab) {
      case 'flashcards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flashcards</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcards.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(flashcards.map(f => f.subject)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exam Boards</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(flashcards.map(f => f.examBoard)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Topics</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(flashcards.map(f => f.topic)).size}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'puzzles':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Puzzles</CardTitle>
                <Puzzle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{puzzles.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lesson Range</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {puzzles.length > 0 
                    ? `${Math.min(...puzzles.map(p => p.challengeLevel))}-${Math.max(...puzzles.map(p => p.challengeLevel))}`
                    : '0'
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skill Sections</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(puzzles.map(p => p.skillSection).filter(Boolean)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dynamic Puzzles</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {puzzles.filter(p => p.isDynamic).length}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcards.length + puzzles.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcards.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Puzzles</CardTitle>
                <Puzzle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{puzzles.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Render different action buttons based on active tab
  const renderActions = () => {
    switch (activeTab) {
      case 'flashcards':
        return (
          <div className="flex gap-2">
            <Button onClick={onAddFlashcard}>
              <Plus className="w-4 h-4 mr-2" />
              Add Flashcard
            </Button>
            <Button onClick={onImportFlashcards} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
          </div>
        );

      case 'puzzles':
        return (
          <div className="flex gap-2">
            <Button onClick={onAddPuzzle}>
              <Plus className="w-4 h-4 mr-2" />
              Add Puzzle
            </Button>
            <Button onClick={onImportPuzzles} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
          </div>
        );

      case 'analytics':
        return (
          <div className="flex gap-2">
            <Button onClick={onAddFlashcard} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Flashcard
            </Button>
            <Button onClick={onAddPuzzle} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Puzzle
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            {activeTab === 'flashcards' && 'Manage flashcard content for the CoreEDU learning platform'}
            {activeTab === 'puzzles' && 'Manage coding puzzles for the CoreCS programming challenges'}
            {activeTab === 'analytics' && 'Overview and insights across all educational content'}
          </p>
        </div>
        {renderActions()}
      </div>

      {/* Contextual Stats */}
      {renderStats()}
    </>
  );
}