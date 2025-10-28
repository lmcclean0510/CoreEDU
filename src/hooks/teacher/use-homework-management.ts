import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import type { HomeworkTask, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/shared/use-toast';
import { dataCache } from '@/lib/cache';

export function useHomeworkManagement() {
  const { toast } = useToast();

  const createHomework = useCallback(async (
    classId: string,
    teacherId: string,
    title: string,
    tasks: HomeworkTask[],
    students: UserProfile[],
    instructions?: string,
    dueDate?: string // ISO date string from form input
  ) => {
    try {
      // Prepare homework data
      const homeworkData: any = {
        classId,
        teacherId,
        title,
        tasks,
        createdAt: serverTimestamp(),
      };

      // Add optional fields if provided
      if (instructions && instructions.trim()) {
        homeworkData.instructions = instructions.trim();
      }

      if (dueDate) {
        // Convert ISO string to Firestore Timestamp
        const dueDateObj = new Date(dueDate);
        // Set to end of day (23:59:59) to give students the full day
        dueDateObj.setHours(23, 59, 59, 999);
        homeworkData.dueDate = Timestamp.fromDate(dueDateObj);
      }

      // Create the main homework document
      const homeworkDocRef = await addDoc(collection(db, 'homework'), homeworkData);

      // Create individual student homework tracking documents
      const studentHomeworkPromises = students.map(student =>
        addDoc(collection(db, 'studentHomeworks'), {
          studentId: student.uid,
          homeworkId: homeworkDocRef.id,
          classId,
          status: 'not-started',
          completedAt: null,
          progress: {
            completedTaskIds: [],
          },
        })
      );

      await Promise.all(studentHomeworkPromises);

      // Invalidate cache for this class to force fresh data fetch
      dataCache.invalidate(classId);
      
      // Also invalidate any general teacher class caches
      dataCache.invalidate(`teacher-${teacherId}`);

      toast({ 
        title: 'Success', 
        description: `Homework "${title}" assigned${dueDate ? ` with due date ${new Date(dueDate).toLocaleDateString()}` : ''}.` 
      });

      return homeworkDocRef.id;
    } catch (error) {
      console.error('Error creating homework:', error);
      toast({ 
        title: 'Error', 
        description: 'Could not create the homework.', 
        variant: 'destructive' 
      });
      throw error;
    }
  }, [toast]);

  const updateHomework = useCallback(async (
    homeworkId: string,
    updates: {
      title?: string;
      instructions?: string | null;
      dueDate?: string | null; // ISO string or null to clear
    },
    options?: {
      classId?: string;
      teacherId?: string;
    }
  ) => {
    try {
      const homeworkRef = doc(db, 'homework', homeworkId);
      const updatePayload: Record<string, any> = {};

      if (typeof updates.title === 'string') {
        updatePayload.title = updates.title.trim();
      }

      if (typeof updates.instructions === 'string') {
        updatePayload.instructions = updates.instructions.trim();
      } else if (updates.instructions === null) {
        updatePayload.instructions = deleteField();
      }

      if (typeof updates.dueDate === 'string' && updates.dueDate) {
        const dueDateObj = new Date(updates.dueDate);
        dueDateObj.setHours(23, 59, 59, 999);
        updatePayload.dueDate = Timestamp.fromDate(dueDateObj);
      } else if (updates.dueDate === null) {
        updatePayload.dueDate = deleteField();
      }

      if (Object.keys(updatePayload).length === 0) {
        return;
      }

      window.firestoreMonitor?.logWrite?.('Update homework details');
      await updateDoc(homeworkRef, {
        ...updatePayload,
        updatedAt: serverTimestamp(),
      });

      if (options?.classId) {
        dataCache.invalidate(options.classId);
        dataCache.invalidate(`class-data-${options.classId}`);
      }
      if (options?.teacherId) {
        dataCache.invalidate(`teacher-${options.teacherId}`);
        dataCache.invalidate(`teacher-homeworks-${options.teacherId}`);
      }
      dataCache.invalidate('homework');

      toast({
        title: 'Homework updated',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Error updating homework:', error);
      toast({
        title: 'Error',
        description: 'Could not update the homework.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteHomework = useCallback(async (homeworkId: string, classId?: string, teacherId?: string) => {
    try {
      const batch = writeBatch(db);

      // Find all student homework docs related to this main homework
      const studentHwQuery = query(
        collection(db, 'studentHomeworks'), 
        where('homeworkId', '==', homeworkId)
      );
      const studentHwSnapshot = await getDocs(studentHwQuery);
      
      // Add all related documents to the batch delete
      studentHwSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the main homework document
      const homeworkDocRef = doc(db, 'homework', homeworkId);
      batch.delete(homeworkDocRef);

      await batch.commit();

      // Invalidate cache entries if we have the IDs
      if (classId) {
        dataCache.invalidate(classId);
      }
      if (teacherId) {
        dataCache.invalidate(`teacher-${teacherId}`);
      }
      
      // Also invalidate any homework-related cache entries
      dataCache.invalidate('homework');

      toast({ 
        title: 'Homework Deleted', 
        description: 'Successfully removed the homework assignment.' 
      });
    } catch (error) {
      console.error('Error deleting homework:', error);
      toast({ 
        title: 'Error', 
        description: 'Could not delete the homework.', 
        variant: 'destructive' 
      });
      throw error;
    }
  }, [toast]);

  return {
    createHomework,
    updateHomework,
    deleteHomework,
  };
}
