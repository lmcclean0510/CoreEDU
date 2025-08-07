## CoreEDU: Project Blueprint (Updated)

This document explains how CoreEDU works end-to-end today: architecture, data flows, frontend and backend details, UI system, deployment, and how Vercel and Firebase fit together.

## High-Level Goal

CoreEDU is a modular educational platform for students and teachers. It provides curriculum-aligned challenges, reusable study tools, dashboards, and classroom utilities. The platform is built for expansion (e.g., subject hubs like CoreCS, CoreGEO, CoreMATHS).

## Technology Stack

- **Framework**: Next.js (App Router, React 18), TypeScript
- **Styling**: Tailwind CSS, ShadCN/UI (Radix primitives)
- **Data**: Firebase (Auth, Firestore, Storage) + Firebase Admin in server routes
- **AI**: Genkit with Google AI plugin (Gemini family)
- **DnD/Canvas**: Dnd-Kit; games via Phaser (for some labs)

## Project Structure

The codebase is feature-first around the Next.js App Router. Highlights below; use this directory map to navigate.

### src/app - Routing & Pages

```
src/app/
│
├── (auth)/                 # Public auth routes
│   ├── login/page.tsx
│   └── signup/page.tsx
│
├── admin/                  # Admin CMS (flashcards, puzzles)
│   ├── components/
│   ├── hooks/
│   └── page.tsx
│
├── corecs/                 # Computer Science hub
│   ├── gcse/
│   ├── binary/page.tsx
│   ├── hex/page.tsx
│   ├── concept-detective/page.tsx
│   └── python/
│
├── corelabs/               # Skills-based games
├── coretools/              # Teacher utilities (seating plan)
├── dashboard/              # Student/Teacher dashboards
├── homework/attempt/[id]/page.tsx
├── account/page.tsx
├── page.tsx                # Landing page
├── layout.tsx              # Root layout (providers, theme, shell)
└── globals.css
```

### src/components - Reusable UI

```
src/components/
├── auth/ProtectedRoute.tsx
├── dashboard/{student,teacher}/...
├── features/{flashcards,homework,puzzles,games}
├── layout/{header,footer,main-layout}
├── shared/{UserSearchDialog,FirestoreStats,...}
└── ui/ (ShadCN primitives)
```

### src/hooks

```
src/hooks/
├── flashcard/*            # flashcard data, navigation, progress
├── teacher/*              # class + homework mgmt flows
└── shared/*               # toast, firestore monitor, user search
```

### src/providers

```
src/providers/
├── UserProvider.tsx             # Global auth state + useAuth()
└── FirestoreMonitorProvider.tsx # Firestore debug HUD and logs
```

### src/lib

```
src/lib/
├── firebase.ts          # Client SDK init (Auth/Firestore/Storage)
├── firebase-admin.ts    # Server Admin SDK (Auth/Firestore)
├── types.ts             # Shared types
├── cache.ts             # Simple in-memory cache
└── utils.ts             # UI helpers (e.g., cn)
```

### Other important files

- `src/middleware.ts`: Edge middleware for guarding server routes by cookie
- `src/app/api/auth/session/route.ts`: Auth session cookie API (create/destroy)
- `src/ai/*`: Genkit config and flows
- `firestore.rules`: Security rules for the database
- `firebase.json`: Points to rules and indexes
- `apphosting.yaml`: Optional Firebase App Hosting config (scaling)
- `next.config.ts`: Next.js config (images, build settings)

## Architecture and Data Flow

### Authentication and Session

- Client login: user signs in via Firebase Auth on the client (email/password, etc.).
- Session cookie: the client sends the Firebase ID token to `POST /api/auth/session`. The route verifies the token with Admin SDK and sets a secure `session` cookie.
- Middleware: `src/middleware.ts` checks for `session`/`__session`/`firebase-token` cookies to allow or block server-side navigation to protected routes (`/dashboard`, `/admin`, `/account`).
- Client protection: `src/components/auth/ProtectedRoute.tsx` wraps most interactive pages to redirect unauthenticated users and enforce role checks client-side.
- User context: `src/providers/UserProvider.tsx` listens to `onAuthStateChanged`, merges the Firebase user with their Firestore profile, refreshes token claims to compute `isAdmin`, and exposes `useAuth()` with `{ user, isAuthenticated, isAdmin, isLoading, logout }`.
- Logout: calls `DELETE /api/auth/session` to clear the cookie, signs out Firebase Auth, clears caches, and redirects to `/login`.

