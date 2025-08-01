
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, Trash2, Blocks, Keyboard } from 'lucide-react';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useHomeworkManagement } from '@/hooks/teacher/use-homework-management';
import type { UserProfile, HomeworkTask, ClassInfo, Flashcard, Puzzle } from '@/lib/types';
import { Card } from '../../ui/card';

interface CreateHomeworkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo;
  students: UserProfile[];
  onSuccess: () => void;
  flashcards: Flashcard[];
  puzzles: Puzzle[];
  fetchAssignmentData: () => void;
}

const mapSubjectToContent = (subject: ClassInfo['subject']): string => {
  const mapping = {
    'Computer Science': 'GCSE Computer Science',
    'Geography': 'GCSE Geography', // Example for future
    'Maths': 'GCSE Maths' // Example for future
  };
  return mapping[subject] || 'GCSE Computer Science';
}

export function CreateHomeworkDialog({
  isOpen,
  onClose,
  classInfo,
  students,
  onSuccess,
  flashcards,
  puzzles,
  fetchAssignmentData
}: CreateHomeworkDialogProps) {
  const { user } = useAuth();
  const { createHomework } = useHomeworkManagement();

  const [title, setTitle] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<HomeworkTask[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load assignment data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAssignmentData();
    }
  }, [isOpen, fetchAssignmentData]);

  const filteredPuzzles = useMemo(() => {
    if (!classInfo.subject) return puzzles;
    // This logic might need adjustment if puzzle sections aren't 1-to-1 with subjects
    // For now, let's assume we can filter based on a property if it exists
    return puzzles; 
  }, [puzzles, classInfo.subject]);
  
  const filteredFlashcards = useMemo(() => {
    if (!classInfo.subject) return flashcards;
    const contentSubject = mapSubjectToContent(classInfo.subject);
    return flashcards.filter(f => f.subject === contentSubject);
  }, [flashcards, classInfo.subject]);

  const handleTaskSelection = (task: HomeworkTask, isSelected: boolean) => {
    setSelectedTasks(prev => {
      if (isSelected) {
        return [...prev, task];
      } else {
        return prev.filter(t => t.id !== task.id);
      }
    });
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || selectedTasks.length === 0) return;

    setIsCreating(true);
    try {
      await createHomework(classInfo.id, user.uid, title, selectedTasks, students);
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSelectedTasks([]);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
      <DialogHeader className="p-6 pb-0">
        <DialogTitle>Create Homework for "{classInfo.className}"</DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-4 overflow-y-hidden">
        {/* Left side - Homework details and selected tasks */}
        <div className="flex flex-col gap-4 md:col-span-1">
          <div className="space-y-2">
            <Label htmlFor="hw-title">Homework Title</Label>
            <Input
              id="hw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., CPU & Memory Revision"
            />
          </div>
          
          <div className="flex-1 flex flex-col">
            <Label>Selected Tasks ({selectedTasks.length})</Label>
            <Card className="mt-2 flex-1">
                <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {selectedTasks.length > 0 ? (
                      selectedTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm">{task.title}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleTaskSelection(task, false)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Select tasks from the right to add them to the homework.
                    </div>
                  )}
                  </div>
                </ScrollArea>
            </Card>
          </div>
        </div>

        {/* Right side - Available tasks */}
        <div className="flex flex-col md:col-span-2">
          <Label>Available Tasks</Label>
          <Tabs defaultValue="flashcards" className="w-full mt-2 flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flashcards">
                <Keyboard className="mr-2" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="puzzles">
                <Blocks className="mr-2" />
                Puzzles
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="puzzles" className="flex-1 overflow-y-hidden mt-2">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {filteredPuzzles.map(puzzle => (
                    <div key={puzzle.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`task-${puzzle.id}`}
                        checked={selectedTasks.some(t => t.id === puzzle.id)}
                        onCheckedChange={(checked) => 
                          handleTaskSelection(
                            { id: puzzle.id, type: 'puzzle', title: puzzle.title }, 
                            !!checked
                          )
                        }
                      />
                      <Label htmlFor={`task-${puzzle.id}`} className="font-normal cursor-pointer">
                        Level {puzzle.challengeLevel}: {puzzle.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="flashcards" className="flex-1 overflow-y-hidden mt-2">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {filteredFlashcards.map(card => (
                    <div key={card.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`task-${card.id}`}
                        checked={selectedTasks.some(t => t.id === card.id)}
                        onCheckedChange={(checked) => 
                          handleTaskSelection(
                            { id: card.id, type: 'flashcard', title: card.term }, 
                            !!checked
                          )
                        }
                      />
                      <Label htmlFor={`task-${card.id}`} className="font-normal cursor-pointer">
                        {card.term}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <DialogFooter className="p-6 pt-0">
        <DialogClose asChild>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </DialogClose>
        <Button 
          onClick={handleSubmit} 
          disabled={isCreating || !title.trim() || selectedTasks.length === 0}
        >
          {isCreating && <LoaderCircle className="animate-spin mr-2" />}
          Assign Homework
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
