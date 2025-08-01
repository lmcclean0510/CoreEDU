
"use client";

import { useState, useEffect, useCallback } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where, getDocs, documentId } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/shared/use-toast';
import { LoaderCircle, AlertTriangle, ArrowLeft, Trophy } from 'lucide-react';
import { LeaderboardTable } from '@/components/features/games/leaderboard-table';

type ClassInfo = {
  id: string;
  className: string;
  teacherIds: string[];
  studentUids: string[];
};

type CorebinStats = {
  binaryFall?: { highScore: number };
  binaryBuilder?: { highScore: number };
}

type UserProfile = {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher' | null;
  corebinStats?: CorebinStats;
};

export default function LeaderboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const fetchLeaderboardData = useCallback(async (classId: string, teacherId: string) => {
    setIsLoading(true);
    try {
      const classDocRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classDocRef);

      if (!classDoc.exists()) {
        notFound();
        return;
      }

      const classData = { id: classDoc.id, ...classDoc.data() } as ClassInfo;
      
      // Check if the current teacher is part of this class
      if (!classData.teacherIds.includes(teacherId)) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      setHasAccess(true);
      setClassInfo(classData);

      if (classData.studentUids && classData.studentUids.length > 0) {
        // Fetch student data in chunks of 30, which is the max for 'in' queries
        const studentChunks: string[][] = [];
        for (let i = 0; i < classData.studentUids.length; i += 30) {
            studentChunks.push(classData.studentUids.slice(i, i + 30));
        }

        const studentProfiles: UserProfile[] = [];
        for (const chunk of studentChunks) {
            const studentQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
            const studentDocs = await getDocs(studentQuery);
            studentDocs.forEach(doc => {
                studentProfiles.push({ uid: doc.id, ...doc.data() } as UserProfile);
            });
        }
        setStudents(studentProfiles);
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({ title: 'Error', description: 'Could not load the leaderboard data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && classId) {
      fetchLeaderboardData(classId, user.uid);
    }
  }, [user, classId, fetchLeaderboardData]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Card className="max-w-md text-center p-8">
            <CardHeader>
                <AlertTriangle className="w-16 h-16 mx-auto text-destructive"/>
                <CardTitle className="text-2xl mt-4">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You do not have permission to view this leaderboard.</p>
                <Button asChild className="mt-6" onClick={() => router.back()}>
                    Go Back
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!classInfo) {
      return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="mb-8">
            <Button asChild variant="outline">
                <Link href="/dashboard/teacher">
                    <ArrowLeft className="mr-2"/>
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3 font-headline">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    Binary Conversion Leaderboard
                </CardTitle>
                <CardDescription className="text-lg">
                    Scores for class: {classInfo.className}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LeaderboardTable students={students} />
            </CardContent>
        </Card>
    </div>
  );
}