Key files:

```20:91:src/middleware.ts
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'] }
```

```1:104:src/app/api/auth/session/route.ts
// Verifies ID token, sets secure httpOnly cookie; DELETE clears it
```

```1:186:src/providers/UserProvider.tsx
// Global auth state + admin claims via getIdTokenResult(true)
```

### Firestore data model and rules

Collections: `users`, `classes`, `homework`, `studentHomeworks`, `flashcards`, `puzzles`, `fillInTheBlanksChallenges`, `puzzleSections`, etc.

Security highlights (`firestore.rules`):

- Role helpers (`isTeacher`, `isStudent`, `isAdmin`) and ownership checks
- Teachers manage classes and homework for their classes; students read their own
- Admins (custom claim `admin: true`) have write access to content collections
- Users can only update their own profile without changing role
- Flashcards readable by all signed-in users; writes restricted to admins

```1:226:firestore.rules
// Full ruleset defining read/write/list scopes and role checks
```

### Caching and observability

- `src/lib/cache.ts`: simple in-memory cache to avoid repeated reads (e.g., user profile)
- `FirestoreMonitorProvider`: provides `window.firestoreMonitor` and HUD (`FirestoreStats`) to track reads/writes per page and reset counters

## Features Overview

### Admin CMS (`/admin`)

- Manage `flashcards` and `puzzles` via hooks `useAdminFlashcards` and `useAdminPuzzles`
- Bulk JSON imports (`JsonImportDialog`, `PuzzleJsonImportDialog`)
- Search/filter helpers via `useContentSearch`
- Admin access is via token claims; UI also checks `useAuth().isAdmin`

### Flashcards (GCSE CS)

- Controller: `features/flashcards/flashcard-client.tsx`
- Hooks: `use-flashcard-data`, `use-flashcard-navigation`, `use-flashcard-progress`
- Ratings saved in `userFlashcardRatings` with per-user security
- Topic/subtopic filtering and confidence filtering; progress and shuffle controls

### Python challenges (Jigsaw, Fill-in-the-blanks)

- Client controllers under `features/puzzles/*`; pages under `corecs/python/*`
- Built on Dnd-Kit

### Concept Detective

- Loads flashcards and builds contextual challenges; timer and score modes

### CoreLabs (games) and stats

- Games under `corelabs/*`; leaderboard views in teacher dashboards show class stats using `corebinStats` on `UserProfile`

### Seating Plan (CoreTools)

- Complex DnD workspace for classroom layouts
- Hooks: `useSeatingPlan`, `useDragAndDrop`, `useStudentAssignment`, `useExport`
- Grouping, constraints, auto-assign, export to image, presets

## Frontend Internals (in-depth)

- App Router, mostly client components for interactive pages
- Global layout `src/app/layout.tsx` wires up fonts, theme, `MainLayout`, `UserProvider`, `FirestoreMonitorProvider`, and `Toaster`
- UI built with ShadCN/Radix: accessible primitives, predictable variants and composition
- State management: colocated hooks per feature; minimal global state besides auth
- Performance:
  - Cache reads with `dataCache`
  - Real-time subscriptions (`onSnapshot`) only where beneficial (e.g., student homework)
  - Filtering and derived UI with `useMemo`
  - Image domains controlled in `next.config.ts`

## Backend and APIs (in-depth)

- Next.js server routes live under `src/app/api/*` using Route Handlers.
- Firebase Admin: `src/lib/firebase-admin.ts` initializes Admin SDK from environment, restricted to server-only contexts.
- Auth session endpoint `api/auth/session`:
  - `POST`: verify Firebase ID token, set secure `session` cookie (5 days, httpOnly, sameSite=lax, secure in prod)
  - `DELETE`: clear session cookie for logout
