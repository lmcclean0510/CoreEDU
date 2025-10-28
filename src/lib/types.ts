import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  avatarBgColor?: string | null;
  avatarOutlineColor?: string | null;
  avatarTextColor?: string | null;
  role: 'student' | 'teacher' | null;
  schoolId: string | null;
  corebinStats?: CorebinStats;
};

export type CorebinStats = {
  binaryFall?: { highScore: number };
  binaryBuilder?: { highScore: number };
};

export type Period = {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
};

export type ClassInfo = {
  id: string;
  className: string;
  subject: 'Computer Science' | 'Geography' | 'Maths';
  classCode: string;
  teacherIds: string[];
  studentUids: string[];
  createdAt: Timestamp;
  periods?: Period[];
};

export type ClassJoinRequest = {
    id: string;
    classId: string;
    studentId: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: Timestamp;
    studentInfo?: {
        name: string;
        email: string;
    }
};

export type HomeworkTask = {
    id: string;
    type: 'puzzle' | 'flashcard';
    title: string;
};

export type HomeworkAssignment = {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  instructions?: string; // Added for due date implementation
  tasks: HomeworkTask[];
  createdAt: Timestamp;
  dueDate?: Timestamp; // Added for due date implementation
};

export type StudentHomework = {
  id: string;
  studentId: string;
  homeworkId: string;
  classId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: Timestamp;
  progress: {
    completedTaskIds: string[];
  };
};

export type PuzzleSection = {
  id: string;
  title: string;
  description: string;
};

export type Puzzle = {
  id: string;
  title: string;
  description: string;
  skillSection: string;
  sectionId: string;
  challengeLevel: number;
  codeSnippet: string;
  initialBlocks: string[];
  solution: string[];
  expectedOutput: string;
  isDynamic?: boolean;
  inputPrompt?: string;
  type?: 'puzzle'; // Add type for disambiguation
};

export type FillInTheBlanksSection = {
  id: string;
  title: string;
  description: string;
};

export type FillInTheBlanksChallenge = {
  id: string;
  title: string;
  description: string;
  sectionId: string;
  challengeLevel: number;
  codeParts: (string | null)[];
  solution: string[];
  expectedOutput: string;
  isDynamic?: boolean;
  inputPrompt?: string;
};

export type Flashcard = {
  id: string;
  subject: string;
  examBoard: string;
  specification: string;
  specificationCode: string;
  specificationPoint: string;
  topic: string;
  subTopic: string;
  term: string;
  definition: string;
  alternativeDefinitions: string[];
  simpleDefinition: string;
  examples: string[];
  relatedTerms: string[];
  hints: string[];
  type?: 'flashcard'; // Add type for disambiguation
};

// Types from the old flashcard-system/types.ts
export type FlashcardRating = {
  confidence?: 1 | 2 | 3 | null;
  correct?: number;
  incorrect?: number;
  totalAttempts?: number;
};

export type ConfidenceLevel = 1 | 2 | 3 | null;

export interface FlashcardSettings {
  showSimpleDefinition: boolean;
}

export interface GroupedTopics {
  [topic: string]: {
    subTopics: string[];
    subTopicDetails: Record<string, string>;
  };
}

export interface ConfidenceMapping {
  name: string;
  value: ConfidenceLevel;
  icon: React.ReactNode;
}

export type { Timestamp };
