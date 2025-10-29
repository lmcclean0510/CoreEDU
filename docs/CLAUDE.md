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
- **Authentication**: Firebase Auth with session cookies (5-day expiry, token freshness validation)
- **AI**: Genkit with Google AI (gemini-2.0-flash-exp)
- **Drag & Drop**: @dnd-kit for seating plan tool
- **Games**: Phaser 3 for interactive games (Keyboard Ninja)
- **Code Editor**: Ace Editor for puzzle challenges
- **Charts**: Recharts for analytics

### Directory Structure
```
/src
├── /app                 # Next.js 15 App Router (routes, layouts, API)
│   ├── (auth)          # Auth routes (login/signup)
│   ├── /api            # API route handlers
│   │   └── /auth/session  # Session management endpoint
│   ├── /admin          # Admin dashboard (content management)
│   │   ├── /components    # Admin UI components
│   │   └── /hooks         # Admin-specific hooks
│   ├── /account        # User account settings & profile
│   ├── /corecs         # Computer Science learning hub
│   │   ├── /binary         # Binary logic challenges
│   │   ├── /hex            # Hexadecimal learning
│   │   ├── /python         # Python puzzles & fill-in-blanks
│   │   ├── /gcse           # GCSE flashcards by subject
│   │   └── /concept-detective  # Concept learning game
│   ├── /corelabs       # Skills & games platform
│   │   ├── /binary-game    # Binary Fall (arcade game)
│   │   ├── /denary-game    # Denary conversion game
│   │   ├── /keyboard-ninja # Phaser-powered typing trainer
│   │   └── /mouse-skills   # Mouse accuracy training
│   ├── /coretools      # Teacher utilities (role-protected)
│   │   └── /seating-plan   # Drag-and-drop classroom layout
│   ├── /dashboard      # Role-based dashboards
│   │   ├── /teacher        # Teacher class management
│   │   └── /student        # Student learning center
│   ├── /homework       # Homework system
│   │   └── /attempt/[id]   # Student homework submission
│   ├── /help           # Help & support page
│   ├── /settings       # User settings (placeholder)
│   └── /quick-quiz     # Quick quiz (placeholder)
├── /ai                 # Genkit AI integration
│   ├── genkit.ts      # Genkit configuration
│   ├── dev.ts         # Development flows
│   └── /flows         # AI workflows
│       ├── generate-avatar.ts           # Avatar generation (ACTIVE)
│       └── [other flows]                # Quiz hints (DISABLED)
├── /components         # Reusable React components
│   ├── /ui            # Shadcn UI base components (Radix)
│   ├── /auth          # Auth components (ProtectedRoute)
│   ├── /layout        # Layout components (header, footer)
│   ├── /app-layout    # App shell (AppLayout, AppSidebar, AppTopBar)
│   ├── /features      # Feature-specific components
│   │   ├── /flashcards    # Flashcard UI & controls
│   │   ├── /homework      # Homework creation & management
│   │   ├── /puzzles       # Puzzle renderers
│   │   └── /games         # Leaderboard, GameContainer
│   ├── /dashboard     # Dashboard-specific components
│   └── /shared        # Cross-cutting components (dialogs, search)
├── /hooks             # Custom React hooks (organized by context)
│   ├── /shared        # useAuth, useToast, useUserSearch
│   ├── /teacher       # useClassManagement, useTeacherClasses
│   ├── /flashcard     # useFlashcardData, useFlashcardRating
│   └── /homework      # useHomeworkCreation, useHomeworkManagement
├── /lib               # Core business logic
│   ├── firebase.ts           # Client Firebase config
│   ├── firebase-admin.ts     # Server Firebase Admin SDK
│   ├── types.ts              # Shared TypeScript types
│   ├── utils.ts              # Utility functions
│   ├── date-utils.ts         # Date formatting & calculations
│   ├── cache.ts              # Dual-layer caching (memory + localStorage)
│   ├── /auth                 # Auth utilities
│   │   ├── server.ts         # getCurrentUser() server function
│   │   └── shared.ts         # Role checking (isTeacher, isStudent, isAdmin)
│   ├── /security             # Rate limiting, security headers
│   │   └── rate-limit.ts     # In-memory rate limiting with cleanup
│   └── /validation           # Zod schemas
│       └── schemas.ts        # Input validation schemas
├── /providers         # React context providers
│   ├── UserProvider.tsx          # Auth context with memoization
│   └── FirestoreMonitorProvider  # Dev-only Firestore tracking
└── middleware.ts      # Auth, rate limiting, security headers
```

