
import { useState, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

// Module-level lock to prevent concurrent fetches for the same data
const fetchLocks = new Map<string, 'pending' | 'resolved'>();

interface UseUserSearchProps {
  schoolId: string | null;
  userRole: 'student' | 'teacher';
}

export function useUserSearch({ schoolId, userRole }: UseUserSearchProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [results, setResults] = useState<UserProfile[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const instanceSchoolId = useRef(schoolId);


  const searchUser = useCallback(async (email: string) => {
    if (!email.trim()) {
      setSearchError('Please enter an email to search.');
      return;
    }
     if (!schoolId) {
      setSearchError('Could not verify school. Please refresh.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    console.log(`%c[Firestore Read] %cSearching for ${userRole} with email ${email} in school ${schoolId}`, 'color: #3b82f6', 'color: default');

    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase().trim()),
        where('schoolId', '==', schoolId),
        where('role', '==', userRole),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setSearchError(`No ${userRole} found with that email in your school.`);
      } else {
        const userDoc = querySnapshot.docs[0];
        setSearchResult({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
      }
    } catch (error) {
      console.error(`Error searching for ${userRole}:`, error);
      setSearchError('An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  }, [schoolId, userRole]);

  const fetchUsers = useCallback(async () => {
    if (!schoolId) {
      console.error("Cannot fetch users without a schoolId.");
      return;
    }
  
    // Use a unique key for the lock based on school and role
    const lockKey = `${schoolId}-${userRole}`;
  
    // If another fetch is already pending for this exact resource, do nothing.
    if (fetchLocks.get(lockKey) === 'pending') {
      return;
    }
  
    // If data is already in this instance, do nothing.
    if (results) {
      return;
    }
  
    try {
      // Set the lock to prevent other instances from fetching.
      fetchLocks.set(lockKey, 'pending');
      setIsLoading(true);
      
      console.log(`%c[Firestore Read] %cFetching all ${userRole}s for school ${schoolId}`, 'color: #3b82f6', 'color: default');
  
      const q = query(
        collection(db, 'users'),
        where('schoolId', '==', schoolId),
        where('role', '==', userRole)
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      
      setResults(users);
      fetchLocks.set(lockKey, 'resolved'); // Mark as resolved
    } catch (error) {
      console.error(`Error fetching ${userRole}s:`, error);
      setSearchError(`Could not load the list of ${userRole}s.`);
      fetchLocks.delete(lockKey); // Release lock on error
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, userRole, results, isLoading]);

  const resetSearch = useCallback(() => {
    setSearchEmail('');
    setSearchResult(null);
    setSearchError(null);
    setIsSearching(false);
  }, []);

  return {
    searchEmail,
    setSearchEmail,
    searchResult,
    searchError,
    isSearching,
    searchUser,
    resetSearch,
    results,
    isLoading,
    fetchUsers,
  };
}
