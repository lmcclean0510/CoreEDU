"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

type AppUser = UserProfile & {
  firebaseUser: User;
  isAdmin: boolean;
};

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setIsAdmin(false);
      
      // Call logout API
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch (error) {
        console.warn('Failed to clear session cookie:', error);
      }
      
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          let adminClaim = false;

          try {
            const tokenResult = await firebaseUser.getIdTokenResult();
            adminClaim = !!tokenResult.claims?.admin;
          } catch (error) {
            console.error('Error fetching admin claim:', error);
          }
          setIsAdmin(adminClaim);
          
          if (userDoc.exists()) {
            const profileData = userDoc.data() as Omit<UserProfile, 'uid'>;
            const appUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              ...profileData,
              firebaseUser,
              isAdmin: adminClaim,
            };
            
            setUser(appUser);
          } else {
            setIsAdmin(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setIsAdmin(false);
          setUser(null);
        }
      } else {
        setIsAdmin(false);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