## Authentication & Authorization Architecture

### Authentication Flow
1. User logs in via Firebase Auth (client-side)
2. ID token exchanged for session cookie at `POST /api/auth/session`
3. Server validates token with Firebase Admin SDK (`verifyIdToken`)
   - Token freshness validation (24-hour maximum age)
   - Revocation check
   - Rate limiting (5 attempts/15 minutes per IP)
4. Session cookie created (5-day expiry, httpOnly, secure, sameSite=Lax)
5. Middleware validates session on protected routes
6. `UserProvider` manages client-side auth state with memoization

**Key Files**:
- [/src/app/api/auth/session/route.ts](src/app/api/auth/session/route.ts) - Session creation/logout with rate limiting
- [/src/lib/auth/server.ts](src/lib/auth/server.ts) - `getCurrentUser()` for server-side auth
- [/src/lib/auth/shared.ts](src/lib/auth/shared.ts) - Role checking utilities (`isTeacher`, `isStudent`, `isAdmin`)
- [/src/providers/UserProvider.tsx](src/providers/UserProvider.tsx) - Client auth context with useMemo/useCallback
- [/src/middleware.ts](src/middleware.ts) - Route protection with security headers

### Role-Based Access Control
**Roles**: `student`, `teacher`, `admin`

- Firebase custom claims set `admin` flag on ID token
- Firestore stores `role` field in user document
- **Server-side layout protection** - Preferred pattern for role checks
  - [/src/app/dashboard/teacher/layout.tsx](src/app/dashboard/teacher/layout.tsx) - Uses `isTeacher()` helper
  - [/src/app/dashboard/student/layout.tsx](src/app/dashboard/student/layout.tsx) - Uses `isStudent()` helper
  - [/src/app/coretools/layout.tsx](src/app/coretools/layout.tsx) - Teacher-only access
- Server functions check roles via `getCurrentUser()`
- Client uses `useAuth()` hook for role checks
- Firestore rules enforce role-based data access

**Protected Routes** (via middleware and layouts):
- `/dashboard/*` → Authenticated users only
- `/dashboard/teacher/*` → Teacher role required (server-side layout)
- `/dashboard/student/*` → Student role required (server-side layout)
- `/coretools/*` → Teacher role required (server-side layout)
- `/admin/*` → Admin claim required
- `/account/*`, `/homework/*` → Authenticated users only

**Public Routes**: `/`, `/login`, `/signup`, `/corecs`, `/corelabs`, `/help`

## Data Model & Firestore Collections

