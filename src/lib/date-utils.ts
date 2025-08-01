import type { Timestamp } from 'firebase/firestore';

export type DueDateStatus = 'not-due' | 'due-soon' | 'due-today' | 'overdue';

// Helper function to get days between two dates (excluding today)
const getDaysDifference = (fromDate: Date, toDate: Date): number => {
  // Reset both dates to start of day to avoid time zone issues
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = to.getTime() - from.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Helper function to convert various date formats to JavaScript Date
const parseDate = (dueDate: Timestamp | Date | string | any): Date | null => {
  if (!dueDate) return null;
  
  // Handle different date formats
  if (dueDate && typeof dueDate.toDate === 'function') {
    // Firestore Timestamp
    return dueDate.toDate();
  } else if (dueDate instanceof Date) {
    // Regular Date object
    return dueDate;
  } else if (typeof dueDate === 'string') {
    // ISO string
    return new Date(dueDate);
  } else if (dueDate && typeof dueDate === 'object' && dueDate.seconds) {
    // Firestore Timestamp-like object
    return new Date(dueDate.seconds * 1000);
  }
  
  return null;
};

// Get the status of a due date
export const getDueDateStatus = (dueDate?: Timestamp | any, isCompleted?: boolean): DueDateStatus => {
  if (!dueDate || isCompleted) return 'not-due';
  
  const due = parseDate(dueDate);
  if (!due || isNaN(due.getTime())) {
    return 'not-due';
  }
  
  const now = new Date();
  const diffInDays = getDaysDifference(now, due);
  
  if (diffInDays < 0) return 'overdue';
  if (diffInDays === 0) return 'due-today';
  if (diffInDays <= 3) return 'due-soon';
  return 'not-due';
};

// Format due date for display
export const formatDueDate = (dueDate?: Timestamp | any): string => {
  if (!dueDate) return '';
  
  const due = parseDate(dueDate);
  if (!due || isNaN(due.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInDays = getDaysDifference(now, due);
  
  if (diffInDays === 0) return 'Due today';
  if (diffInDays === 1) return 'Due tomorrow';
  if (diffInDays > 0 && diffInDays <= 7) return `Due in ${diffInDays} days`;
  if (diffInDays < 0) {
    const overdue = Math.abs(diffInDays);
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`;
  }
  
  return `Due ${due.toLocaleDateString()}`;
};

// Check if a date is overdue
export const isOverdue = (dueDate?: Timestamp | any): boolean => {
  return getDueDateStatus(dueDate) === 'overdue';
};

// Check if a date is due today
export const isDueToday = (dueDate?: Timestamp | any): boolean => {
  return getDueDateStatus(dueDate) === 'due-today';
};

// Check if a date is due soon (within 3 days)
export const isDueSoon = (dueDate?: Timestamp | any): boolean => {
  return getDueDateStatus(dueDate) === 'due-soon';
};