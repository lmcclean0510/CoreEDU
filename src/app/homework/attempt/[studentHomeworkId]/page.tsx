"use client";

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, query, collection, where, getDocs, documentId } from 'firebase/firestore';
import type { HomeworkAssignment, StudentHomework, HomeworkTask, Flashcard, Puzzle } from '@/lib/types';

import { HomeworkFlashCardClient } from '@/components/features/homework/homework-flash-card-client';
import { PuzzleClient } from '@/components/features/puzzles/puzzle-client';
import { DueDateBadge } from '@/components/shared/DueDateBadge';
import { LoaderCircle, ArrowLeft, CheckCircle, Circle, ClipboardList, BookOpen, Puzzle as PuzzleIcon, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type EnrichedHomework = {
  assignment: HomeworkAssignment;
  studentData: StudentHomework;
  tasks: (Puzzle | Flashcard & { type: 'flashcard' | 'puzzle' })[];
};

export default function HomeworkAttemptPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentHomeworkId = params.studentHomeworkId as string;

  const [homeworkData, setHomeworkData] = useState<EnrichedHomework | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && studentHomeworkId) {
      const fetchHomeworkData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const studentHomeworkRef = doc(db, 'studentHomeworks', studentHomeworkId);
          const studentHomeworkSnap = await getDoc(studentHomeworkRef);

          if (!studentHomeworkSnap.exists() || studentHomeworkSnap.data().studentId !== user.uid) {
            setError("Homework not found or you don't have access.");
            setIsLoading(false);
            return;
          }
          const studentData = { id: studentHomeworkSnap.id, ...studentHomeworkSnap.data() } as StudentHomework;
          setCompletedTaskIds(new Set(studentData.progress.completedTaskIds));

          const homeworkRef = doc(db, 'homework', studentData.homeworkId);
          const homeworkSnap = await getDoc(homeworkRef);
          if (!homeworkSnap.exists()) {
             setError("Could not load the assignment details.");
             setIsLoading(false);
             return;
          }
          const assignment = { id: homeworkSnap.id, ...homeworkSnap.data() } as HomeworkAssignment;

          if (assignment.tasks.length === 0) {
              setHomeworkData({ assignment, studentData, tasks: [] });
              setIsLoading(false);
              return;
          }
          
          const puzzlesToFetch = assignment.tasks.filter(t => t.type === 'puzzle').map(t => t.id);
          const flashcardsToFetch = assignment.tasks.filter(t => t.type === 'flashcard').map(t => t.id);

          const fetchedTasks: (Puzzle | Flashcard)[] = [];

          if (puzzlesToFetch.length > 0) {
              const puzzleQuery = query(collection(db, 'puzzles'), where(documentId(), 'in', puzzlesToFetch));
              const puzzleDocs = await getDocs(puzzleQuery);
              puzzleDocs.forEach(doc => fetchedTasks.push({ id: doc.id, ...doc.data()} as Puzzle));
          }
          if (flashcardsToFetch.length > 0) {
              const flashcardQuery = query(collection(db, 'flashcards'), where(documentId(), 'in', flashcardsToFetch));
              const flashcardDocs = await getDocs(flashcardQuery);
              flashcardDocs.forEach(doc => fetchedTasks.push({ id: doc.id, ...doc.data()} as Flashcard));
          }
          
          // Re-order tasks to match the order set by the teacher
          const orderedTasks = assignment.tasks.map(task => {
              const foundTask = fetchedTasks.find(t => t.id === task.id);
              // Add the type back to the fetched task for rendering logic
              return foundTask ? { ...foundTask, type: task.type } : null;
          }).filter(Boolean) as (Puzzle | Flashcard & { type: 'flashcard' | 'puzzle' })[];

          setHomeworkData({ assignment, studentData, tasks: orderedTasks });
          
          if (studentData.status === 'not-started') {
              await updateDoc(studentHomeworkRef, { status: 'in-progress' });
          }

        } catch (err) {
          console.error("Error fetching homework data:", err);
          setError("An error occurred while loading your homework.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchHomeworkData();
    }
  }, [user, studentHomeworkId]);

  const onTaskCompleted = async (taskId: string) => {
    if (!homeworkData || completedTaskIds.has(taskId)) return;

    const studentHomeworkRef = doc(db, 'studentHomeworks', homeworkData.studentData.id);
    
    await updateDoc(studentHomeworkRef, {
      'progress.completedTaskIds': arrayUnion(taskId)
    });
    
    setCompletedTaskIds(prev => new Set(prev).add(taskId));
  };

  const onAllTasksCompleted = async () => {
    if (!homeworkData) return;
    const studentHomeworkRef = doc(db, 'studentHomeworks', homeworkData.studentData.id);
    await updateDoc(studentHomeworkRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    router.push('/dashboard/student');
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
      return (
          <div className="flex h-screen w-full items-center justify-center p-4 text-center">
              <div>
                  <p className="text-destructive mb-4">{error}</p>
                  <Button asChild><Link href="/dashboard/student">Go to Dashboard</Link></Button>
              </div>
          </div>
      );
  }

  if (!homeworkData) {
    return notFound();
  }

  const currentTask = homeworkData.tasks[currentTaskIndex];
  const allTasksCompleted = completedTaskIds.size === homeworkData.tasks.length;
  const completedCount = completedTaskIds.size;
  const totalCount = homeworkData.tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const renderTaskContent = () => {
    if (!currentTask) return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Select a task to begin.</p>
      </div>
    );

    const taskType = currentTask.type;
    
    if (taskType === 'flashcard') {
        return (
            <HomeworkFlashCardClient 
                flashcard={currentTask as Flashcard}
                onCompleted={() => onTaskCompleted(currentTask.id)}
            />
        );
    }
    
    if (taskType === 'puzzle') {
        return (
            <PuzzleClient 
                puzzle={currentTask as Puzzle} 
                onComplete={() => onTaskCompleted(currentTask.id)}
                isHomeworkMode={true}
            />
        );
    }

    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">This homework type is not supported yet.</p>
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Task Navigation (Narrower) */}
      <div className="w-64 bg-muted/30 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-full">
              <Link href="/dashboard/student">
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </Button>
            <span className="text-xs font-medium text-muted-foreground">Back to Dashboard</span>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 p-3">
          <h4 className="font-medium text-xs mb-3 flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="w-3 h-3" />
            Tasks
          </h4>
          
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-1">
              {homeworkData.tasks.map((task, index) => {
                const isCompleted = completedTaskIds.has(task.id);
                const isActive = currentTaskIndex === index;
                const title = 'term' in task ? task.term : task.title;
                const taskType = task.type;
                
                return (
                  <Button
                    key={task.id}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left h-auto p-2 group text-xs",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setCurrentTaskIndex(index)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {/* Status Icon */}
                      {isCompleted ? (
                        <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      )}
                      
                      {/* Task Type Icon */}
                      {taskType === 'flashcard' ? (
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <PuzzleIcon className="w-3 h-3 flex-shrink-0" />
                      )}
                      
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{index + 1}. {title}</p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Completion Status */}
        {allTasksCompleted && (
          <div className="p-3 border-t border-border">
            <div className="p-3 rounded-lg bg-success/10 border border-success text-center">
              <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
              <h3 className="text-sm font-bold">Excellent Work!</h3>
              <p className="text-xs text-muted-foreground mb-2">You've completed all tasks.</p>
              <Button 
                onClick={onAllTasksCompleted} 
                size="sm"
                className="w-full bg-success text-success-foreground hover:bg-success/90"
              >
                Submit Homework
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area (Wider) */}
      <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-background to-muted/20">
        {/* Compact Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-5xl py-4 px-6">
            <div className="flex items-center justify-between">
              {/* Left: Title and Due Date */}
              <div>
                <h1 className="text-2xl font-bold font-headline">{homeworkData.assignment.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">Complete all tasks to finish</p>
                  {homeworkData.assignment.dueDate && (
                    <DueDateBadge 
                      dueDate={homeworkData.assignment.dueDate}
                      isCompleted={allTasksCompleted}
                      variant="compact"
                    />
                  )}
                </div>
              </div>
              
              {/* Right: Summary Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Est. {(() => {
                      const flashcardCount = homeworkData.tasks.filter(t => t.type === 'flashcard').length;
                      const puzzleCount = homeworkData.tasks.filter(t => t.type === 'puzzle').length;
                      const totalMinutes = (flashcardCount * 2) + (puzzleCount * 5);
                      return totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                    })()} 
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />
                  <span>{totalCount} tasks</span>
                </div>
              </div>
            </div>
            
            {homeworkData.assignment.instructions && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium mb-1">Instructions:</p>
                <p className="text-xs text-muted-foreground">{homeworkData.assignment.instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Content - Full Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full flex flex-col">
            {currentTask && (
              <div className="px-6 py-4 border-b border-border bg-background/95">
                <div className="container mx-auto max-w-4xl">
                  <div className="flex items-center gap-3">
                    {currentTask.type === 'flashcard' ? (
                      <BookOpen className="w-5 h-5 text-primary" />
                    ) : (
                      <PuzzleIcon className="w-5 h-5 text-secondary" />
                    )}
                    <h2 className="text-lg font-semibold">
                      Task {currentTaskIndex + 1}
                    </h2>
                    <Badge variant={currentTask.type === 'flashcard' ? 'default' : 'secondary'}>
                      {currentTask.type === 'flashcard' ? 'Flashcard' : 'Puzzle'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 bg-gradient-to-br from-muted/20 to-muted/5">
              {renderTaskContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}