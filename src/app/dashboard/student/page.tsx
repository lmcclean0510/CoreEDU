"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import type { HomeworkAssignment, StudentHomework, ClassInfo } from '@/lib/types';
import { LoaderCircle, ClipboardCheck, CheckCircle, UserPlus, BookOpen, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { JoinClassDialog } from '@/components/dashboard/student/JoinClassDialog';
import { DueDateBadge } from '@/components/shared/DueDateBadge';
import { useSubscriptionManager } from '@/lib/utils/subscription-manager';

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
  
  // Memory-safe subscription management
  const subscriptionManager = useSubscriptionManager('StudentDashboard');

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    console.log('🔔 Setting up real-time homework subscription for student:', user.uid);
    setIsLoading(true);

    // Set up real-time subscription to studentHomeworks
    const studentHomeworkQuery = query(
      collection(db, 'studentHomeworks'), 
      where('studentId', '==', user.uid)
    );

    const unsubscribeStudentHomework = onSnapshot(
      studentHomeworkQuery, 
      async (snapshot) => {
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

          // Fetch related data with error handling
          const [homeworkAssignments, classInfos] = await Promise.all([
            // Fetch homework assignments
            (async () => {
              const assignments: Record<string, HomeworkAssignment> = {};
              if (homeworkIds.length > 0) {
                try {
                  // Process in chunks to avoid Firestore limits
                  const chunks = [];
                  for (let i = 0; i < homeworkIds.length; i += 30) {
                    chunks.push(homeworkIds.slice(i, i + 30));
                  }
                  
                  for (const chunk of chunks) {
                    const hwQuery = query(collection(db, 'homework'), where('__name__', 'in', chunk));
                    const hwSnapshot = await getDocs(hwQuery);
                    hwSnapshot.forEach(doc => {
                      assignments[doc.id] = { id: doc.id, ...doc.data() } as HomeworkAssignment;
                    });
                  }
                } catch (error) {
                  console.error('Error fetching homework assignments:', error);
                }
              }
              return assignments;
            })(),
            // Fetch class info
            (async () => {
              const infos: Record<string, { id: string, className: string }> = {};
              if (classIds.length > 0) {
                try {
                  // Process in chunks to avoid Firestore limits
                  const chunks = [];
                  for (let i = 0; i < classIds.length; i += 30) {
                    chunks.push(classIds.slice(i, i + 30));
                  }
                  
                  for (const chunk of chunks) {
                    const classQuery = query(collection(db, 'classes'), where('__name__', 'in', chunk));
                    const classSnapshot = await getDocs(classQuery);
                    classSnapshot.forEach(doc => {
                      infos[doc.id] = { id: doc.id, className: doc.data().className };
                    });
                  }
                } catch (error) {
                  console.error('Error fetching class info:', error);
                }
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
            .filter(item => item.assignment && item.classInfo)
            .sort((a, b) => b.assignment.createdAt.seconds - a.assignment.createdAt.seconds);

          console.log(`✅ Updated homework list: ${enrichedData.length} assignments`);
          setHomeworks(enrichedData);
          setIsLoading(false);

        } catch (error) {
          console.error("Error processing homework data:", error);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error in homework subscription:", error);
        setIsLoading(false);
      }
    );

    // Add subscription to manager for automatic cleanup
    subscriptionManager.add('studentHomework', unsubscribeStudentHomework);

  }, [user, subscriptionManager]);

  // Loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // No user state
  if (!user) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be signed in to view your dashboard.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quick access cards
  const quickAccessCards = [
    {
      title: 'CoreCS',
      description: 'Practice Python & algorithms',
      icon: BookOpen,
      href: '/corecs',
      color: 'bg-blue-500',
    },
    {
      title: 'CoreLabs',
      description: 'Play educational games',
      icon: Trophy,
      href: '/corelabs',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsJoinClassOpen(true)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Join a Class</CardTitle>
                <CardDescription>Enter a class code</CardDescription>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {quickAccessCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </div>
                    <div className={`w-12 h-12 ${card.color}/10 rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 text-${card.color}`} />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Homework Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <ClipboardCheck className="text-primary"/>
                Your Homework
              </CardTitle>
              <CardDescription>
                Tasks assigned to you by your teachers
              </CardDescription>
            </div>
          </div>
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
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No homework assigned yet</p>
              <p className="text-sm text-muted-foreground mt-2">Check back later or explore learning materials</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join Class Dialog */}
      <JoinClassDialog 
        isOpen={isJoinClassOpen} 
        onOpenChange={setIsJoinClassOpen} 
      />
    </div>
  );
}