### Core Collections
```typescript
/users/{uid}
  - uid, email, firstName, lastName, photoURL
  - role: 'student' | 'teacher' | null
  - schoolId: string
  - corebinStats: {
      binaryFall: { highScore: number },
      binaryBuilder: { highScore: number }
    }
  - avatarColor, avatarShape, aiAvatarUrl
  - unlockedFeatures: string[]
  - createdAt, updatedAt: Timestamp

/classes/{classId}
  - className, subject, classCode (unique 6-char)
  - teacherIds: string[], studentUids: string[]
  - periods: { day, startTime, endTime }[]
  - createdAt: Timestamp

/classJoinRequests/{requestId}
  - classId, studentId, status: 'pending' | 'approved' | 'denied'
  - createdAt: Timestamp
  - studentInfo: { firstName, lastName, email }

/homework/{assignmentId}
  - classId, teacherId, title, instructions
  - tasks: { id, type: 'flashcard' | 'puzzle', title, metadata }[]
  - dueDate: Timestamp (optional)
  - createdAt: Timestamp

/studentHomework/{studentHomeworkId}
  - studentId, homeworkId, classId
  - status: 'not-started' | 'in-progress' | 'completed'
  - progress: { completedTaskIds: string[] }
  - startedAt, completedAt: Timestamp

/flashcards/{cardId}
  - subject, topic, term, definition
  - examBoard, specification
  - examples: string[], hints: string[]
  - difficulty, topic

/userFlashcardRatings/{ratingId}
  - userId, flashcardId
  - confidence: 1 | 2 | 3
  - attempts, lastAttempted: Timestamp

/puzzles/{puzzleId}
  - title, description, skillSection, challengeLevel
  - codeSnippet, solution: string[], expectedOutput
  - isDynamic, inputPrompt

/puzzleSections/{sectionId}
  - name, description, order

/fillInTheBlanksChallenges/{challengeId}
  - title, description, challengeLevel, skillSection
  - codeSnippet, blanks: { id, correctAnswer, hint }[]

/fillInTheBlanksSections/{sectionId}
  - name, description, order

/schools/{schoolId}
  - name, address, contactEmail
  - adminIds: string[]
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
- `/shared` - Cross-cutting hooks
  - `useAuth()` - Auth context from UserProvider
  - `useToast()` - Toast notifications
  - `useUserSearch()` - Search users by email with debouncing
  - `useSubscriptionManager()` - Prevents Firestore listener leaks
- `/teacher` - Teacher-specific hooks
  - `useClassManagement()` - Create, delete, manage classes
  - `useTeacherClasses()` - Fetch teacher's classes
  - `useTeacherHomeworks()` - Fetch teacher's assignments
  - `useHomeworkManagement()` - CRUD operations for homework
  - `useJoinRequests()` - Manage class join requests
  - `useClassData()` - Fetch class details
- `/flashcard` - Flashcard system
  - `useFlashcardData()` - Fetch flashcards with filtering
  - `useFlashcardRating()` - Confidence ratings
- `/homework` - Homework workflows
  - `useHomeworkCreation()` - Task selection and assignment creation

**Admin Hooks** (`/src/app/admin/hooks/`):
- `useAdminFlashcards()` - CRUD flashcards (limited to 1000)
- `useAdminPuzzles()` - CRUD puzzles (limited to 500)
- `useJsonImport()` - Bulk import from JSON
- `usePuzzleJsonImport()` - Import puzzles from JSON

**Seating Plan Hooks** (`/src/app/coretools/seating-plan/hooks/`):
- `useSeatingPlan()` - Seating arrangement logic
- `useDragAndDrop()` - @dnd-kit integration
- `useStudentAssignment()` - Auto-placement algorithm with rules
- `useSeatingPlanPersistence()` - Save/load plans to Firestore

**Pattern**: Encapsulate business logic in hooks to keep components thin. All hooks with Firestore queries include `.limit()` for performance.

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
App Layout (AppLayout, AppSidebar, AppTopBar)
  ↓
Page Components (Server & Client)
  ↓
Feature Components (flashcards, puzzles, homework, games)
  ↓
Shared Components (UserSearchDialog, ConfirmationDialog, DueDateBadge)
  ↓
UI Components (shadcn/radix base components)
  ↓
Custom Hooks (useAuth, useClassManagement, useSubscriptionManager)
  ↓
Services (firebase, cache, validation, rate-limit)
```

**Component Types**:
- **Server Components** (default): Layout validation, data fetching, auth checks
- **Client Components** (`'use client'`): Interactive pages, forms, games, dashboards

**Key Architectural Components**:
- **AppLayout** ([src/components/app-layout/AppLayout.tsx](src/components/app-layout/AppLayout.tsx))
  - Wraps authenticated screens with sidebar and top bar
  - Uses pathname (not auth state) for layout decisions
  - Excluded paths: `/`, `/login`, `/signup`, auth routes
- **AppSidebar** - Role-aware navigation (teachers see "My Classes", students see "My Homework")
- **GameContainer** ([src/components/games/GameContainer.tsx](src/components/games/GameContainer.tsx))
  - Standardizes game presentation without browser fullscreen
  - Uses `fixed` positioning to fill content area
  - Keeps games within app layout (sidebar visible on desktop)