- Middleware enforces cookie presence for protected segments to prevent SSR access to protected pages
- No custom RPC layer beyond these auth endpoints; most CRUD is direct Firestore from client with Rules enforcement

## Generative AI (Genkit)

- Config in `src/ai/genkit.ts` uses `@genkit-ai/googleai` and default `googleai/gemini-2.0-flash`
- Active flow: `generate-avatar` for avatar image generation
- Other flows (`explain-quiz-answer`, `generate-fill-in-the-blanks-hint`, `generate-personalized-hint`) are stubbed out to disable paid features until billing is enabled

## UI/UX System (in-depth)

- Theme tokens in `globals.css`; font variables `--font-inter` and `--font-lexend`
- Components follow ShadCN patterns with clear props, variants, and composition
- Interaction patterns: dialogs, tabs, selects, toasts via Radix
- Visual consistency: cards (`shadow-md`, `rounded-lg`, bordered), focus rings, and accessible states

## Deployment: Vercel + Firebase

- Vercel hosts the Next.js app (static assets, SSR/route handlers). Configure environment variables in Vercel Project Settings.
- Firebase provides Auth, Firestore, and Storage. Rules are deployed with the Firebase CLI.
- Optional Firebase App Hosting (via `apphosting.yaml`) is present for future backend hosting/scaling scenarios but is not required when deploying the app on Vercel.

Recommended setup:

1) Vercel
- Add environment variables (see list below)
- Build command: `next build`; start: `next start` (Vercel defaults are fine)
- Ensure Node.js runtime for API routes (Next 15 default); Admin SDK only used in server routes

2) Firebase
- Initialize project in local CLI (`firebase login`, `firebase use <project>`)
- Deploy security rules when they change:
  - `firebase deploy --only firestore:rules`
  - `firebase deploy --only storage:rules` (if Storage rules file exists/used)

## Environment Variables

