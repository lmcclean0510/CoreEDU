"use client";

import { useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/providers/UserProvider';
import { useClassData } from '@/hooks/teacher/use-class-data';
import { LoaderCircle, AlertTriangle, ArrowLeft, Settings, Trophy, ClipboardCopy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { StudentManagement } from '@/components/dashboard/teacher/StudentManagement';
import { TeacherManagement } from '@/components/dashboard/teacher/TeacherManagement';
import { HomeworkManagement } from '@/components/features/homework/HomeworkManagement';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { NextLessonWidget } from '@/components/dashboard/teacher/NextLessonWidget';
import { ClassSettingsDialog } from '@/components/dashboard/teacher/ClassSettingsDialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/shared/use-toast';

export default function ClassDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const classId = params.classId as string;
  const { toast } = useToast();

  const {
    isTeacher,
    classInfo,
    students,
    teachers,
    homework,
    studentHomeworks,
    flashcards,
    puzzles,
    isLoading,
    refetchData,
    fetchAssignmentData,
  } = useClassData(classId);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const copyToClipboard = () => {
    if (classInfo?.classCode) {
      navigator.clipboard.writeText(classInfo.classCode);
      toast({
        title: 'Copied to clipboard!',
        description: `Class code ${classInfo.classCode} is ready to share.`,
      });
    }
  };

  if (isLoading || isTeacher === null) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!classInfo || isTeacher === false) {
    return notFound();
  }
  
  const teacherHasAccess = classInfo.teacherIds.includes(user?.uid || '');

  if (!teacherHasAccess) {
    return (
       <div className="flex h-screen w-full items-center justify-center p-4">
          <Card className="max-w-md text-center p-8">
              <CardHeader>
                  <AlertTriangle className="w-16 h-16 mx-auto text-destructive"/>
                  <CardTitle className="text-2xl mt-4">Access Denied</CardTitle>
              </CardHeader>
              <CardContent>
                  <p>You are not a teacher in this class.</p>
                  <Button asChild className="mt-6">
                      <Link href="/dashboard/teacher">Back to Dashboard</Link>
                  </Button>
              </CardContent>
          </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-8">
            <Button asChild variant="outline">
                <Link href="/dashboard/teacher">
                    <ArrowLeft className="mr-2"/>
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Left Column */}
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-bold tracking-tighter text-foreground">{classInfo.className}</CardTitle>
                                <CardDescription>{classInfo.subject}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                                <Settings className="w-4 h-4" />
                                <span className="sr-only">Class Settings</span>
                            </Button>
                        </div>
                        {classInfo.classCode && (
                          <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="font-mono text-base tracking-widest">{classInfo.classCode}</Badge>
                             <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyToClipboard}>
                                <ClipboardCopy className="w-4 h-4" />
                                <span className="sr-only">Copy class code</span>
                             </Button>
                          </div>
                        )}
                    </CardHeader>
                    {classInfo.periods && classInfo.periods.length > 0 && (
                        <CardContent>
                           <NextLessonWidget periods={classInfo.periods}/>
                        </CardContent>
                    )}
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                         <StudentManagement
                           classId={classInfo.id}
                           className={classInfo.className}
                           currentStudents={students}
                           onUpdate={refetchData}
                         />
                         <TeacherManagement
                           classId={classInfo.id}
                           currentTeachers={teachers}
                           onUpdate={refetchData}
                         />
                         <Link href={`/dashboard/teacher/leaderboard/${classInfo.id}`} passHref>
                             <Button variant="outline" className="w-full justify-start">
                                 <Trophy className="mr-2 w-4 h-4" />
                                 View Leaderboard
                             </Button>
                         </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2">
                <Card>
                  <CardContent className="p-6">
                     <Accordion type="multiple" className="w-full" defaultValue={['students', 'homework']}>
                        <AccordionItem value="students">
                            <AccordionTrigger>
                                <h2 className="font-semibold text-xl">Students ({students.length})</h2>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                               <StudentManagement
                                    classId={classInfo.id}
                                    className={classInfo.className}
                                    currentStudents={students}
                                    onUpdate={refetchData}
                                    renderMode="list"
                                />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="homework">
                            <AccordionTrigger>
                               <h2 className="font-semibold text-xl">Homework</h2>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <HomeworkManagement
                                   classInfo={classInfo}
                                   students={students}
                                   homework={homework}
                                   studentHomeworks={studentHomeworks}
                                   onUpdate={refetchData}
                                   flashcards={flashcards}
                                   puzzles={puzzles}
                                   fetchAssignmentData={fetchAssignmentData}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
            </div>
        </div>
        
        <ClassSettingsDialog 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            classInfo={classInfo} 
            onSuccess={refetchData} 
        />
    </div>
  );
}