- **FirestoreMonitorProvider** - Dev-only overlay tracking reads/writes per page
- **SubscriptionManager** - Utility to prevent Firestore listener leaks

## AI/Genkit Integration

### Configuration
- **Model**: `googleai/gemini-2.0-flash-exp`
- **Config**: [/src/ai/genkit.ts](src/ai/genkit.ts) - Genkit initialization
- **Dev Config**: [/src/ai/dev.ts](src/ai/dev.ts) - Flow imports (development only)
- **Dev Server**: `npm run genkit:dev` (port 4000)
- **Environment**: Requires `GOOGLE_GENAI_API_KEY` in `.env.local`

### Active Flows
**generate-avatar.ts** - Creates user avatars from text prompts using Gemini vision
```typescript
import { generateAvatar } from '@/ai/flows/generate-avatar';
const imageUrl = await generateAvatar({
  prompt: 'robot teacher',
  color: 'blue'
});
```
- Used in account settings when user unlocks AI avatar feature
- Generates personalized avatar images
- Returns image URL stored in user document

### Disabled Flows
Several flows are disabled for Firebase free tier compatibility (not imported in `dev.ts`):
- `explain-quiz-answer.ts` - Quiz answer explanations
- `generate-personalized-hint.ts` - Personalized learning hints
- `generate-fill-in-the-blanks-hint.ts` - Code completion hints

**To enable**: Import flow in [/src/ai/dev.ts](src/ai/dev.ts) and ensure API key is set.

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

## Performance Optimizations

CoreEDU has undergone comprehensive performance optimization in Phase 1A and 1B (October 2025):

### Phase 1A: Quick Win Optimizations

1. **Context Memoization** ([src/providers/UserProvider.tsx](src/providers/UserProvider.tsx))
   - Added `useMemo` to context value object
   - Added `useCallback` to logout function
   - **Result**: 40-60% reduction in unnecessary re-renders across 50+ components

2. **Firestore Query Limits** (Critical for performance)
   - `useFlashcardData()` - Limited to 500 flashcards
   - `useClassData()` - Limited to 100 classes, 500 students
   - `useAdminFlashcards()` - Limited to 1000 flashcards
   - `useAdminPuzzles()` - Limited to 500 puzzles
   - **Result**: 70-80% reduction in Firestore reads, faster page loads

3. **Dynamic Imports for Heavy Components**
   - Seating Plan Tool - 225 KB lazy-loaded
   - **Result**: Moved to on-demand chunk, only loads when accessed

### Phase 1B: Extended Dynamic Imports

1. **Game Pages** (4 pages optimized)
   - Binary Fall, Denary Game, Keyboard Ninja, Mouse Skills
   - Pattern: Component split from page.tsx with dynamic import wrapper
   - **Result**: ~400 KB moved to lazy-loaded chunks

2. **Admin Dashboard**
   - Admin page split with dynamic import
   - **Result**: 213 KB lazy-loaded (67% reduction on admin route)

3. **Flashcard System**
   - FlashCardClient component lazy-loaded
   - **Result**: ~200 KB deferred

### Overall Performance Metrics
- **~834 KB** total moved to lazy-loaded chunks
- **60-68%** bundle size reduction on specialized pages
- **40-60%** reduction in React re-renders
- **70-80%** reduction in Firestore reads
- Faster initial page loads for all users

