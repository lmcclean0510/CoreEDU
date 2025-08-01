"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { dataCache } from '@/lib/cache';

// Enhanced user type with admin support
export type AppUser = (FirebaseUser & Partial<UserProfile> & {
  admin?: boolean;
  isAdmin?: boolean;
}) | null;

// What our context provides
interface AuthContextType {
  user: AppUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The "Main Office" - fetches user info once and shares it everywhere
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes (login/logout)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (firebaseUser) {
        // User is logged in - check cache first
        const cacheKey = `user-profile-${firebaseUser.uid}`;
        const cachedProfile = dataCache.get<UserProfile>(cacheKey);
        
        if (cachedProfile) {
          console.log(`%c[Cache Hit] %cUsing cached user profile for ${firebaseUser.uid}`, 'color: #16a34a', 'color: default');
          
          // Get fresh token to check for admin claims (SECURE VERSION)
          try {
            const tokenResult = await firebaseUser.getIdTokenResult(true); // Force refresh
            const isAdmin = !!(tokenResult.claims.admin); // Only trust server-side claims
            
            setUser({
              ...firebaseUser,
              ...cachedProfile,
              admin: isAdmin,
              isAdmin: isAdmin
            });
          } catch (error) {
            console.error('Error getting token claims:', error);
            setUser({
              ...firebaseUser,
              ...cachedProfile,
              admin: false,
              isAdmin: false
            });
          }
        } else {
          // Cache miss - fetch from Firestore
          window.firestoreMonitor?.logRead(`User profile for ${firebaseUser.uid}`);
          
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            let userProfile: UserProfile | null = null;
            if (userDoc.exists()) {
              userProfile = userDoc.data() as UserProfile;
              // Cache the profile for 10 minutes
              dataCache.set(cacheKey, userProfile, 10 * 60 * 1000);
            }

            // Check for admin claims in the token (SECURE VERSION)
            let isAdmin = false;
            try {
              const tokenResult = await firebaseUser.getIdTokenResult(true); // Force refresh
              isAdmin = !!(tokenResult.claims.admin); // Only trust server-side claims
              
              // If user has admin claims, ensure their role reflects it
              if (isAdmin && userProfile) {
                userProfile.role = 'teacher'; // Admins should be teachers with extra privileges
              }
            } catch (error) {
              console.error('Error checking admin claims:', error);
              // Don't fallback to email patterns - if token verification fails, no admin access
              isAdmin = false;
            }

            // Combine Firebase user + our profile data + admin status
            setUser({
              ...firebaseUser,
              ...userProfile,
              admin: isAdmin,
              isAdmin: isAdmin
            });
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Still set the Firebase user even if profile fetch fails
            // Check for admin status even without profile (SECURE VERSION)
            let isAdmin = false;
            try {
              const tokenResult = await firebaseUser.getIdTokenResult(true); // Force refresh
              isAdmin = !!(tokenResult.claims.admin); // Only trust server-side claims
            } catch {
              // Don't fallback to email patterns - security first
              isAdmin = false;
            }
            
            setUser({
              ...firebaseUser,
              admin: isAdmin,
              isAdmin: isAdmin
            });
          }
        }
      } else {
        // User is logged out
        setUser(null);
      }

      setIsLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  // Secure logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Step 1: Clear server-side session
      await fetch('/api/auth/session', { 
        method: 'DELETE',
        credentials: 'include' // Include cookies
      });
      
      // Step 2: Clear client-side auth
      await signOut(auth);
      
      // Step 3: Clear cache
      dataCache.clear();
      
      // Step 4: Clear user state
      setUser(null);
      
      // Step 5: Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error - security first
      dataCache.clear();
      setUser(null);
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate if user is authenticated and admin status (SECURE VERSION)
  const isAuthenticated = !!user;
  const isAdmin = !!(user?.admin || user?.isAdmin); // Removed email pattern fallback

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook that every component uses to get user info
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  
  return context;
}