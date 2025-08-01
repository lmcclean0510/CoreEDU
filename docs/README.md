# CoreEDU: Project Blueprint

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
