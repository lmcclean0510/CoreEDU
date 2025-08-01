
import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
  getDoc,
} from 'firebase/firestore';
import type { ClassInfo, Period } from '@/lib/types';
import { useToast } from '@/hooks/shared/use-toast';

const generateClassCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function useClassManagement() {
  const { toast } = useToast();

  const addStudent = useCallback(async (classId: string, studentUid: string) => {
    const classDocRef = doc(db, 'classes', classId);
    await updateDoc(classDocRef, {
      studentUids: arrayUnion(studentUid),
    });
  }, []);

  const removeStudent = useCallback(async (classId: string, studentUid: string) => {
    const classDocRef = doc(db, 'classes', classId);
    await updateDoc(classDocRef, {
      studentUids: arrayRemove(studentUid),
    });
  }, []);

  const addTeacher = useCallback(async (classId: string, teacherUid: string) => {
    const classDocRef = doc(db, 'classes', classId);
    await updateDoc(classDocRef, {
      teacherIds: arrayUnion(teacherUid),
    });
  }, []);

  const removeTeacher = useCallback(async (classId: string, teacherUid: string) => {
    const classDocRef = doc(db, 'classes', classId);
    await updateDoc(classDocRef, {
      teacherIds: arrayRemove(teacherUid),
    });
  }, []);

  const createClass = useCallback(async (
    className: string, 
    subject: ClassInfo['subject'], 
    teacherUid: string,
    periods: Period[]
  ) => {
    const classCode = generateClassCode();
    const docRef = await addDoc(collection(db, 'classes'), {
      className,
      subject,
      classCode,
      teacherIds: [teacherUid],
      studentUids: [],
      createdAt: serverTimestamp(),
      periods: periods,
    });
    return docRef.id;
  }, []);

  const updateClass = useCallback(async (classId: string, updates: { className?: string; periods?: Period[] }) => {
    const classDocRef = doc(db, 'classes', classId);
    await updateDoc(classDocRef, updates);
  }, []);

  const deleteClass = useCallback(async (classId: string) => {
    const batch = writeBatch(db);

    // 1. Find all homework assignments for the class
    const homeworkQuery = query(collection(db, 'homework'), where('classId', '==', classId));
    const homeworkSnapshot = await getDocs(homeworkQuery);
    const homeworkIds = homeworkSnapshot.docs.map(d => d.id);

    // 2. For each homework, find and delete all student homework documents
    if (homeworkIds.length > 0) {
      const studentHwQuery = query(collection(db, 'studentHomeworks'), where('homeworkId', 'in', homeworkIds));
      const studentHwSnapshot = await getDocs(studentHwQuery);
      studentHwSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // 3. Delete all the homework assignment documents
    homeworkSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 4. Delete the class document itself
    const classDocRef = doc(db, 'classes', classId);
    batch.delete(classDocRef);

    // 5. Commit the batch
    await batch.commit();
  }, []);

  const requestToJoinClass = useCallback(async (classCode: string, studentId: string) => {
    const classesRef = collection(db, 'classes');
    const q = query(classesRef, where('classCode', '==', classCode), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast({ title: 'Invalid Code', description: 'No class found with that code.', variant: 'destructive' });
      return;
    }
    
    const classDoc = querySnapshot.docs[0];
    const classId = classDoc.id;
    const classData = classDoc.data() as ClassInfo;

    if (classData.studentUids.includes(studentId)) {
        toast({ title: 'Already Enrolled', description: 'You are already in this class.', variant: 'default' });
        return;
    }
    
    const requestsRef = collection(db, 'classJoinRequests');
    const existingReqQuery = query(requestsRef, where('classId', '==', classId), where('studentId', '==', studentId), limit(1));
    const existingReqSnapshot = await getDocs(existingReqQuery);
    
    if (!existingReqSnapshot.empty) {
        toast({ title: 'Request Already Sent', description: 'You have already sent a request to join this class.', variant: 'default' });
        return;
    }

    await addDoc(requestsRef, {
        classId,
        studentId,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    toast({ title: 'Request Sent!', description: 'Your request to join the class has been sent to the teacher for approval.' });
  }, [toast]);
  
  const handleJoinRequest = useCallback(async (requestId: string, approved: boolean) => {
      const requestRef = doc(db, 'classJoinRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) return;
      
      const { studentId, classId } = requestDoc.data();

      if (approved) {
          const classRef = doc(db, 'classes', classId);
          await updateDoc(classRef, { studentUids: arrayUnion(studentId) });
          await updateDoc(requestRef, { status: 'approved' });
      } else {
          await updateDoc(requestRef, { status: 'denied' });
      }
  }, []);

  return {
    addStudent,
    removeStudent,
    addTeacher,
    removeTeacher,
    createClass,
    updateClass,
    deleteClass,
    requestToJoinClass,
    handleJoinRequest,
  };
}
