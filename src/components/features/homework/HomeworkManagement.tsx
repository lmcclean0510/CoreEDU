"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Trash2, CheckCircle, Circle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
import { DueDateBadge } from '@/components/shared/DueDateBadge';
import { useHomeworkManagement } from '@/hooks/teacher/use-homework-management';
import { useAuth } from '@/providers/UserProvider';
import Link from 'next/link';
import type { UserProfile, HomeworkAssignment, StudentHomework, ClassInfo, Flashcard, Puzzle } from '@/lib/types';

interface HomeworkManagementProps {
  classInfo: ClassInfo;
  students: UserProfile[];
  homework: HomeworkAssignment[];
  studentHomeworks: StudentHomework[];
  onUpdate: () => void;
  flashcards: Flashcard[];
  puzzles: Puzzle[];
  fetchAssignmentData: () => void;
}

export function HomeworkManagement({
  classInfo,
  students,
  homework,
  studentHomeworks,
  onUpdate,
  flashcards,
  puzzles,
  fetchAssignmentData,
}: HomeworkManagementProps) {
  const { user } = useAuth();
  const { deleteHomework } = useHomeworkManagement();
  
  const [homeworkToDelete, setHomeworkToDelete] = useState<HomeworkAssignment | null>(null);

  const classHomeworks = homework || [];

  const getHomeworkCompletionStats = (homeworkId: string) => {
    const relevantStudentHomeworks = studentHomeworks.filter(shw => shw.homeworkId === homeworkId);
    const completedCount = relevantStudentHomeworks.filter(shw => shw.status === 'completed').length;
    return {
      completed: completedCount,
      total: relevantStudentHomeworks.length,
      percentage: relevantStudentHomeworks.length > 0 ? (completedCount / relevantStudentHomeworks.length) * 100 : 0
    };
  };

  const handleDeleteHomework = async () => {
    if (!homeworkToDelete || !user) return;

    try {
      // Pass classId and teacherId for cache invalidation
      await deleteHomework(homeworkToDelete.id, classInfo.id, user.uid);
      onUpdate();
    } catch (error) {
      console.error('Error deleting homework:', error);
    } finally {
      setHomeworkToDelete(null);
    }
  };

  return (
    <>
      {classHomeworks.length > 0 ? (
        <div className="space-y-3 pt-2">
          {classHomeworks.map(hw => {
            const stats = getHomeworkCompletionStats(hw.id);
            const assignedDate = hw.createdAt ? new Date(hw.createdAt.seconds * 1000).toLocaleDateString() : "Date not available";
            return (
              <Card key={hw.id} className="bg-muted/50 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold">{hw.title}</h5>
                      {hw.dueDate && (
                        <DueDateBadge 
                          dueDate={hw.dueDate}
                          variant="compact"
                          className="ml-2"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Assigned on: {assignedDate}
                    </p>
                    {hw.instructions && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {hw.instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{stats.completed}/{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setHomeworkToDelete(hw)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <Progress value={stats.percentage} className="mt-2 h-2" />
                
                <Accordion type="single" collapsible className="w-full mt-2">
                  <AccordionItem value="student-progress">
                    <AccordionTrigger 
                      className="text-sm py-2"
                    >
                      View Student Progress
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pt-2">
                        {students.map(student => {
                          const studentHw = studentHomeworks.find(shw => shw.homeworkId === hw.id && shw.studentId === student.uid);
                          const isCompleted = studentHw?.status === 'completed';
                          return (
                            <li key={student.uid} className="flex items-center gap-3">
                              {isCompleted ? 
                                <CheckCircle className="w-4 h-4 text-success" /> : 
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              }
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={student.photoURL || undefined} />
                                <AvatarFallback className="text-xs">{student.firstName?.[0] || 'S'}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{student.firstName || 'Student'} {student.lastName || ''}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No homework has been set for this class.
        </p>
      )}

      {/* Create Homework Button */}
      <Button asChild variant="outline" className="mt-4 w-full">
        <Link href={`/dashboard/teacher/class/${classInfo.id}/create-homework`}>
          <PlusCircle className="mr-2" />
          Create New Homework
        </Link>
      </Button>

      <ConfirmationDialog
        isOpen={!!homeworkToDelete}
        onClose={() => setHomeworkToDelete(null)}
        onConfirm={handleDeleteHomework}
        title="Are you absolutely sure?"
        description={`This action will permanently delete the homework "${homeworkToDelete?.title}" for all students. This cannot be undone.`}
        confirmLabel="Delete Homework"
      />
    </>
  );
}