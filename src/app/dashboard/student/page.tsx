"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { HomeworkAssignment, StudentHomework, ClassInfo } from '@/lib/types';
import { LoaderCircle, ClipboardCheck, CheckCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { JoinClassDialog } from '@/components/dashboard/student/JoinClassDialog';
import { DueDateBadge } from '@/components/shared/DueDateBadge';

type EnrichedHomework = {
  assignment: HomeworkAssignment;
  studentData: StudentHomework;
  classInfo: { id: string; className: string };
};

export default function StudentDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [homeworks, setHomeworks] = useState<EnrichedHomework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);
  
  // Track subscriptions for cleanup
  const unsubscribeRefs = useRef<Unsubscribe[]>([]);

  useEffect(() => {
    if (!user) return;

    // Clean up any existing subscriptions
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];

    console.log('🔔 Setting up real-time homework subscription for student:', user.uid);

    // Set up real-time subscription to studentHomeworks
    const studentHomeworkQuery = query(
      collection(db, 'studentHomeworks'), 
      where('studentId', '==', user.uid)
    );

    const unsubscribeStudentHomework = onSnapshot(studentHomeworkQuery, async (snapshot) => {
      try {
        console.log('📝 Student homework data changed, updating...');
        
        const studentHomeworkData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }) as StudentHomework);

        if (studentHomeworkData.length === 0) {
          setHomeworks([]);
          setIsLoading(false);
          return;
        }

        // Get unique homework and class IDs
        const homeworkIds = [...new Set(studentHomeworkData.map(sh => sh.homeworkId))];
        const classIds = [...new Set(studentHomeworkData.map(sh => sh.classId))];

        // Fetch related data
        const [homeworkAssignments, classInfos] = await Promise.all([
          // Fetch homework assignments
          (async () => {
            const assignments: Record<string, HomeworkAssignment> = {};
            if (homeworkIds.length > 0) {
              const hwQuery = query(collection(db, 'homework'), where('__name__', 'in', homeworkIds));
              const hwSnapshot = await getDocs(hwQuery);
              hwSnapshot.forEach(doc => {
                assignments[doc.id] = { id: doc.id, ...doc.data() } as HomeworkAssignment;
              });
            }
            return assignments;
          })(),
          // Fetch class info
          (async () => {
            const infos: Record<string, { id: string, className: string }> = {};
            if (classIds.length > 0) {
              const classQuery = query(collection(db, 'classes'), where('__name__', 'in', classIds));
              const classSnapshot = await getDocs(classQuery);
              classSnapshot.forEach(doc => {
                infos[doc.id] = { id: doc.id, className: doc.data().className };
              });
            }
            return infos;
          })(),
        ]);

        // Filter out homework that no longer exists (deleted by teacher)
        const enrichedData = studentHomeworkData
          .map(sh => ({
            assignment: homeworkAssignments[sh.homeworkId],
            studentData: sh,
            classInfo: classInfos[sh.classId],
          }))
          .filter(item => item.assignment && item.classInfo) // This filters out deleted homework
          .sort((a, b) => b.assignment.createdAt.seconds - a.assignment.createdAt.seconds);

        console.log(`✅ Updated homework list: ${enrichedData.length} assignments`);
        setHomeworks(enrichedData);
        setIsLoading(false);

      } catch (error) {
        console.error("Error fetching homework data:", error);
        setIsLoading(false);
      }
    });

    // Store subscription for cleanup
    unsubscribeRefs.current.push(unsubscribeStudentHomework);

  }, [user]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up homework subscriptions');
      unsubscribeRefs.current.forEach(unsub => unsub());
    };
  }, []);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">Student Dashboard</h1>
        <JoinClassDialog 
          isOpen={isJoinClassOpen} 
          onOpenChange={setIsJoinClassOpen} 
          triggerButton={
            <Button variant="outline">
              <UserPlus className="mr-2" /> Join a Class
            </Button>
          } 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ClipboardCheck className="text-primary"/>
            Your Homework
          </CardTitle>
          <CardDescription>
            Here are the tasks assigned to you by your teachers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {homeworks.length > 0 ? (
             <Accordion type="single" collapsible className="w-full">
              {homeworks.map(({ assignment, studentData, classInfo }) => (
                <AccordionItem value={assignment.id} key={assignment.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                            <div className="text-left">
                                <p className="font-semibold">{assignment.title}</p>
                                <p className="text-sm text-muted-foreground">{classInfo.className}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <DueDateBadge 
                                  dueDate={assignment.dueDate}
                                  isCompleted={studentData.status === 'completed'}
                                  variant="compact"
                                />
                                <Badge variant={studentData.status === 'completed' ? 'default' : 'secondary'} className={studentData.status === 'completed' ? 'bg-success hover:bg-success' : ''}>
                                    {studentData.status === 'completed' ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                                    {studentData.status.charAt(0).toUpperCase() + studentData.status.slice(1)}
                                </Badge>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-muted/50 rounded-b-md">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Assigned on: {new Date(assignment.createdAt.seconds * 1000).toLocaleDateString()}</p>
                            {assignment.dueDate && (
                                <div className="text-sm">
                                    <DueDateBadge 
                                        dueDate={assignment.dueDate}
                                        isCompleted={studentData.status === 'completed'}
                                    />
                                </div>
                            )}
                            {assignment.instructions && (
                                <div className="mt-3 p-3 bg-muted/30 rounded border-l-4 border-primary">
                                    <p className="text-sm font-medium mb-1">Instructions:</p>
                                    <p className="text-sm text-muted-foreground">{assignment.instructions}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            {studentData.status === 'completed' ? (
                                <p className="text-sm text-success font-semibold flex items-center">
                                    <CheckCircle className="mr-2"/>
                                    Completed on {studentData.completedAt ? new Date(studentData.completedAt.seconds * 1000).toLocaleDateString() : ''}
                                </p>
                            ) : (
                                <Button asChild>
                                    <Link href={`/homework/attempt/${studentData.id}`}>
                                        {studentData.status === 'in-progress' ? 'Continue Homework' : 'Start Homework'}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You have no assigned homework. Great job!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}