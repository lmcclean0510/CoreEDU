import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import type { ClassInfo } from '@/lib/types';
import { useToast } from '@/hooks/shared/use-toast';
import { dataCache } from '@/lib/cache';

export function useTeacherClasses() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef<string | false>(false);

  const fetchClasses = useCallback(async (forceRefresh = false) => {
    if (!user || user.role !== 'teacher') {
      setIsLoading(false);
      return;
    }

    const cacheKey = `teacher-classes-${user.uid}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = dataCache.get<ClassInfo[]>(cacheKey);
      if (cached) {
        console.log(`%c[Cache Hit] %cUsing cached classes for teacher ${user.uid}`, 'color: #16a34a', 'color: default');
        setClasses(cached);
        setIsLoading(false);
        return;
      }
    }

    // Fetch from Firestore
    setIsLoading(true);
    window.firestoreMonitor?.logRead(`Teacher classes ${forceRefresh ? 'refresh' : 'initial fetch'}`);
    
    try {
      const classQuery = query(
        collection(db, 'classes'), 
        where('teacherIds', 'array-contains', user.uid)
      );
      
      const snapshot = await getDocs(classQuery);
      const fetchedClasses = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ClassInfo));
      
      setClasses(fetchedClasses);
      dataCache.set(cacheKey, fetchedClasses, 10 * 60 * 1000); // 10 min cache
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({ 
        title: 'Error', 
        description: 'Could not load classes. Please try again.', 
        variant: 'destructive' 
      });
      setIsLoading(false);
    }
  }, [user, toast]);

  // Initial load effect
  useEffect(() => {
    if (isAuthLoading) return;
    
    if (user?.role === 'teacher') {
      setIsTeacher(true);
      // Only fetch if not already initialized for this user
      if (!hasInitialized.current || hasInitialized.current !== user.uid) {
        hasInitialized.current = user.uid;
        fetchClasses();
      }
    } else {
      setIsTeacher(false);
      setIsLoading(false);
      hasInitialized.current = false;
    }
  }, [user?.uid, user?.role, isAuthLoading]); // Removed fetchClasses from dependencies

  // Manual refresh function
  const refreshClasses = useCallback(() => {
    if (user) {
      dataCache.invalidate(`teacher-classes-${user.uid}`);
      fetchClasses(true);
    }
  }, [user]); // Removed fetchClasses from dependencies

  return {
    isTeacher,
    classes,
    isLoading,
    refreshClasses,
  };
}