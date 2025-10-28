"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/UserProvider';
import { useToast } from '@/hooks/shared/use-toast';
import { dataCache } from '@/lib/cache';
import type { ClassInfo, HomeworkAssignment, StudentHomework } from '@/lib/types';

type HomeworkStats = {
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRate: number;
};

export type TeacherHomeworkSummary = {
  homework: HomeworkAssignment;
  classInfo: ClassInfo | null;
  stats: HomeworkStats;
};

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const baseStats: HomeworkStats = {
  assignedCount: 0,
  completedCount: 0,
  inProgressCount: 0,
  notStartedCount: 0,
  completionRate: 0,
};

export function useTeacherHomeworks() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [homeworks, setHomeworks] = useState<TeacherHomeworkSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hasInitialized = useRef<string | false>(false);

  const fetchHomeworks = useCallback(async (forceRefresh = false) => {
    if (!user || user.role !== 'teacher') {
      setIsLoading(false);
      setHomeworks([]);
      return;
    }

    const cacheKey = `teacher-homeworks-${user.uid}`;
    if (!forceRefresh) {
      const cached = dataCache.get<TeacherHomeworkSummary[]>(cacheKey);
      if (cached) {
        setHomeworks(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setHasError(false);

    try {
      window.firestoreMonitor?.logRead?.('Fetch teacher homework overview');
      const homeworkQuery = query(
        collection(db, 'homework'),
        where('teacherId', '==', user.uid)
      );

      const homeworkSnapshot = await getDocs(homeworkQuery);
      const fetchedHomeworks = homeworkSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as HomeworkAssignment
      );

      if (fetchedHomeworks.length === 0) {
        setHomeworks([]);
        dataCache.set(cacheKey, [], 5 * 60 * 1000);
        setIsLoading(false);
        return;
      }

      // Fetch class information for the retrieved homeworks
      const classIds = Array.from(
        new Set(
          fetchedHomeworks
            .map((hw) => hw.classId)
            .filter((id): id is string => !!id)
        )
      );

      const classMap = new Map<string, ClassInfo>();
      if (classIds.length) {
        const classChunks = chunkArray(classIds, 10);
        const classPromises = classChunks.map((chunk) => {
          window.firestoreMonitor?.logRead?.('Fetch homework class metadata');
          return getDocs(
            query(
              collection(db, 'classes'),
              where(documentId(), 'in', chunk)
            )
          );
        });

        const classSnapshots = await Promise.all(classPromises);
        classSnapshots.forEach((snapshot) => {
          snapshot.forEach((doc) => {
            classMap.set(
              doc.id,
              {
                id: doc.id,
                ...doc.data(),
              } as ClassInfo
            );
          });
        });
      }

      // Fetch student homework data in chunks
      const homeworkIds = fetchedHomeworks.map((hw) => hw.id);
      const statsMap = new Map<string, HomeworkStats>();

      if (homeworkIds.length) {
        const homeworkChunks = chunkArray(homeworkIds, 10);
        const studentHwPromises = homeworkChunks.map((chunk) => {
          window.firestoreMonitor?.logRead?.('Fetch student homework progress snapshot');
          return getDocs(
            query(
              collection(db, 'studentHomeworks'),
              where('homeworkId', 'in', chunk)
            )
          );
        });

        const studentHwSnapshots = await Promise.all(studentHwPromises);
        studentHwSnapshots.forEach((snapshot) => {
          snapshot.forEach((doc) => {
            const data = {
              id: doc.id,
              ...doc.data(),
            } as StudentHomework;
            const existing = statsMap.get(data.homeworkId) ?? { ...baseStats };

            const assignedCount = existing.assignedCount + 1;
            let completedCount = existing.completedCount;
            let inProgressCount = existing.inProgressCount;
            let notStartedCount = existing.notStartedCount;

            if (data.status === 'completed') {
              completedCount += 1;
            } else if (data.status === 'in-progress') {
              inProgressCount += 1;
            } else {
              notStartedCount += 1;
            }

            statsMap.set(data.homeworkId, {
              assignedCount,
              completedCount,
              inProgressCount,
              notStartedCount,
              completionRate: 0, // recalculated later
            });
          });
        });
      }

      const summaries: TeacherHomeworkSummary[] = fetchedHomeworks
        .map((hw) => {
          const classInfo = hw.classId ? classMap.get(hw.classId) ?? null : null;
          const stats = statsMap.get(hw.id) ?? { ...baseStats };

          const totalStudents =
            classInfo?.studentUids?.length ?? stats.assignedCount ?? 0;

          const completionRate =
            totalStudents > 0
              ? (stats.completedCount / totalStudents) * 100
              : 0;

          return {
            homework: hw,
            classInfo,
            stats: {
              ...stats,
              completionRate,
            },
          };
        })
        .sort((a, b) => {
          const aDue =
            (a.homework.dueDate && 'seconds' in a.homework.dueDate
              ? a.homework.dueDate.seconds
              : 0) || 0;
          const bDue =
            (b.homework.dueDate && 'seconds' in b.homework.dueDate
              ? b.homework.dueDate.seconds
              : 0) || 0;

          if (aDue && bDue) {
            return aDue - bDue;
          }

          const aCreated =
            (a.homework.createdAt && 'seconds' in a.homework.createdAt
              ? a.homework.createdAt.seconds
              : 0) || 0;
          const bCreated =
            (b.homework.createdAt && 'seconds' in b.homework.createdAt
              ? b.homework.createdAt.seconds
              : 0) || 0;

          return bCreated - aCreated;
        });

      setHomeworks(summaries);
      dataCache.set(cacheKey, summaries, 5 * 60 * 1000);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching teacher homeworks:', error);
      setHomeworks([]);
      setHasError(true);
      setIsLoading(false);
      toast({
        title: 'Error loading homework',
        description: 'We could not load your homework overview. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast, user]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setIsTeacher(false);
      setHomeworks([]);
      setIsLoading(false);
      hasInitialized.current = false;
      return;
    }

    if (user.role === 'teacher') {
      setIsTeacher(true);
      if (!hasInitialized.current || hasInitialized.current !== user.uid) {
        hasInitialized.current = user.uid;
        fetchHomeworks();
      }
    } else {
      setIsTeacher(false);
      setHomeworks([]);
      setIsLoading(false);
      hasInitialized.current = false;
    }
  }, [user?.uid, user?.role, isAuthLoading, fetchHomeworks]);

  const refresh = useCallback(() => {
    if (user?.uid) {
      dataCache.invalidate(`teacher-homeworks-${user.uid}`);
      return fetchHomeworks(true);
    }
    return Promise.resolve();
  }, [fetchHomeworks, user?.uid]);

  const classFilters = useMemo(() => {
    const entries = new Map<string, { name: string; subject?: string }>();
    homeworks.forEach((item) => {
      if (item.classInfo) {
        entries.set(item.classInfo.id, {
          name: item.classInfo.className,
          subject: item.classInfo.subject,
        });
      }
    });
    return Array.from(entries.entries()).map(([id, meta]) => ({
      id,
      ...meta,
    }));
  }, [homeworks]);

  return {
    isTeacher,
    homeworks,
    isLoading,
    hasError,
    refresh,
    classFilters,
    isEmpty: !isLoading && homeworks.length === 0,
  };
}