### Performance Best Practices
1. **Always use `useMemo`/`useCallback` in context providers** - Prevents cascading re-renders
2. **Always add `.limit()` to Firestore queries** - Prevents runaway billing and slow queries
3. **Dynamic import specialized pages** - Games, admin tools, heavy features
4. **Use subscription manager** - Prevents Firestore listener leaks in long-lived components
5. **Monitor with FirestoreStats** - Dev overlay shows reads/writes per page

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Middleware for auth** | Protects routes before component render |
| **Session cookies over JWT** | More secure; server can revoke sessions |
| **Server-side layout protection** | Cleaner than client checks; no flashing; more secure |
| **Firestore rules** | Data layer security prevents tampering |
| **Context memoization** | Critical for performance; prevents re-render cascades |
| **Query limits on all Firestore calls** | Prevents runaway costs and slow queries |
| **Dynamic imports for specialized pages** | Reduces initial bundle; improves load times |
| **Dual-layer cache** | Survives navigation; works on poor connections |
| **In-memory rate limiting** | No external dependencies; works serverless |
| **Modular hooks** | Encapsulates business logic; easier to test |
| **Zod validation** | Runtime type safety on client and server |
| **Games within app layout** | Better UX; no fullscreen transitions; sidebar remains visible |

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
# Firebase Client SDK (NEXT_PUBLIC_* - exposed to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (server-only - never exposed to browser)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"

# Google AI (optional - required for AI avatar generation)
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

**Important Notes**:
- `FIREBASE_PRIVATE_KEY` must have escaped newlines (`\n`) when deployed
- `GOOGLE_GENAI_API_KEY` only needed if using AI avatar generation feature
- Never commit `.env.local` to version control (already in `.gitignore`)

## Product Surface Overview

### CoreCS (Computer Science Learning Hub)
Located in [/src/app/corecs](src/app/corecs):
- **Python Challenges** - Jigsaw puzzles and fill-in-the-blanks with Ace Editor
- **Concept Detective** - Scenario-based flashcard quiz with distractors
- **Binary & Hex Tools** - Number conversion practice with step-by-step guides
- **GCSE Flashcards** - Subject-organized flashcard decks (AQA, OCR, Edexcel)
- Uses puzzle collections from Firestore with section organization

### CoreLabs (Skills & Games Platform)
Located in [/src/app/corelabs](src/app/corelabs):
- **Binary Fall** - Arcade-style binary conversion stacker (Phaser 3)
- **Denary Game** - Reverse conversion challenge with power-ups
- **Keyboard Ninja** - Phaser-powered typing/shortcut trainer with accessibility features
- **Mouse Skills** - Precision, tracking, and clicking trainer with adaptive difficulty
- All games integrated with GameContainer (no fullscreen), scores persisted to Firestore

### CoreTools (Teacher Utilities)
Located in [/src/app/coretools](src/app/coretools) - **Teacher-only** (role-protected):
- **Seating Plan Generator** - Advanced drag-and-drop classroom layout tool
- Additional tools scaffolded as "Coming Soon" (grade calculator, attendance, reports)

### Dashboards
**Student Dashboard** ([/src/app/dashboard/student/page.tsx](src/app/dashboard/student/page.tsx)):
- Homework progress cards with due date badges
- Class enrollment via join codes
- Quick links to games and learning modules
- Uses `useSubscriptionManager` for efficient Firestore listeners

**Teacher Dashboard** ([/src/app/dashboard/teacher/page.tsx](src/app/dashboard/teacher/page.tsx)):
- Class creation and management
- Weekly timetable view
- Join request moderation with cooldowns
- Quick actions for homework creation and class settings

### Other Routes
- **/account** - Profile editing, password changes, AI avatar generation, rewards codes
- **/homework** - Student homework list and completion UI
- **/help** - Static support cards and documentation links
- **/settings** - Placeholder for future preferences
- **/quick-quiz** - Placeholder "Coming Soon" screen

## Special Features

### Seating Plan Tool
Complex drag-and-drop classroom layout tool in [/src/app/coretools/seating-plan/](src/app/coretools/seating-plan/):
- **Modular architecture** with separated concerns (7 custom hooks)
- **@dnd-kit** for accessible drag-and-drop (supports keyboard navigation)
- **Auto-assignment algorithm** with advanced rules:
  - Separate specific students (keep troublemakers apart)
  - Gender balancing across groups
  - Conflict resolution when rules contradict
  - Random placement with constraints
- **Canvas export** via html-to-image (save as PNG/JPEG)
- **Persistence** - Save/load plans to Firestore per class
- **Teacher desk** - Draggable teacher position indicator
- **Full-width layout** - Maximizes workspace

