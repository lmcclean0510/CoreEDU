import { useState, useCallback } from 'react';

interface FirestoreOperation {
  type: 'read' | 'write';
  description: string;
  timestamp: Date;
  page: string;
}

interface FirestoreStats {
  reads: number;
  writes: number;
  operations: FirestoreOperation[];
  pageStats: Record<string, { reads: number; writes: number }>;
}

export const useFirestoreMonitor = () => {
  const [stats, setStats] = useState<FirestoreStats>({
    reads: 0,
    writes: 0,
    operations: [],
    pageStats: {}
  });

  const getCurrentPage = useCallback(() => {
    if (typeof window === 'undefined') return 'server';
    const path = window.location.pathname;
    
    // Friendly page names
    const pageMap: Record<string, string> = {
      '/dashboard/teacher': 'Teacher Dashboard',
      '/coretools/seating-plan': 'Seating Plan',
      '/corecs': 'CoreCS Hub',
      '/': 'Homepage'
    };
    
    return pageMap[path] || path;
  }, []);

  const logRead = useCallback((description: string) => {
    const page = getCurrentPage();
    
    setStats(prev => {
      const newPageStats = { ...prev.pageStats };
      if (!newPageStats[page]) {
        newPageStats[page] = { reads: 0, writes: 0 };
      }
      newPageStats[page].reads++;

      const newReadCount = prev.reads + 1;

      // Log with correct read count
      console.log(`%c📖 Firestore Read #${newReadCount} %c${description} %c(${page})`, 
        'color: #3b82f6; font-weight: bold', 
        'color: default', 
        'color: #6b7280'
      );

      return {
        reads: newReadCount,
        writes: prev.writes,
        operations: [...prev.operations.slice(-19), { // Keep last 20 operations
          type: 'read',
          description,
          timestamp: new Date(),
          page
        }],
        pageStats: newPageStats
      };
    });
  }, [getCurrentPage]);

  const logWrite = useCallback((description: string) => {
    const page = getCurrentPage();
    
    setStats(prev => {
      const newPageStats = { ...prev.pageStats };
      if (!newPageStats[page]) {
        newPageStats[page] = { reads: 0, writes: 0 };
      }
      newPageStats[page].writes++;

      const newWriteCount = prev.writes + 1;

      // Log with correct write count
      console.log(`%c✏️ Firestore Write #${newWriteCount} %c${description} %c(${page})`, 
        'color: #ef4444; font-weight: bold', 
        'color: default', 
        'color: #6b7280'
      );

      return {
        reads: prev.reads,
        writes: newWriteCount,
        operations: [...prev.operations.slice(-19), {
          type: 'write',
          description,
          timestamp: new Date(),
          page
        }],
        pageStats: newPageStats
      };
    });
  }, [getCurrentPage]);

  const resetStats = useCallback(() => {
    setStats({ reads: 0, writes: 0, operations: [], pageStats: {} });
    console.log('%c🔄 Firestore stats reset', 'color: #f59e0b; font-weight: bold');
  }, []);

  const getPageTotal = useCallback((page: string) => {
    const pageStats = stats.pageStats[page];
    if (!pageStats) return 0;
    return pageStats.reads + pageStats.writes;
  }, [stats.pageStats]);

  return { 
    stats, 
    logRead, 
    logWrite, 
    resetStats, 
    getPageTotal,
    currentPage: getCurrentPage()
  };
};