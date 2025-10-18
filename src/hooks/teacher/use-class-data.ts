import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  documentId,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import type { ClassInfo, UserProfile, HomeworkAssignment, StudentHomework, Flashcard, Puzzle } from '@/lib/types';
import { useToast } from '@/hooks/shared/use-toast';
import { dataCache } from '@/lib/cache';
import { useSubscriptionManager } from '@/lib/utils/subscription-manager';

export function useClassData(classId: string) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  // Memory-safe subscription management
  const subscriptionManager = useSubscriptionManager('ClassData');

  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [homework, setHomework] = useState<HomeworkAssignment[]>([]);
  const [studentHomeworks, setStudentHomeworks] = useState<StudentHomework[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add a refresh trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!isAuthLoading) {
      setIsTeacher(user?.role === 'teacher');
    }
  }, [user, isAuthLoading]);

  // Fetch single class data - ADD refreshTrigger to dependencies
  useEffect(() => {
    if (isAuthLoading || isTeacher === null || !user || !classId) {
      if (isTeacher === false) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Clear existing subscriptions before setting up new ones
    subscriptionManager.cleanup();

    const classCacheKey = `class-data-${classId}`;
    const cachedData = dataCache.get<any>(classCacheKey);

    if (cachedData && refreshTrigger === 0) { // Only use cache on initial load
        setClassInfo(cachedData.classInfo);
        setStudents(cachedData.students);
        setTeachers(cachedData.teachers);
        setHomework(cachedData.homework);
        setStudentHomeworks(cachedData.studentHomeworks);
        setIsLoading(false);
        return;
    }

    try {
      const classDocRef = doc(db, 'classes', classId);
      
      const unsubscribeClass = onSnapshot(
        classDocRef, 
        async (classDoc) => {
          try {
            if (!classDoc.exists() || !classDoc.data().teacherIds.includes(user.uid)) {
              setClassInfo(null);
              setIsLoading(false);
              return;
            }

            const fetchedClass = { id: classDoc.id, ...classDoc.data() } as ClassInfo;
            setClassInfo(fetchedClass);

            const allUserIds = [...new Set([...fetchedClass.studentUids, ...fetchedClass.teacherIds])];
            const allUsers: UserProfile[] = [];
            
            if (allUserIds.length > 0) {
                // Process users in chunks to avoid Firestore limits
                const userChunks: string[][] = [];
                for (let i = 0; i < allUserIds.length; i += 30) {
                  userChunks.push(allUserIds.slice(i, i + 30));
                }
                
                for (const chunk of userChunks) {
                  try {
                    const userDocs = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
                    userDocs.forEach(doc => allUsers.push({ uid: doc.id, ...doc.data() } as UserProfile));
                  } catch (error) {
                    console.error(`Error fetching user chunk:`, error);
                  }
                }
            }
            
            const classStudents = allUsers.filter(u => fetchedClass.studentUids.includes(u.uid));
            const classTeachers = allUsers.filter(u => fetchedClass.teacherIds.includes(u.uid));
            setStudents(classStudents);
            setTeachers(classTeachers);
            
            
            // Fetch homework and student homework data
            try {
              const [hwSnapshot, shwSnapshot] = await Promise.all([
                getDocs(query(collection(db, 'homework'), where('classId', '==', classId))),
                getDocs(query(collection(db, 'studentHomeworks'), where('classId', '==', classId)))
              ]);
              
              const classHomework = hwSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeworkAssignment));
              const classStudentHw = shwSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentHomework));
              
              setHomework(classHomework);
              setStudentHomeworks(classStudentHw);

              // Cache the data
              dataCache.set(classCacheKey, {
                  classInfo: fetchedClass, 
                  students: classStudents, 
                  teachers: classTeachers, 
                  homework: classHomework, 
                  studentHomeworks: classStudentHw
              }, 5 * 60 * 1000);

              setIsLoading(false);
            } catch (error) {
              console.error('Error fetching homework data:', error);
              setIsLoading(false);
            }

          } catch (error) {
            console.error("Error processing class data:", error);
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Error in class subscription:", error);
          toast({ title: 'Error', description: 'Could not load class data.', variant: 'destructive' });
          setIsLoading(false);
        }
      );

      // Add subscription to manager for automatic cleanup
      subscriptionManager.add('classData', unsubscribeClass);

    } catch (error) {
      console.error("Error setting up class data subscription:", error);
      toast({ title: 'Error', description: 'Could not load class data.', variant: 'destructive' });
      setIsLoading(false);
    }
  }, [user?.uid, isTeacher, classId, isAuthLoading, toast, refreshTrigger, subscriptionManager]);

  const fetchAssignmentData = useCallback(async () => {
    const flashcardCache = dataCache.get<Flashcard[]>('flashcards');
    const puzzleCache = dataCache.get<Puzzle[]>('puzzles');
    
    if (flashcardCache && puzzleCache) {
      setFlashcards(flashcardCache);
      setPuzzles(puzzleCache);
      return;
    }

    try {
      const [flashcardsQuery, puzzlesQuery] = await Promise.all([
        getDocs(query(collection(db, 'flashcards'), orderBy('term'))),
        getDocs(query(collection(db, 'puzzles'), orderBy('challengeLevel')))
      ]);
      const fetchedFlashcards = flashcardsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
      const fetchedPuzzles = puzzlesQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
      setFlashcards(fetchedFlashcards);
      setPuzzles(fetchedPuzzles);
      dataCache.set('flashcards', fetchedFlashcards, 60 * 60 * 1000);
      dataCache.set('puzzles', fetchedPuzzles, 60 * 60 * 1000);
    } catch (error) {
      console.error("Error fetching assignment data:", error);
      toast({ title: 'Error', description: 'Could not load data for homework creation.', variant: 'destructive' });
    }
  }, [toast]);

  // FIXED: refetchData now triggers a re-fetch by incrementing refreshTrigger
  const refetchData = useCallback(() => {
    dataCache.invalidate(`class-data-${classId}`);
    setRefreshTrigger(prev => prev + 1); // This will trigger the useEffect to re-run
  }, [classId]);

  return {
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
  };
}