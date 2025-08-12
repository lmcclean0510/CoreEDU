"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { createSubscriptionManager } from '@/lib/utils/subscription-manager';

type AppUser = UserProfile & {
  firebaseUser: User;
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

// Global subscription manager for auth-related subscriptions
const authSubscriptionManager = createSubscriptionManager('UserProvider');

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, UserProfile>>(new Map());

  // Enhanced logout function with proper cleanup
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clean up all auth-related subscriptions
      authSubscriptionManager.cleanup();
      
      // Clear local state first
      setUser(null);
      setProfileCache(new Map());
      
      // Call logout API to clear session cookie
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch (error) {
        console.warn('Failed to clear session cookie:', error);
      }
      
      // Sign out from Firebase
      await signOut(auth);
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setProfileCache(new Map());
    }
  }, []);

  // Fetch user profile with caching and error handling
  const fetchUserProfile = useCallback(async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      // Check cache first
      const cached = profileCache.get(firebaseUser.uid);
      if (cached) {
        console.log(`%c[Cache Hit] %cUsing cached user profile for ${firebaseUser.uid}`, 'color: #16a34a', 'color: default');
        return cached;
      }

      console.log(`%c[Firestore Read] %cFetching user profile for ${firebaseUser.uid}`, 'color: #3b82f6', 'color: default');
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as Omit<UserProfile, 'uid'>;
        const fullProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          ...profileData,
        };
        
        // Cache the profile
        setProfileCache(prev => new Map(prev).set(firebaseUser.uid, fullProfile));
        
        return fullProfile;
      } else {
        console.warn(`No profile found for user ${firebaseUser.uid}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [profileCache]);

  // Check admin status from Firebase Auth token
  const checkAdminStatus = useCallback(async (firebaseUser: User): Promise<boolean> => {
    try {
      const idTokenResult = await firebaseUser.getIdTokenResult();
      return !!idTokenResult.claims.admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, []);

  // Main auth state listener
  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            console.log('👤 User signed in:', firebaseUser.uid);
            
            // Fetch user profile and admin status in parallel
            const [profile, isAdmin] = await Promise.all([
              fetchUserProfile(firebaseUser),
              checkAdminStatus(firebaseUser)
            ]);

            if (profile) {
              const appUser: AppUser = {
                ...profile,
                firebaseUser,
              };
              
              setUser(appUser);
              console.log('✅ User profile loaded successfully');
            } else {
              console.warn('❌ Failed to load user profile');
              setUser(null);
            }
          } else {
            console.log('👤 User signed out');
            setUser(null);
            setProfileCache(new Map());
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('❌ Auth state listener error:', error);
        setUser(null);
        setIsLoading(false);
      }
    );

    // Add to subscription manager for cleanup
    authSubscriptionManager.add('authStateListener', unsubscribe);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up auth state listener');
      authSubscriptionManager.cleanup();
    };
  }, [fetchUserProfile, checkAdminStatus]);

  // Check admin status from user data and token
  const isAdmin = user?.firebaseUser ? (() => {
    // This will be populated from the token check in the auth listener
    // For now, we'll use a simple check that can be enhanced
    return false; // Will be updated when token claims are checked
  })() : false;

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Cleanup function for app shutdown
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    console.log('🚪 App closing - cleaning up auth subscriptions');
    authSubscriptionManager.cleanup();
  });
}