Client (public) Firebase SDK (`src/lib/firebase.ts`):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server (Admin SDK) (`src/lib/firebase-admin.ts`):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`  (use escaped newlines in Vercel; Admin code replaces `\n` → newline)

Genkit / Google AI:
- Provide the relevant key(s) in your environment/secrets per Genkit docs. Dev commands use `genkit` CLI.

## Local Development

- Create `.env.local` with the variables listed above (client + server). For local server vars, you can also use `.env`.
- Install dependencies: `npm install`
- Run web app: `npm run dev` (Turbopack on port 9002)
- Type checking: `npm run typecheck`
- Lint: `npm run lint`
- Optional AI dev server: `npm run genkit:dev` or `npm run genkit:watch`

## End-to-End: How it all connects

- User signs in on `/login` (Firebase client SDK)
- Client sends ID token to `POST /api/auth/session` → server verifies and sets `session` cookie
- Middleware allows navigation to `/dashboard`, `/admin`, `/account`
- Client components read `useAuth()` and fetch Firestore data appropriate for the role and page
- Firestore Rules enforce authorization on all reads/writes
- Admins manage content; students complete tasks; teachers manage classes and homework

## Notable Implementation Details

- `next.config.ts` permits remote images from `placehold.co` and `robohash.org`
- `UserProvider` proactively refreshes token claims (`getIdTokenResult(true)`) to compute `isAdmin`
- `logout` clears server cookie before client sign-out for a clean transition
- Middleware `matcher` excludes assets and `api` routes from auth checks
- Some Genkit flows are disabled intentionally to avoid billing; enable by adding credentials and implementing flows
- Next is configured to ignore type and lint errors during builds; consider tightening for production

## Troubleshooting

- Admin SDK errors on Vercel: ensure `FIREBASE_PRIVATE_KEY` uses escaped newlines; Admin init replaces `\n` automatically
- Auth works locally but middleware blocks on Vercel: verify `session` cookie is set and `POST /api/auth/session` succeeds; check sameSite/secure flags
- Firestore permission denied: confirm user role/profile in `users/{uid}`, membership in `classes/{classId}`, or admin claim presence
- Genkit image generation fails: ensure Google AI credentials are configured

---

## File Breakdown & Connections (reference)

This section cross-links key files to features.

### src/app (Pages & Routes)

- `layout.tsx`: wraps the app with `UserProvider`, `FirestoreMonitorProvider`, `Toaster`, `MainLayout`.
- `page.tsx`: landing page; surfaces dashboard links when authenticated.
- `(auth)/*`: login/sign-up UIs using Firebase Auth + `useToast`.
- `admin/page.tsx`: entry to CMS. Uses `ProtectedRoute` and admin hooks/components.
- `account/page.tsx`: profile and avatar generation (`generateAvatar`).
- `dashboard/teacher/*`: class data, leaderboards, and homework creation flows.
- `dashboard/student/page.tsx`: real-time homework overview.
- `corecs/*`: subject content hubs and interactive tools.
- `coretools/seating-plan/*`: full-featured seating plan tool.
- `homework/attempt/[studentHomeworkId]/page.tsx`: task runner for student homework.

### src/components (UI Components)

- `auth/ProtectedRoute.tsx`: client-side route guard using `useAuth()`.
- `layout/*`: app chrome; `Header` uses `UserNav`.
- `shared/*`: dialogs, search, and Firestore debug HUD.
- `features/*`: flashcards, puzzles, homework clients, leaderboard.

### src/hooks (Logic & State)

- `flashcard/*`: data fetching, navigation, and rating persistence.
- `teacher/*`: class roster, join requests, homework CRUD.
- `shared/*`: toasts, Firestore monitor, search helpers.

### src/providers

- `UserProvider.tsx`: global auth, profile merge, admin claims, and `logout`.
- `FirestoreMonitorProvider.tsx`: exposes `window.firestoreMonitor` and on-screen stats.

### src/lib

- `firebase.ts`: client app, `auth`, `db`, `storage` exports.
- `firebase-admin.ts`: server-only Admin SDK; throws if env vars missing.
- `types.ts`: `UserProfile`, `Flashcard`, `HomeworkAssignment`, etc.
- `cache.ts`: session-lifetime in-memory store.

---

This blueprint is synchronized with the current codebase and should serve as your single source of truth for how the system is wired together, how to run it locally, and how to deploy it to Vercel with Firebase services.

---

# CoreEDU: Project Blueprint old:

This document provides a comprehensive overview of the CoreEDU application, its architecture, key features, design philosophy, and technical implementation.

## 1. High-Level Goal

CoreEDU is a modular educational platform designed to provide interactive learning tools for various subjects. It serves both students and teachers with a suite of applications, from curriculum-aligned challenges to powerful classroom management utilities. The platform is architected for future expansion into subject hubs like "CoreGEO" (Geography) and "CoreMATHS" (Mathematics) alongside the flagship "CoreCS" (Computer Science) hub.

## 2. Technology Stack

-   **Frontend Framework:** **Next.js** with **React** (using the App Router).
-   **Language:** **TypeScript**.
-   **Styling:** **Tailwind CSS** with **ShadCN/UI** for a pre-built, accessible, and themeable component library.
-   **Backend & Database:** **Firebase** (Firestore and Firebase Authentication).
-   **Drag & Drop:** **Dnd-Kit** for interactive UIs.
-   **Generative AI:** **Genkit** for AI-powered features.

---

## 3. Project Structure

The project follows a scalable, feature-first structure centered around the Next.js App Router.

### `src/app` - Routing & Pages

```
src/app/
│
├── (auth)/                 # Group for authentication routes
│   ├── login/page.tsx      # User login page
│   └── signup/page.tsx     # User registration page
│
├── admin/                  # Admin Content Management Dashboard
│   ├── components/         # Admin-specific components
│   │   ├── AdminAnalytics.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── FlashcardForm.tsx
│   │   ├── FlashcardManagement.tsx
│   │   ├── JsonImportDialog.tsx
│   │   ├── PuzzleForm.tsx
│   │   ├── PuzzleJsonImportDialog.tsx
│   │   └── PuzzleManagement.tsx
│   ├── hooks/              # Admin-specific hooks
│   │   ├── useAdminFlashcards.ts
│   │   ├── useAdminPuzzles.ts
│   │   ├── useContentSearch.ts
│   │   ├── useFlashcardForm.ts
│   │   ├── useJsonImport.ts
│   │   ├── usePuzzleForm.ts
│   │   └── usePuzzleJsonImport.ts
│   └── page.tsx            # Main admin dashboard page
│
├── corecs/                 # Core Computer Science Subject Hub
│   ├── gcse/               # Section for GCSE-level content
│   │   ├── flashcards/page.tsx
│   │   └── page.tsx        # Landing page for GCSE CS topics
│   │
│   ├── binary/page.tsx     # Self-contained binary practice tool
│   ├── hex/page.tsx        # Self-contained hex practice tool
│   ├── concept-detective/page.tsx # Concept application game
│   └── python/             # Hub for Python challenges
│       ├── fill-in-the-blanks/[id]/page.tsx
│       ├── jigsaw/[id]/page.tsx
│       └── page.tsx
│
├── corelabs/               # Hub for skills-based games
│   ├── binary-game/page.tsx
│   ├── denary-game/page.tsx
│   ├── keyboard-ninja/page.tsx
│   ├── mouse-skills/page.tsx
│   └── page.tsx
│
├── coretools/              # Hub for teacher-specific utilities
│   ├── seating-plan/
│   │   ├── ... (Seating Plan feature files)
│   └── page.tsx
│
├── dashboard/              # User dashboards
│   ├── student/page.tsx
│   └── teacher/
│       ├── class/[classId]/page.tsx
│       ├── leaderboard/[classId]/page.tsx
│       └── page.tsx
│
├── homework/
│   └── attempt/[studentHomeworkId]/page.tsx
│
├── account/page.tsx        # User account management page
├── quick-quiz/page.tsx     # Placeholder for future quiz feature
├── page.tsx                # Main landing page for the CoreEDU platform
├── layout.tsx              # Root layout for the entire application
└── globals.css             # Global styles and ShadCN theme
```

### `src/components` - Reusable UI Components

```
src/components/
│
├── auth/
│   └── ProtectedRoute.tsx  # Protects routes from unauthenticated access
│
├── dashboard/              # Components used only within user dashboards
│   ├── student/
│   │   └── JoinClassDialog.tsx
│   └── teacher/
│       ├── ClassCard.tsx
│       ├── ClassSettingsDialog.tsx
│       ├── CreateClassDialog.tsx
│       ├── DeleteClassDialog.tsx
│       ├── JoinRequestCard.tsx
│       ├── JoinRequestPanel.tsx
│       ├── JoinRequestsButton.tsx
│       ├── NextLessonWidget.tsx
│       ├── StudentManagement.tsx
│       ├── TeacherManagement.tsx
│       └── WeeklyTimetable.tsx
│
├── features/               # Components tied to a specific app feature
│   ├── flashcards/
│   │   ├── flashcard-client.tsx
│   │   ├── flashcard-confidence-dialog.tsx
│   │   ├── flashcard-controls.tsx
│   │   ├── flashcard-filter-dialog.tsx
│   │   ├── flashcard-renderer.tsx
│   │   ├── flashcard-settings-dialog.tsx
│   │   └── flashcard-sidebar.tsx
│   ├── games/
│   │   └── leaderboard-table.tsx
│   ├── homework/
│   │   ├── HomeworkManagement.tsx
│   │   └── homework-flash-card-client.tsx
│   └── puzzles/
│       ├── fill-in-the-blanks-client.tsx
│       ├── puzzle-client.tsx
│       └── puzzles-client.tsx
│
├── layout/                 # Main application layout components
│   ├── footer.tsx
│   ├── header.tsx
│   └── main-layout.tsx
│
├── shared/                 # Components reused across multiple, unrelated features
│   ├── ConfirmationDialog.tsx
│   ├── FirestoreStats.tsx
│   ├── UserListItem.tsx
│   ├── UserSearchDialog.tsx
│   └── user-nav.tsx
│
└── ui/                     # Core, unstyled UI components from ShadCN (Button, Card, etc.)
```

### `src/hooks` - Custom React Hooks

```
src/hooks/
│
├── flashcard/              # Hooks for the flashcard system
│   ├── use-flashcard-data.tsx
│   ├── use-flashcard-navigation.tsx
│   └── use-flashcard-progress.tsx
│
├── shared/                 # Hooks used across the entire application
│   ├── use-firestore-monitor.ts
│   ├── use-toast.ts
│   └── use-user-search.ts
│
└── teacher/                # Hooks for managing teacher-specific data and actions
    ├── use-class-data.ts
    ├── use-class-management.ts
    ├── use-homework-management.ts
    ├── use-join-requests.ts
    └── use-teacher-classes.ts
```

### `src/providers` - Global Context Providers

```
src/providers/
│
├── FirestoreMonitorProvider.tsx
└── UserProvider.tsx
```

---

## 4. Key Features & Implementation

### 4.1. Authentication & User Management
-   Authentication is handled globally by **`UserProvider.tsx`**, which provides a React Context for user state across the application.
-   The **`useAuth()` hook**, exported from `UserProvider.tsx`, is used by components to access the current user's authentication status, Firebase user object, and custom profile data from Firestore (e.g., `role`, `firstName`).
-   Pages requiring authentication are wrapped in the **`ProtectedRoute.tsx`** component. This component checks the user's authentication state via the `useAuth()` hook and automatically redirects unauthenticated users to the `/login` page.
-   The system supports distinct `student` and `teacher` roles stored in Firestore. An `admin` role is also supported via Firebase Custom Claims, granting access to the `/admin` dashboard.

### 4.2. Admin Dashboard
-   **Content Management:** A full-featured dashboard at `/admin` for CRUD (Create, Read, Update, Delete) operations on `flashcards` and `puzzles`.
-   **Bulk Import:** The `JsonImportDialog` component allows admins to bulk-create content by pasting a JSON array, significantly speeding up content population.
-   **Custom Hooks:** The entire feature is powered by a suite of dedicated hooks in `src/app/admin/hooks`, such as `useAdminFlashcards` and `useAdminPuzzles`, which encapsulate all Firestore logic.
-   **Analytics:** A simple analytics tab provides an overview of content distribution and database status.

### 4.3. CoreCS - Computer Science Hub
-   **Python Challenges:** Features a "Coding Jigsaw" (drag-and-drop) and "Fill-in-the-Blanks" powered by `Dnd-Kit`.
-   **Binary/Hex Tools:** Standalone pages for practicing number base conversions with different modes and stat tracking.
-   **Flashcard System:** A highly reusable system built with a `FlashCardClient` controller and multiple custom hooks (`useFlashcardData`, `useFlashcardNavigation`, `useFlashcardProgress`) to manage state and data fetching. It's designed to be easily adapted for any subject.

### 4.4. CoreTools - Teacher Utilities
-   **Seating Plan Generator:** A sophisticated tool for classroom layouts using `Dnd-Kit`. It includes automated student assignment logic and flexible layout tools.

---

## 5. Design & Style Overview

The UI is designed to be clean, modern, and accessible, built upon ShadCN/UI and styled with Tailwind CSS.

### 5.1. Color Palette
The color system is defined using HSL values in `src/app/globals.css`.

-   **Primary Color:** `hsl(173, 80%, 40%)` (#14b8a6) - A vibrant teal for key interactive elements.
-   **Foreground Color:** `hsl(220, 30%, 35%)` (#3f5374) - A dark, desaturated blue for primary text.
-   **Background Color:** `hsl(240, 6%, 99%)` (#f8fafc) - A very light, clean background.
-   **Destructive & Success:** Standard red and green for user feedback.

### 5.2. Typography
-   **Body Font (`--font-inter`):** **Inter** is used for all body text.
-   **Headline Font (`--font-lexend`):** **Lexend** is used for major headings and titles.

### 5.3. Component Styling
-   **Cards (`Card`):** Have a subtle shadow (`shadow-md`), `1px` border, and rounded corners (`rounded-lg`).
-   **Buttons (`Button`):** Feature variants for different purposes and provide clear interactive feedback on hover.
-   **Inputs (`Input`, `Textarea`):** Use a clean design with a distinct focus state.

---

## 6. Firestore Database Structure

The database is designed for scalability.

-   **`users`:** Stores user profiles and roles.
-   **`classes`:** Stores class information and student/teacher relationships.
-   **`puzzles` & `fillInTheBlanksChallenges`:** Collections for specific challenge types.
-   **`flashcards`:** A **single, unified collection for all subjects**. Each document has a `subject` field, making it highly scalable and easy to query for any new subject without schema changes.

## 7. File Breakdown & Connections

This section provides a detailed explanation of each key file and its relationship with other parts of the application.

### `src/app` (Pages & Routes)

-   **`layout.tsx`**: The root layout of the entire application.
    -   **Connections**: Wraps all other pages. Imports `UserProvider`, `FirestoreMonitorProvider`, `Toaster`, `MainLayout`, and global CSS.
-   **`page.tsx`**: The main landing page of the CoreEDU platform.
    -   **Connections**: Uses the `useAuth` hook to conditionally display dashboard links. Imports `UserNav`, `Card`, and `Button` components.
-   **`(auth)/*`**: Contains the login and signup pages. These are public-facing routes.
    -   **Connections**: Utilize Firebase Authentication (`signInWithEmailAndPassword`, etc.), `useToast`, and various UI components.
-   **`admin/page.tsx`**: The main page for the Content Management System.
    -   **Connections**: Wrapped in `ProtectedRoute`. Uses admin-specific hooks (`useAdminFlashcards`, `useAdminPuzzles`) and components (`AdminHeader`, `FlashcardManagement`, etc.) to build the management interface.
-   **`account/page.tsx`**: User account management page.
    -   **Connections**: Wrapped in `ProtectedRoute`. Uses `useAuth` hook for user data, interacts with Firestore to update user profiles, and uses `generateAvatar` Genkit flow.
-   **`dashboard/teacher/*`**: Pages for the teacher dashboard, including the main dashboard, class-specific views, and leaderboards.
    -   **Connections**: Wrapped in `ProtectedRoute`. Heavily dependent on teacher-specific hooks (`useTeacherClasses`, `useClassData`, `useJoinRequests`) and dashboard components.
-   **`dashboard/student/page.tsx`**: The main dashboard for students, primarily showing homework.
    -   **Connections**: Wrapped in `ProtectedRoute`. Uses `useAuth` hook and `JoinClassDialog` component. Interacts with `homework` and `studentHomeworks` collections in Firestore.
-   **`corecs/*`**: The hub for all Computer Science content. Includes pages for Python, Binary, Hex, and GCSE-specific topics.
    -   **Connections**: All interactive pages (`binary`, `hex`, `gcse/flashcards`, `python`, etc.) are wrapped in `ProtectedRoute`. These pages often use feature-specific components like `PuzzlesClient` or `FlashCardClient`.
-   **`corelabs/*`**: The hub for skills-based games.
    -   **Connections**: All game pages are wrapped in `ProtectedRoute` to save high scores and require user authentication to play.
-   **`coretools/seating-plan/*`**: The seating plan generator tool.
    -   **Connections**: A complex feature composed of many specific components and hooks within its own subdirectory. Uses `Dnd-Kit` for drag-and-drop functionality. Wrapped in `ProtectedRoute`.
-   **`homework/attempt/[studentHomeworkId]/page.tsx`**: The page where a student completes a homework assignment.
    -   **Connections**: Wrapped in `ProtectedRoute`. Uses `useAuth` to verify the student. Fetches `studentHomeworks` and `homework` collections. Renders task components like `HomeworkFlashCardClient` and `PuzzleClient`.

### `src/components` (UI Components)

-   **`auth/ProtectedRoute.tsx`**: A component that wraps page content to ensure a user is authenticated before rendering.
    -   **Connections**: Used by most pages in `src/app`. Depends on `useAuth` from `UserProvider`.
-   **`layout/*`**: `Header`, `Footer`, `MainLayout`. These structure the visual layout of the app.
    -   **Connections**: `MainLayout` is used in the root `layout.tsx`. `Header` uses `UserNav` and is aware of the current route via `usePathname`.
-   **`shared/*`**: `ConfirmationDialog`, `UserListItem`, `UserSearchDialog`, `UserNav`. Highly reusable components used across different features.
    -   **Connections**: `UserNav` uses `useAuth`. `UserSearchDialog` uses the `useUserSearch` hook. These are imported by various dashboard and management pages.
-   **`dashboard/teacher/*`**: Components specifically for the teacher dashboard interface.
    -   **Connections**: These components are the building blocks for the teacher dashboard pages. They often take data fetched by hooks like `useClassData` as props.
-   **`dashboard/student/*`**: Components for the student dashboard.
    -   **Connections**: `JoinClassDialog` uses the `useClassManagement` hook to send requests.
-   **`features/flashcards/*`**: The entire flashcard system is broken down into modular components here.
    -   **Connections**: `flashcard-client.tsx` is the main controller, orchestrating the other flashcard components and using the `useFlashcard...` hooks.
-   **`features/puzzles/*`**: Clients for displaying Python challenges.
    -   **Connections**: Used by the Python pages in `src/app/corecs/python`. They handle the logic for jigsaws and fill-in-the-blanks.

### `src/hooks` (Logic & State Management)

-   **`flashcard/*`**: State management for the flashcard feature.
    -   **Connections**: `useFlashcardData` fetches cards from Firestore. `useFlashcardNavigation` handles the client-side logic of moving between cards. `useFlashcardProgress` saves user confidence ratings to Firestore. All are used by `FlashcardClient`.
-   **`teacher/*`**: Hooks for fetching and managing teacher-specific data.
    -   **Connections**: `useTeacherClasses` fetches the list of classes for the main dashboard. `useClassData` fetches detailed information for a single class. `useClassManagement` provides functions to modify class data (add/remove students, etc.). `useJoinRequests` handles pending student join requests.
-   **`shared/*`**: Globally useful hooks.
    -   **Connections**: `useToast` is used everywhere to show notifications. `useUserSearch` is used by components like `StudentManagement` to find users. `useFirestoreMonitor` is used by the `FirestoreMonitorProvider`.

### `src/providers` (Global Context Providers)

-   **`UserProvider.tsx`**: The core of the authentication system. It provides a global context with the current user's state, profile, and loading status.
    -   **Connections**: This provider wraps the entire application in `layout.tsx`. It exports the `useAuth()` hook which is used by almost every page and component that requires user data.
-   **`FirestoreMonitorProvider.tsx`**: A development tool that tracks and displays Firestore read/write operations to help debug performance issues.
    -   **Connections**: This provider wraps the `MainLayout`. It exposes a global `window.firestoreMonitor` object for logging database interactions.

### `src/lib` (Core Logic & Definitions)

-   **`firebase.ts`**: Initializes and exports the Firebase app instance, auth, and Firestore database.
    -   **Connections**: Imported by almost every file that interacts with Firebase.
-   **`types.ts`**: Contains all TypeScript type definitions for the project's data structures (e.g., `ClassInfo`, `Puzzle`, `Flashcard`).
    -   **Connections**: Imported throughout the application to ensure type safety.
-   **`utils.ts`**: Home to the `cn` utility function for merging Tailwind CSS classes.
    -   **Connections**: Used in nearly every component that involves conditional styling.
-   **`cache.ts`**: A simple in-memory cache to reduce redundant Firestore reads for data that doesn't change frequently within a session.
    -   **Connections**: Used by data-fetching hooks like `useTeacherClasses` and `useClassData`.
