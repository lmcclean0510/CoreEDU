import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Send, BookOpen, Puzzle, Clock, Users, Eye, Edit, Calendar } from 'lucide-react';
import { SelectedTasksList } from './SelectedTasksList';
import type { HomeworkTask, ClassInfo, UserProfile } from '@/lib/types';

interface PreviewStepProps {
  // Homework data
  title: string;
  instructions: string;
  dueDate: string;
  selectedTasks: HomeworkTask[];
  classInfo: ClassInfo;
  students: UserProfile[];
  
  // State
  canSubmit: boolean;
  isCreating: boolean;
  
  // Actions
  onRemoveTask: (taskId: string) => void;
  onReorderTasks: (fromIndex: number, toIndex: number) => void;
  onClearAllTasks: () => void;
  onCreateHomework: () => void;
  onPrevious: () => void;
  onEditOverview: () => void;
  onEditTasks: () => void;
}

export function PreviewStep({
  title,
  instructions,
  dueDate,
  selectedTasks,
  classInfo,
  students,
  canSubmit,
  isCreating,
  onRemoveTask,
  onReorderTasks,
  onClearAllTasks,
  onCreateHomework,
  onPrevious,
  onEditOverview,
  onEditTasks,
}: PreviewStepProps) {
  
  const getEstimatedTime = () => {
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
  };

  const getTaskBreakdown = () => {
    const flashcardCount = selectedTasks.filter(t => t.type === 'flashcard').length;
    const puzzleCount = selectedTasks.filter(t => t.type === 'puzzle').length;
    return { flashcardCount, puzzleCount };
  };

  const { flashcardCount, puzzleCount } = getTaskBreakdown();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Preview & Publish</h2>
        <p className="text-muted-foreground mt-1">
          Review your homework assignment before publishing to students
        </p>
      </div>

      {/* Student View Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Student View Preview
              </CardTitle>
              <CardDescription>
                This is how your homework will appear to students
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Preview Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mock student view */}
          <div className="border-2 border-dashed border-muted rounded-lg p-6 bg-muted/20">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">Complete all the tasks below to finish your homework.</p>
            </div>
            
            {(instructions || dueDate) && (
              <div className="mb-6 space-y-3">
                {instructions && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <p className="text-sm">{instructions}</p>
                  </div>
                )}
                {dueDate && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </h3>
                    <p className="text-sm">
                      {new Date(dueDate).toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Flashcards</span>
                </div>
                <p className="text-xl font-bold">{flashcardCount}</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Puzzle className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">Puzzles</span>
                </div>
                <p className="text-xl font-bold">{puzzleCount}</p>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Estimated completion time: <Badge variant="secondary">{getEstimatedTime()}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        
        {/* Homework Details - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Homework Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={onEditOverview}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Title</Label>
              <p className="font-semibold">{title}</p>
            </div>
            
            {instructions && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Instructions</Label>
              <p className="text-sm">{instructions}</p>
            </div>
            )}
            
            {dueDate && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(dueDate).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            )}
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Target Class</Label>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{classInfo.className}</span>
                <Badge variant="outline">{classInfo.subject}</Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Students</Label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{students.length} students will receive this homework</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Task Order</h3>
          <p className="text-muted-foreground">
            Students will complete tasks in this order. Drag to reorder.
          </p>
        </div>
        
        <SelectedTasksList
          tasks={selectedTasks}
          onRemoveTask={onRemoveTask}
          onReorderTasks={onReorderTasks}
          onClearAll={onClearAllTasks}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" onClick={onPrevious} className="flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back: Add Tasks
        </Button>
        
        <Button 
          onClick={onCreateHomework}
          disabled={!canSubmit || isCreating}
          className="flex items-center justify-center gap-2"
          size="lg"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publishing Homework...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publish to {students.length} Students
            </>
          )}
        </Button>
      </div>

      {!canSubmit && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive text-center">
              {!title.trim() ? 'Please set a homework title' : 'Please select at least one task'} before publishing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}