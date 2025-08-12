// src/lib/validation/schemas.ts
import { z } from 'zod';

// ==========================================
// AUTH VALIDATION SCHEMAS
// ==========================================

export const createSessionSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email('Invalid email format').nullable(),
  firstName: z.string().min(1, 'First name is required').max(50).nullable(),
  lastName: z.string().min(1, 'Last name is required').max(50).nullable(),
  photoURL: z.string().url().nullable(),
  role: z.enum(['student', 'teacher']).nullable(),
  schoolId: z.string().min(1).nullable(),
});

// ==========================================
// CLASS VALIDATION SCHEMAS
// ==========================================

export const createClassSchema = z.object({
  className: z.string().min(1, 'Class name is required').max(100),
  subject: z.enum(['Computer Science', 'Geography', 'Maths']),
  teacherIds: z.array(z.string()).min(1, 'At least one teacher required'),
  studentUids: z.array(z.string()).default([]),
  periods: z.array(z.object({
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  })).optional(),
});

export const updateClassSchema = createClassSchema.partial();

export const joinClassSchema = z.object({
  classCode: z.string().length(6, 'Class code must be 6 characters'),
});

// ==========================================
// HOMEWORK VALIDATION SCHEMAS
// ==========================================

export const homeworkTaskSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['puzzle', 'flashcard']),
  title: z.string().min(1).max(200),
});

export const createHomeworkSchema = z.object({
  classId: z.string().min(1),
  teacherId: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(200),
  instructions: z.string().max(1000).optional(),
  tasks: z.array(homeworkTaskSchema).min(1, 'At least one task required'),
  dueDate: z.date().optional(),
});

export const updateHomeworkProgressSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed']),
  progress: z.object({
    completedTaskIds: z.array(z.string()),
  }),
});

// ==========================================
// CONTENT VALIDATION SCHEMAS
// ==========================================

export const flashcardSchema = z.object({
  subject: z.string().min(1).max(100),
  examBoard: z.string().min(1).max(100),
  specification: z.string().min(1).max(100),
  specificationCode: z.string().min(1).max(50),
  specificationPoint: z.string().min(1).max(100),
  topic: z.string().min(1).max(100),
  subTopic: z.string().min(1).max(100),
  term: z.string().min(1).max(200),
  definition: z.string().min(1).max(1000),
  alternativeDefinitions: z.array(z.string()).default([]),
  simpleDefinition: z.string().min(1).max(500),
  examples: z.array(z.string()).default([]),
  relatedTerms: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
});

export const puzzleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  skillSection: z.string().min(1).max(100),
  sectionId: z.string().min(1),
  challengeLevel: z.number().int().min(1).max(10),
  codeSnippet: z.string().min(1),
  initialBlocks: z.array(z.string()).min(1),
  solution: z.array(z.string()).min(1),
  expectedOutput: z.string().min(1),
  isDynamic: z.boolean().default(false),
  inputPrompt: z.string().optional(),
});

// ==========================================
// RATING VALIDATION SCHEMAS
// ==========================================

export const flashcardRatingSchema = z.object({
  userId: z.string().min(1),
  flashcardId: z.string().min(1),
  confidence: z.enum([1, 2, 3]).nullable().optional(),
  correct: z.number().int().min(0).optional(),
  incorrect: z.number().int().min(0).optional(),
  totalAttempts: z.number().int().min(0).optional(),
});

// ==========================================
// SEARCH VALIDATION SCHEMAS
// ==========================================

export const userSearchSchema = z.object({
  email: z.string().email('Invalid email format'),
  schoolId: z.string().min(1),
  role: z.enum(['student', 'teacher']),
});

// ==========================================
// QUERY PARAMETER VALIDATION
// ==========================================

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const classQuerySchema = z.object({
  teacherId: z.string().optional(),
  subject: z.enum(['Computer Science', 'Geography', 'Maths']).optional(),
  ...paginationSchema.shape,
});

// ==========================================
// FILE UPLOAD VALIDATION
// ==========================================

export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&^_.-]{0,126}\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.-]{0,126}$/),
  size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function validateRequestAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<{ success: true; data: T } | { success: false; error: string }> {
  return Promise.resolve(validateRequest(schema, data));
}

// ==========================================
// RATE LIMITING SCHEMAS
// ==========================================

export const rateLimitSchema = z.object({
  identifier: z.string().min(1), // user ID, IP, etc.
  action: z.string().min(1), // 'login', 'create_class', etc.
  windowMs: z.number().int().min(1000), // time window in ms
  maxAttempts: z.number().int().min(1), // max attempts in window
});

// ==========================================
// EXPORT TYPES FOR USE IN COMPONENTS
// ==========================================

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type JoinClassInput = z.infer<typeof joinClassSchema>;
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
export type UpdateHomeworkProgressInput = z.infer<typeof updateHomeworkProgressSchema>;
export type FlashcardInput = z.infer<typeof flashcardSchema>;
export type PuzzleInput = z.infer<typeof puzzleSchema>;
export type FlashcardRatingInput = z.infer<typeof flashcardRatingSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ClassQueryInput = z.infer<typeof classQuerySchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;