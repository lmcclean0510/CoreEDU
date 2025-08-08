// src/app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { LoaderCircle, BookOpen, Puzzle, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/providers/UserProvider';
import type { Flashcard, Puzzle } from '@/lib/types';

// Import our hooks and components
import { useAdminFlashcards, type FlashcardFormData } from './hooks/useAdminFlashcards';
import { useAdminPuzzles, type PuzzleFormData } from './hooks/useAdminPuzzles';
import { FlashcardForm } from './components/FlashcardForm';
import { PuzzleForm } from './components/PuzzleForm';
import { AdminHeader } from './components/AdminHeader';
import { FlashcardManagement } from './components/FlashcardManagement';
import { PuzzleManagement } from './components/PuzzleManagement';
import { AdminAnalytics } from './components/AdminAnalytics';
import { JsonImportDialog } from './components/JsonImportDialog';
import { PuzzleJsonImportDialog } from './components/PuzzleJsonImportDialog';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  
  // Use our custom hooks for data management
  const {
    flashcards,
    isLoading: flashcardsLoading,
    isSaving: flashcardsSaving,
    loadFlashcards,
    saveFlashcard,
    deleteFlashcard
  } = useAdminFlashcards();
  
  const {
    puzzles,
    isLoading: puzzlesLoading,
    isSaving: puzzlesSaving,
    loadPuzzles,
    savePuzzle,
    deletePuzzle
  } = useAdminPuzzles();
  
  // UI state
  const [activeTab, setActiveTab] = useState('flashcards');
  const [isFlashcardDialogOpen, setIsFlashcardDialogOpen] = useState(false);
  const [isPuzzleDialogOpen, setIsPuzzleDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isPuzzleImportDialogOpen, setIsPuzzleImportDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | undefined>();
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<{ type: 'flashcard' | 'puzzle'; id: string } | null>(null);

  // Track what data has been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set()); // Start with nothing loaded

  // Check if user is admin
  useEffect(() => {
    if (user && !isAdmin) {
      console.warn('User does not have admin access');
    }
  }, [user, isAdmin]);

  // No auto-loading on mount - user must click to load

  // Handle tab changes (no auto-loading)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Don't auto-load anything - user must click to load
  };

  // Manual load functions
  const handleLoadFlashcards = () => {
    if (!loadedTabs.has('flashcards')) {
      setLoadedTabs(prev => new Set([...prev, 'flashcards']));
      loadFlashcards();
    }
  };

  const handleLoadPuzzles = () => {
    if (!loadedTabs.has('puzzles')) {
      setLoadedTabs(prev => new Set([...prev, 'puzzles']));
      loadPuzzles();
    }
  };

  const handleLoadAnalytics = () => {
    const toLoad = [];
    if (!loadedTabs.has('flashcards')) {
      toLoad.push('flashcards');
      loadFlashcards();
    }
    if (!loadedTabs.has('puzzles')) {
      toLoad.push('puzzles');
      loadPuzzles();
    }
    if (toLoad.length > 0) {
      setLoadedTabs(prev => new Set([...prev, ...toLoad]));
    }
  };

  // Form handlers
  const handleSaveFlashcard = async (flashcard: FlashcardFormData) => {
    const success = await saveFlashcard(flashcard, editingFlashcard?.id);
    if (success) {
      setIsFlashcardDialogOpen(false);
      setEditingFlashcard(undefined);
    }
  };

  const handleSavePuzzle = async (puzzle: PuzzleFormData) => {
    const success = await savePuzzle(puzzle, editingPuzzle?.id);
    if (success) {
      setIsPuzzleDialogOpen(false);
      setEditingPuzzle(undefined);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmOpen) return;
    
    const success = deleteConfirmOpen.type === 'flashcard' 
      ? await deleteFlashcard(deleteConfirmOpen.id)
      : await deletePuzzle(deleteConfirmOpen.id);
    
    if (success) {
      setDeleteConfirmOpen(null);
    }
  };

  // Edit handlers
  const handleEditFlashcard = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setIsFlashcardDialogOpen(true);
  };

  const handleEditPuzzle = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setIsPuzzleDialogOpen(true);
  };

  // Delete handlers
  const handleDeleteFlashcard = (id: string) => {
    setDeleteConfirmOpen({ type: 'flashcard', id });
  };

  const handleDeletePuzzle = (id: string) => {
    setDeleteConfirmOpen({ type: 'puzzle', id });
  };

  // Import handlers
  const handleImportComplete = () => {
    loadFlashcards(); // Refresh flashcards after import
  };

  const handlePuzzleImportComplete = () => {
    loadPuzzles(); // Refresh puzzles after import
  };

  const isSaving = flashcardsSaving || puzzlesSaving;

  // Remove the initial loading check entirely since we don't auto-load anything
  // if (isInitialLoading) {
  //   return loading screen
  // }

  return (
      <div className="container mx-auto p-6 space-y-6">
        <AdminHeader
          flashcards={flashcards}
          puzzles={puzzles}
          activeTab={activeTab}
          onAddFlashcard={() => setIsFlashcardDialogOpen(true)}
          onAddPuzzle={() => setIsPuzzleDialogOpen(true)}
          onImportFlashcards={() => setIsImportDialogOpen(true)}
          onImportPuzzles={() => setIsPuzzleImportDialogOpen(true)}
        />

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="puzzles">Puzzles</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards">
            {loadedTabs.has('flashcards') ? (
              flashcardsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-4">
                    <LoaderCircle className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading flashcards...</p>
                  </div>
                </div>
              ) : (
                <FlashcardManagement
                  flashcards={flashcards}
                  onEdit={handleEditFlashcard}
                  onDelete={handleDeleteFlashcard}
                  onAdd={() => setIsFlashcardDialogOpen(true)}
                />
              )
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Flashcard Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Load existing flashcards to view, edit, or manage them.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleLoadFlashcards}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Load Flashcards
                      </Button>
                      <Button variant="outline" onClick={() => setIsFlashcardDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Flashcard
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="puzzles">
            {loadedTabs.has('puzzles') ? (
              puzzlesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-4">
                    <LoaderCircle className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading puzzles...</p>
                  </div>
                </div>
              ) : (
                <PuzzleManagement
                  puzzles={puzzles}
                  onEdit={handleEditPuzzle}
                  onDelete={handleDeletePuzzle}
                  onAdd={() => setIsPuzzleDialogOpen(true)}
                />
              )
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Puzzle className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Puzzle Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Load existing puzzles to view, edit, or manage them.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleLoadPuzzles}>
                        <Puzzle className="w-4 h-4 mr-2" />
                        Load Puzzles
                      </Button>
                      <Button variant="outline" onClick={() => setIsPuzzleDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Puzzle
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {loadedTabs.has('analytics') || (loadedTabs.has('flashcards') && loadedTabs.has('puzzles')) ? (
              (flashcardsLoading || puzzlesLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-4">
                    <LoaderCircle className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading analytics data...</p>
                  </div>
                </div>
              ) : (
                <AdminAnalytics
                  flashcards={flashcards}
                  puzzles={puzzles}
                  onRefreshFlashcards={loadFlashcards}
                  onRefreshPuzzles={loadPuzzles}
                />
              )
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Content Analytics</h3>
                    <p className="text-muted-foreground mb-4">
                      Load content data to view analytics and insights.
                    </p>
                    <Button onClick={handleLoadAnalytics}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Load Analytics Data
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Flashcard Dialog */}
        <Dialog open={isFlashcardDialogOpen} onOpenChange={setIsFlashcardDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFlashcard ? 'Edit Flashcard' : 'Add New Flashcard'}
              </DialogTitle>
              <DialogDescription>
                Create or modify flashcard content for the CoreEDU learning platform.
              </DialogDescription>
            </DialogHeader>
            <FlashcardForm
              flashcard={editingFlashcard}
              onSave={handleSaveFlashcard}
              onCancel={() => {
                setIsFlashcardDialogOpen(false);
                setEditingFlashcard(undefined);
              }}
              isLoading={isSaving}
            />
          </DialogContent>
        </Dialog>

        {/* Puzzle Dialog */}
        <Dialog open={isPuzzleDialogOpen} onOpenChange={setIsPuzzleDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPuzzle ? 'Edit Puzzle' : 'Add New Puzzle'}
              </DialogTitle>
              <DialogDescription>
                Create or modify coding puzzles for the CoreCS programming challenges.
              </DialogDescription>
            </DialogHeader>
            <PuzzleForm
              puzzle={editingPuzzle}
              onSave={handleSavePuzzle}
              onCancel={() => {
                setIsPuzzleDialogOpen(false);
                setEditingPuzzle(undefined);
              }}
              isLoading={isSaving}
            />
          </DialogContent>
        </Dialog>

        {/* JSON Import Dialog */}
        <JsonImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImportComplete={handleImportComplete}
        />

        {/* Puzzle JSON Import Dialog */}
        <PuzzleJsonImportDialog
          open={isPuzzleImportDialogOpen}
          onOpenChange={setIsPuzzleImportDialogOpen}
          onImportComplete={handlePuzzleImportComplete}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmOpen} onOpenChange={(open) => !open && setDeleteConfirmOpen(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {deleteConfirmOpen?.type} and remove it from the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}