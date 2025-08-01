"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestoreMonitor } from '@/hooks/shared/use-firestore-monitor';
import { FirestoreStats } from '@/components/shared/FirestoreStats';

type FirestoreMonitorContextType = {
  logRead: (description: string) => void;
  logWrite: (description: string) => void;
  resetStats: () => void;
  stats: any;
};

const FirestoreMonitorContext = createContext<FirestoreMonitorContextType | null>(null);

export function FirestoreMonitorProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const monitor = useFirestoreMonitor();
  
  // Only render on client-side to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Expose globally for easy access in any file
  if (typeof window !== 'undefined') {
    (window as any).firestoreMonitor = monitor;
  }
  
  return (
    <FirestoreMonitorContext.Provider value={monitor}>
      {children}
      {isClient && (
        <FirestoreStats 
          stats={monitor.stats} 
          onReset={monitor.resetStats}
          currentPage={monitor.currentPage}
        />
      )}
    </FirestoreMonitorContext.Provider>
  );
}

// Optional: Hook to use the context (alternative to window.firestoreMonitor)
export function useFirestoreMonitorContext() {
  const context = useContext(FirestoreMonitorContext);
  if (!context) {
    throw new Error('useFirestoreMonitorContext must be used within FirestoreMonitorProvider');
  }
  return context;
}