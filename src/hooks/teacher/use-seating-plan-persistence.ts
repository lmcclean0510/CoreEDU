import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '@/providers/UserProvider';
import { useToast } from '@/hooks/shared/use-toast';
import type { Desk, Group, Student, SeparationRule, TeacherDesk } from '@/app/coretools/seating-plan/types';

interface SeatingPlanData {
  id?: string;
  teacherId: string;
  planName: string;
  classId?: string;
  desks: Desk[];
  groups: Group[];
  teacherDesk: TeacherDesk;
  students: Student[];
  separationRules: SeparationRule[];
  doNotUseDeskIds: number[];
  fillFromFront: boolean;
  alternateGender: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  metadata?: {
    totalDesks: number;
    totalStudents: number;
    presetUsed?: string;
    notes?: string;
  };
}

export const useSeatingPlanPersistence = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedPlans, setSavedPlans] = useState<SeatingPlanData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time listener for saved plans
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'seatingPlans'),
      where('teacherId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans: SeatingPlanData[] = [];
      snapshot.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() } as SeatingPlanData);
      });
      setSavedPlans(plans);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Save new plan
  const savePlan = useCallback(async (
    planName: string,
    planData: Omit<SeatingPlanData, 'id' | 'teacherId' | 'planName' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save seating plans',
        variant: 'destructive',
      });
      return null;
    }

    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'seatingPlans'), {
        teacherId: user.uid,
        planName,
        ...planData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: `Seating plan "${planName}" saved successfully`,
      });

      return docRef.id;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save seating plan',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, toast]);

  // Update existing plan
  const updatePlan = useCallback(async (
    planId: string,
    planData: Partial<Omit<SeatingPlanData, 'id' | 'teacherId' | 'createdAt'>>
  ) => {
    if (!user?.uid) return false;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'seatingPlans', planId), {
        ...planData,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Seating plan updated successfully',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update seating plan',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, toast]);

  // Delete plan
  const deletePlan = useCallback(async (planId: string) => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'seatingPlans', planId));

      toast({
        title: 'Success',
        description: 'Seating plan deleted successfully',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete seating plan',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    savedPlans,
    isLoading,
    isSaving,
    savePlan,
    updatePlan,
    deletePlan,
  };
};
