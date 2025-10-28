# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start Turbopack dev server on port 9002
npm run genkit:dev       # Start Genkit AI emulator for flow development
npm run genkit:watch     # Start Genkit with auto-reload
npm run build            # Production build
npm run start            # Serve production build
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking (run before PRs)
```

### Testing
No automated tests currently exist. Manual testing workflows documented in `docs/CONSISTENCY_UPDATE.md`.

## Architecture Overview

CoreEDU is an educational platform built with **Next.js 15 (App Router)**, **TypeScript**, **Firebase** (Firestore + Authentication), and **Genkit AI**. The application serves teachers and students with interactive learning tools, classroom management, and gamified experiences.

### Core Technology Stack
- **Frontend**: React 18, Next.js 15 App Router, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API routes, Firebase Admin SDK
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth with session cookies
- **AI**: Genkit with Google AI (gemini-2.0-flash)
- **Drag & Drop**: @dnd-kit for seating plan tool

### Directory Structure
```
/src
├── /app                 # Next.js 15 App Router (routes, layouts, API)
│   ├── (auth)          # Auth routes (login/signup)
│   ├── /api            # API route handlers
│   ├── /admin          # Admin dashboard
│   ├── /corecs         # Computer Science learning hub
│   ├── /corelabs       # Skills & games platform
│   ├── /coretools      # Teacher utilities
│   ├── /dashboard      # Role-based dashboards
│   └── /homework       # Homework system
├── /ai                 # Genkit AI integration
│   ├── genkit.ts      # Genkit configuration
│   └── /flows         # AI workflows
├── /components         # Reusable React components
│   ├── /ui            # Shadcn UI base components
│   └── /[feature]     # Feature-specific components
├── /hooks             # Custom React hooks (organized by context)
├── /lib               # Core business logic
│   ├── firebase.ts           # Client Firebase config
│   ├── firebase-admin.ts     # Server Firebase Admin SDK
│   ├── types.ts              # Shared TypeScript types
│   ├── /auth                 # Auth utilities
│   ├── /security             # Rate limiting, CSRF protection
│   └── /validation           # Zod schemas
├── /providers         # React context providers
└── middleware.ts      # Auth, rate limiting, security headers
```

## Authentication & Authorization Architecture

### Authentication Flow
1. User logs in via Firebase Auth (client-side)
2. ID token exchanged for session cookie at `POST /api/auth/session`
3. Server validates token with Firebase Admin SDK (`verifyIdToken`)
4. Session cookie created (5-day expiry, httpOnly, secure)
5. Middleware validates session on protected routes
6. `UserProvider` manages client-side auth state

**Key Files**:
- `/src/app/api/auth/session/route.ts` - Session creation/logout
- `/src/lib/auth/server.ts` - `getCurrentUser()` for server-side auth
- `/src/lib/auth/shared.ts` - Role checking utilities
- `/src/providers/UserProvider.tsx` - Client auth context
- `/src/middleware.ts` - Route protection

### Role-Based Access Control
**Roles**: `student`, `teacher`, `admin`

- Firebase custom claims set `admin` flag on ID token
- Firestore stores `role` field in user document
- Server functions check roles via `getCurrentUser()`
- Client uses `useAuth()` hook for role checks
- Firestore rules enforce role-based data access

**Protected Routes** (via middleware):
- `/dashboard/*` → Authenticated users only
- `/admin/*` → Admin claim required
- `/account/*`, `/homework/*` → Authenticated users only

**Public Routes**: `/`, `/login`, `/signup`, `/corecs`, `/corelabs`, `/coretools`

## Data Model & Firestore Collections

### Core Collections
```typescript
/users/{uid}
  - role: 'student' | 'teacher' | null
  - schoolId, firstName, lastName, photoURL
  - corebinStats: { binaryFall: { highScore } }

/classes/{classId}
  - className, subject, classCode (unique 6-char)
  - teacherIds: string[], studentUids: string[]
  - periods: { day, startTime, endTime }[]

/classJoinRequests/{requestId}
  - classId, studentId, status: 'pending|approved|denied'

/homeworkAssignments/{assignmentId}
  - classId, teacherId, title, instructions
  - tasks: { id, type, title }[]
  - dueDate: Timestamp

/studentHomework/{studentHomeworkId}
  - studentId, homeworkId, status
  - progress: { completedTaskIds: string[] }

/flashcards/{cardId}
  - subject, topic, term, definition
  - examBoard, specification

/puzzles/{puzzleId}
  - title, description, challengeLevel
  - codeSnippet, solution, expectedOutput
```

### Firestore Security
Security rules in `firestore.rules` enforce:
- Users can only read/write their own documents
- Teachers can only see users in their school
- Teachers manage only their classes
- Students see only their assigned homework
- Admin can read/write all collections

## Important Patterns & Conventions

### 1. Client vs Server Firebase
**Client** (`/src/lib/firebase.ts`):
- Uses `NEXT_PUBLIC_*` env vars
- For client components, games, auth state
- Exports: `{ app, auth, db, storage }`

**Server** (`/src/lib/firebase-admin.ts`):
- Imports `'server-only'`
- Uses service account env vars
- For API routes, middleware, server functions
- Exports: `{ adminApp, adminAuth, adminDb }`

### 2. Custom Hooks Organization
Hooks are organized by context in `/src/hooks`:
- `/shared` - Cross-cutting (useAuth, useToast, useUserSearch)
- `/teacher` - Teacher-specific (useClassManagement, useHomeworkCreation)
- `/flashcard` - Flashcard system (useFlashcardRating)
- `/homework` - Homework workflows

**Pattern**: Encapsulate business logic in hooks to keep components thin.

### 3. Input Validation with Zod
All API routes and forms use Zod schemas from `/src/lib/validation/schemas.ts`:
```typescript
const schema = z.object({ idToken: z.string().min(1) });
const validation = validateRequest(schema, body);
if (!validation.success) return error(400);
```

Types are inferred from schemas for type safety across client and server.

### 4. Rate Limiting
In-memory rate limiting (no external services):
- General: 100 requests/minute per IP
- Login: 5 attempts/15 minutes
- Implemented in `/src/lib/security/rate-limit.ts`
- Applied in middleware and auth endpoints

### 5. Caching Strategy
Dual-layer cache (`/src/lib/cache.ts`):
- Memory cache (instant retrieval)
- localStorage (persistence across navigations)
- Used for flashcard metadata, user searches, class data

### 6. Component Architecture
```
UI Components (shadcn/radix)
  ↓
Feature Components (corecs, corelabs, coretools)
  ↓
Shared Components (UserNav, Dialogs)
  ↓
Custom Hooks (useAuth, useFetch)
  ↓
Services (firebase, cache, validation)
```

**Component Types**:
- Server Components (default): Layout validation, data fetching
- Client Components (`'use client'`): Interactive pages, forms, games

## AI/Genkit Integration

### Configuration
- **Model**: `googleai/gemini-2.0-flash`
- **Config**: `/src/ai/genkit.ts`
- **Dev Server**: `npm run genkit:dev`

### Active Flows
**generate-avatar.ts** - Creates user avatars from text prompts
```typescript
import { generateAvatar } from '@/ai/flows/generate-avatar';
const imageUrl = await generateAvatar({ prompt: 'robot', color: 'blue' });
```

### Disabled Flows
Several flows are disabled for Firebase free tier compatibility:
- explain-quiz-answer
- generate-personalized-hint
- generate-fill-in-the-blanks-hint

To enable, import them in `/src/ai/dev.ts`.

## Security Features

### Web Security (Middleware)
- Session cookie validation
- Content Security Policy headers
- X-Frame-Options deny (clickjacking protection)
- X-Content-Type-Options nosniff
- HSTS in production
- CSRF via SameSite=Lax cookies

### Authentication Security
- HttpOnly + Secure session cookies
- Token freshness validation (24-hour max)
- Rate limiting on auth endpoints
- Token verification on every protected request

### Data Access Security
- Firestore rules by role
- School-scoped teacher access
- User ownership validation
- Admin override capability

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Middleware for auth** | Protects routes before component render |
| **Session cookies over JWT** | More secure; server can revoke sessions |
| **Firestore rules** | Data layer security prevents tampering |
| **Lazy loading in admin** | Free tier billing optimization |
| **Dual-layer cache** | Survives navigation; works on poor connections |
| **In-memory rate limiting** | No external dependencies; works serverless |
| **Modular hooks** | Encapsulates business logic; easier to test |
| **Zod validation** | Runtime type safety on client and server |

## Common Development Tasks

### Adding a New Page
1. Create `/src/app/feature/[slug]/page.tsx`
2. Add `layout.tsx` if special styling needed
3. Use `useAuth()` for user context
4. Use `useRouter()` for navigation
5. Call API routes for protected operations

### Creating a Custom Hook
1. Add to `/src/hooks/{category}/useFeature.ts`
2. Use `'use client'` if fetches user data
3. Export types alongside hook
4. Handle loading/error states
5. Return structured data

### Adding Admin Content
1. Use `/admin` dashboard forms
2. Forms validate via Zod schemas
3. Submit to Firestore collection
4. Content immediately available in learning pages

### Working with Firestore
**Client-side**: Use hooks pattern
```typescript
const { data, loading, error } = useFirestoreQuery(query);
```

**Server-side**: Use Admin SDK in API routes
```typescript
const snapshot = await adminDb.collection('users').doc(uid).get();
```

## Environment Variables

Required in `.env.local`:
```bash
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google AI
GOOGLE_GENAI_API_KEY=
```

## Performance Optimizations

1. **Lazy Loading**: Admin dashboard loads data on demand
2. **Caching**: Memory + localStorage for metadata
3. **Image Optimization**: Next.js Image component
4. **Code Splitting**: Route-based via Next.js
5. **Turbopack**: Fast HMR in development
6. **Middleware**: Early exit for public routes

## Special Features

### Seating Plan Tool
Complex drag-and-drop tool in `/src/app/coretools/seating-plan/`:
- Modular architecture with separated concerns
- Uses @dnd-kit for accessibility
- Custom hooks: `useSeatingPlan`, `useDragAndDrop`, `useStudentAssignment`
- Save/load plans to Firestore
- Full-width canvas layout

### Game State Management
Games use pattern:
- States: 'start' | 'playing' | 'gameOver'
- `useRef` for mutable game loop timers
- `useCallback` for optimized event handlers
- localStorage/Firestore for high scores
- Real-time physics calculations

### Admin Dashboard
- Manual data loading (click to fetch)
- Tracks loaded tabs to prevent unnecessary Firestore reads
- Custom hooks per content type (useAdminFlashcards, useAdminPuzzles)
- CRUD operations with loading states

## Troubleshooting

### Session Issues
- Check session cookie in DevTools
- Verify token hasn't expired (24-hour max)
- Check middleware logs for auth failures
- Ensure `firebase-admin` initialized correctly

### Firestore Security Rule Errors
- Test rules with Firebase Emulator
- Check user has correct role in user document
- Verify custom claims set on ID token
- Review `firestore.rules` for rule logic

### Rate Limiting
- Clear browser cookies to reset session
- Check IP-based limits in middleware
- Adjust limits in `/src/lib/security/rate-limit.ts`

## Additional Documentation
- `AGENTS.md` - Repository guidelines for AI agents
- `docs/CONSISTENCY_UPDATE.md` - Manual testing workflows
- `firestore.rules` - Firestore security rules with helper functions