**Key Components**:
- `SeatingPlanTool.tsx` - Main orchestrator (dynamically imported)
- `StudentsPanel.tsx` - Student roster with drag sources
- `RulesPanel.tsx` - Assignment rules configuration
- `DraggableTeacherDesk.tsx` - Teacher position marker

**Custom Hooks**:
- `useSeatingPlan()` - Core state management
- `useDragAndDrop()` - @dnd-kit integration
- `useStudentAssignment()` - Auto-placement algorithm
- `useSeatingPlanPersistence()` - Firestore save/load

### Game State Management
All games follow consistent patterns for state and performance:
- **State machine**: `'start' | 'playing' | 'gameOver'`
- **useRef for timers**: Mutable refs for game loop timers (avoid re-renders)
- **useCallback for handlers**: Optimized event handlers
- **High score persistence**: localStorage + Firestore (`corebinStats`)
- **GameContainer wrapper**: Standardized presentation without fullscreen
- **Real-time physics**: 60 FPS calculations for smooth gameplay

**Games**:
1. **Binary Fall** - Phaser-based arcade stacker (binary conversion)
2. **Denary Game** - Reverse conversion with timers and power-ups
3. **Keyboard Ninja** - Phaser typing trainer with dynamic spawning
4. **Mouse Skills** - Precision and tracking with adaptive difficulty

### Flashcard System
Sophisticated spaced repetition learning system:
- **Confidence ratings** (1-3) stored per user per card
- **Filter by subject/topic/exam board** with caching
- **Auto-advance** with configurable timers
- **Flip animations** with keyboard shortcuts
- **Examples and hints** per flashcard
- **Progress tracking** - Attempts and last attempted timestamp
- **Concept Detective mode** - Quiz variant with distractors

### Homework System
Multi-step homework creation and completion workflow:
- **Task selection** - Mix flashcards and puzzles in single assignment
- **Filter tasks** by subject, topic, difficulty
- **Preview before assign** - Review all tasks
- **Due dates** with badge status indicators (overdue/due soon/upcoming)
- **Progress tracking** - Per-student completion status
- **Mixed content types** - Flashcards, jigsaws, fill-in-the-blanks
- **Automatic status updates** - not-started → in-progress → completed

### Admin Dashboard
Content management system with lazy loading:
- **Manual data loading** - Click to fetch (prevents automatic Firestore reads)
- **Tracks loaded tabs** - Prevents duplicate fetches
- **Bulk JSON import** - Import flashcards/puzzles from JSON files
- **CRUD operations** with optimistic updates
- **Content search** - Filter by title, subject, topic
- **Form validation** with Zod schemas
- **Analytics** - Basic statistics on content library

**Security**: Admin access currently hardcoded to `false` in UserProvider (needs custom claims implementation)

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

## Recent Changes & Learnings

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for detailed history of changes including:

**October 2025 Updates**:
1. **Logout Flash Fixes** - Removed redundant client-side auth checks, fixed visual artifacts during logout
2. **Role-Based Access Control** - Server-side layout protection for teacher-only routes (CoreTools)
3. **Performance Optimizations** - Phase 1A/1B with 834 KB lazy-loaded, 40-60% re-render reduction, 70-80% Firestore read reduction
4. **UI Consistency** - GameContainer component, standardized layouts, removed fullscreen transitions

**Key Learnings**:
- Trust server-side protection, avoid redundant client checks
- Always use query limits on Firestore queries
- Context memoization critical for large apps
- Server-side layouts superior to client-side redirects
- Base UI on pathname, not auth state (prevents flashing)

## Additional Documentation
- [docs/README.md](docs/README.md) - Comprehensive product guide and feature surface
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Detailed change history with learnings
- [docs/AGENTS.md](docs/AGENTS.md) - Repository guidelines for AI agents (Codex)
- [firestore.rules](firestore.rules) - Firestore security rules (324 lines with helper functions)
- [components.json](components.json) - Shadcn/UI configuration
