import { useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/providers/UserProvider';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import type { ClassJoinRequest } from '@/lib/types';
import { useToast } from '@/hooks/shared/use-toast';
import { dataCache } from '@/lib/cache';

interface JoinRequestWithStudentInfo extends ClassJoinRequest {
  studentInfo: {
    name: string;
    email: string;
  };
  className: string;
}

interface JoinRequestsState {
  requests: JoinRequestWithStudentInfo[];
  count: number;
  lastChecked: number | null;
  isLoading: boolean;
  cooldownEndsAt: number | null;
}

export function useJoinRequests(teacherClassIds: string[] = []) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<JoinRequestsState>({
    requests: [],
    count: 0,
    lastChecked: null,
    isLoading: false,
    cooldownEndsAt: null,
  });

  // Stabilize the classIds array to prevent infinite loops
  const stableClassIds = useMemo(() => {
    return teacherClassIds.sort().join(',');
  }, [teacherClassIds]);

  // Quick check - just count pending requests (single read)
  const quickCheck = useCallback(async (classIds: string[]) => {
    if (classIds.length === 0) return 0;

    window.firestoreMonitor?.logRead('Quick join requests count check');
    
    const quickQuery = query(
      collection(db, 'classJoinRequests'),
      where('classId', 'in', classIds),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(quickQuery);
    return snapshot.size; // Just the count
  }, []);

  // Full fetch with student details (when we know requests exist)
  const fullFetch = useCallback(async (classIds: string[]) => {
    window.firestoreMonitor?.logRead('Full join requests fetch with details');
    
    const requestsQuery = query(
      collection(db, 'classJoinRequests'),
      where('classId', 'in', classIds),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(requestsQuery);
    
    // Map requests with basic info (you can enhance this later with real student data)
    const requests = snapshot.docs.map(doc => {
      const data = doc.data() as ClassJoinRequest;
      return {
        id: doc.id,
        ...data,
        studentInfo: {
          name: `Student ${data.studentId.slice(-4)}`, // Better placeholder
          email: `student${data.studentId.slice(-4)}@school.edu`
        },
        className: `Class ${data.classId.slice(-4)}`
      };
    });

    return requests;
  }, []);

  // Main function triggered by button click
  const checkJoinRequests = useCallback(async () => {
    const classIds = stableClassIds.split(',').filter(id => id.length > 0);
    
    if (!user || classIds.length === 0) {
      setState(prev => ({ ...prev, requests: [], count: 0 }));
      return { hasRequests: false, requests: [] };
    }

    // Check if we're in cooldown
    const now = Date.now();
    if (state.cooldownEndsAt && now < state.cooldownEndsAt) {
      const remaining = Math.ceil((state.cooldownEndsAt - now) / 1000);
      toast({
        title: 'Please wait',
        description: `You can check again in ${remaining} seconds.`,
        variant: 'default'
      });
      return { hasRequests: state.count > 0, requests: state.requests };
    }

    // Check cache first (if within 60 seconds)
    const cacheKey = `join-requests-${user.uid}-${stableClassIds}`;
    const cachedData = dataCache.get<{ requests: JoinRequestWithStudentInfo[], count: number, timestamp: number }>(cacheKey);
    
    if (cachedData && (now - cachedData.timestamp) < 60000) {
      console.log(`%c[Cache Hit] %cUsing cached join requests`, 'color: #16a34a', 'color: default');
      setState(prev => ({
        ...prev,
        requests: cachedData.requests,
        count: cachedData.count,
        lastChecked: cachedData.timestamp,
        isLoading: false
      }));
      return { hasRequests: cachedData.count > 0, requests: cachedData.requests };
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Step 1: Quick count check
      const count = await quickCheck(classIds);
      
      if (count === 0) {
        // No requests - start cooldown
        const cooldownEnd = now + 60000; // 60 seconds
        setState(prev => ({
          ...prev,
          requests: [],
          count: 0,
          lastChecked: now,
          isLoading: false,
          cooldownEndsAt: cooldownEnd
        }));

        // Cache the empty result
        dataCache.set(cacheKey, { requests: [], count: 0, timestamp: now }, 60000);
        
        return { hasRequests: false, requests: [] };
      }

      // Step 2: Full fetch (we know requests exist)
      const requests = await fullFetch(classIds);
      
      setState(prev => ({
        ...prev,
        requests,
        count: requests.length,
        lastChecked: now,
        isLoading: false,
        cooldownEndsAt: null // No cooldown when we have requests
      }));

      // Cache the results
      dataCache.set(cacheKey, { requests, count: requests.length, timestamp: now }, 60000);
      
      return { hasRequests: true, requests };

    } catch (error) {
      console.error('Error checking join requests:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Error',
        description: 'Could not check join requests. Please try again.',
        variant: 'destructive'
      });
      
      return { hasRequests: false, requests: [] };
    }
  }, [user, stableClassIds, state.cooldownEndsAt, state.count, state.requests, quickCheck, fullFetch, toast]);

  // Handle approve/deny actions
  const handleJoinRequest = useCallback(async (requestId: string, action: 'approve' | 'deny') => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        requests: prev.requests.filter(req => req.id !== requestId),
        count: Math.max(0, prev.count - 1)
      }));

      // Background update
      await updateDoc(doc(db, 'classJoinRequests', requestId), {
        status: action === 'approve' ? 'approved' : 'denied'
      });

      toast({
        title: action === 'approve' ? 'Request Approved' : 'Request Denied',
        description: `Student ${action === 'approve' ? 'added to' : 'denied access to'} the class.`,
      });
      
      // Invalidate cache to ensure fresh data on next check
      if (user) {
        dataCache.invalidate(`join-requests-${user.uid}`);
      }

    } catch (error) {
      console.error(`Error ${action}ing join request:`, error);
      
      // Revert optimistic update and refresh
      checkJoinRequests();
      
      toast({
        title: 'Error',
        description: `Failed to ${action} the request. Please try again.`,
        variant: 'destructive'
      });
    }
  }, [user, toast, checkJoinRequests]);

  // Get remaining cooldown time
  const getCooldownRemaining = useCallback(() => {
    if (!state.cooldownEndsAt) return 0;
    return Math.max(0, Math.ceil((state.cooldownEndsAt - Date.now()) / 1000));
  }, [state.cooldownEndsAt]);

  // Check if we have cached data
  const hasCachedData = state.lastChecked && (Date.now() - state.lastChecked) < 60000;

  return {
    // State
    joinRequests: state.requests,
    requestCount: state.count,
    isLoading: state.isLoading,
    lastChecked: state.lastChecked,
    hasCachedData,
    
    // Actions
    checkJoinRequests,
    handleJoinRequest,
    
    // Cooldown info
    isInCooldown: !!state.cooldownEndsAt && Date.now() < state.cooldownEndsAt,
    getCooldownRemaining,
  };
}