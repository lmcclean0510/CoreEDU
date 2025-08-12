# CoreEDU: Complete Platform Documentation

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Project Structure](#project-structure)
5. [Authentication & Session Management](#authentication--session-management)
6. [Database Schema & Security](#database-schema--security)
7. [Core Features](#core-features)
8. [File-by-File Breakdown](#file-by-file-breakdown)
9. [Component Architecture](#component-architecture)
10. [Hooks & State Management](#hooks--state-management)
11. [API Routes](#api-routes)
12. [Deployment & Configuration](#deployment--configuration)
13. [Development Guide](#development-guide)
14. [Troubleshooting](#troubleshooting)

---

## Overview

CoreEDU is a comprehensive educational platform built for schools, teachers, and students. It provides interactive learning tools across multiple subjects with a focus on Computer Science education. The platform features curriculum-aligned challenges, classroom management tools, and gamified learning experiences.

### Key Capabilities

- **Multi-Subject Support**: Computer Science, Mathematics, Geography (extensible)
- **Role-Based Access**: Students, Teachers, and Administrators
- **Interactive Learning**: Drag-and-drop puzzles, flashcards, coding challenges
- **Classroom Management**: Class creation, homework assignment, progress tracking
- **Gamification**: Skills-based games with leaderboards
- **Teacher Tools**: Seating plan generator, analytics dashboard
- **AI Integration**: Avatar generation and educational assistance

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.3 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS with ShadCN/UI component library
- **UI Components**: Radix UI primitives for accessibility
- **Fonts**: Inter (body), Lexend (headings)
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit/core for interactive components
- **Games**: Phaser.js for game development

### Backend & Infrastructure
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Auth with custom session management
- **File Storage**: Firebase Storage
- **Server**: Next.js API routes with Firebase Admin SDK
- **Middleware**: Custom authentication middleware
- **Security**: Firestore security rules, session cookies

### AI & Enhancement
- **AI Framework**: Genkit with Google AI (Gemini 2.0 Flash)
- **Image Generation**: AI-powered avatar creation
- **Code Editor**: Ace Editor for code input
- **Export**: HTML-to-image for seating plan exports

### Development Tools
- **Build Tool**: Turbopack (development), Next.js (production)
- **Type Safety**: TypeScript with strict configuration
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm

---

## Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client (Web)  │◄──►│  Next.js App    │◄──►│   Firebase      │
│                 │    │                 │    │                 │
│ - React Pages   │    │ - API Routes    │    │ - Firestore     │
│ - Components    │    │ - Middleware    │    │ - Auth          │
│ - Hooks         │    │ - Server Logic  │    │ - Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Authentication Flow

1. **Client Login**: User signs in via Firebase Auth on client side
2. **Token Exchange**: Client sends ID token to `/api/auth/session`
3. **Server Verification**: Server verifies token with Firebase Admin SDK
4. **Session Cookie**: Server sets secure `session` cookie (5-day expiry)
5. **Middleware Protection**: Middleware checks session cookie for protected routes
6. **Client Protection**: `ProtectedRoute` component provides additional client-side checks

### Data Flow Patterns

1. **Read Operations**: Client → Firestore (with real-time listeners where needed)
2. **Write Operations**: Client → Firestore (secured by Firestore rules)
3. **Session Management**: Client → API Routes → Firebase Admin SDK
4. **File Uploads**: Client → Firebase Storage
5. **AI Operations**: Client → API Routes → Genkit → Google AI

---

## Project Structure

### Root Directory Structure

```
CoreEDU/
├── src/                      # Source code
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # Reusable React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries and configurations
│   ├── providers/            # React context providers
│   ├── ai/                   # AI/Genkit configuration
│   └── middleware.ts         # Next.js middleware for auth
├── docs/                     # Documentation
├── firebase.json             # Firebase configuration
├── firestore.rules          # Database security rules
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

### App Router Structure (`src/app/`)

```
src/app/
├── (auth)/                   # Public authentication routes
│   ├── login/page.tsx        # Login page
│   └── signup/page.tsx       # Registration page
├── admin/                    # Admin content management
│   ├── components/           # Admin-specific components
│   ├── hooks/                # Admin-specific hooks
│   └── page.tsx              # Main admin dashboard
├── api/                      # API routes
│   └── auth/session/route.ts # Session management API
├── corecs/                   # Computer Science hub
│   ├── gcse/                 # GCSE-specific content
│   ├── binary/page.tsx       # Binary conversion tool
│   ├── hex/page.tsx          # Hexadecimal tool
│   ├── concept-detective/    # Concept application game
│   └── python/               # Python challenges
├── corelabs/                 # Skills-based games
│   ├── binary-game/          # Binary falling blocks game
│   ├── denary-game/          # Denary conversion game
│   ├── keyboard-ninja/       # Typing/shortcuts game
│   └── mouse-skills/         # Mouse accuracy game
├── coretools/                # Teacher utilities
│   └── seating-plan/         # Classroom seating tool
├── dashboard/                # Role-based dashboards
│   ├── student/              # Student dashboard
│   └── teacher/              # Teacher dashboard
├── homework/                 # Homework system
│   └── attempt/[id]/         # Student homework attempts
├── account/page.tsx          # User account management
├── layout.tsx                # Root application layout
├── page.tsx                  # Landing/home page
└── globals.css               # Global styles and CSS variables
```

---

## Authentication & Session Management

### Session Flow Implementation

#### 1. Client-Side Authentication (`src/providers/UserProvider.tsx`)

```typescript
// Listens to Firebase Auth state changes
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    // Fetch user profile from Firestore
    // Check admin claims from token
    // Merge Firebase user with profile data
    // Cache results for performance
  }
});
```

**Key Features**:
- Global auth state via React Context
- Automatic profile fetching and caching
- Admin claim verification
- Real-time auth state updates
- Secure logout with cache clearing

#### 2. Server-Side Session Management (`src/app/api/auth/session/route.ts`)

```typescript
// POST: Create session
const decodedToken = await adminAuth.verifyIdToken(idToken);
const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

// DELETE: Clear session
response.cookies.set('session', '', { maxAge: 0 });
```

**Security Features**:
- HttpOnly cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- 5-day expiration
- Server-side token verification

#### 3. Middleware Protection (`src/middleware.ts`)

```typescript
// Check session cookie for protected routes
const sessionCookie = request.cookies.get('session')?.value;
const isAuthenticated = !!sessionCookie;

// Route-based protection
if (pathname.startsWith('/dashboard') && !isAuthenticated) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

**Protected Routes**:
- `/dashboard/*` - Requires authentication
- `/admin/*` - Requires authentication (admin check on client)
- `/account/*` - Requires authentication
- `/homework/*` - Requires authentication

#### 4. Client-Side Route Protection (`src/components/auth/ProtectedRoute.tsx`)

```typescript
// Additional client-side protection
if (!isAuthenticated) {
  router.push('/login');
  return null;
}

// Role-based access control
if (requireRole && user?.role !== requireRole) {
  router.push('/');
  return null;
}
```

---

## Database Schema & Security

### Firestore Collections

#### Core Collections

1. **`users/{uid}`** - User profiles
   ```typescript
   {
     uid: string;
     email: string;
     firstName: string;
     lastName: string;
     role: 'student' | 'teacher';
     schoolId: string;
     corebinStats?: { binaryFall: { highScore: number }; ... };
   }
   ```

2. **`classes/{classId}`** - Class information
   ```typescript
   {
     className: string;
     subject: 'Computer Science' | 'Geography' | 'Maths';
     classCode: string;
     teacherIds: string[];
     studentUids: string[];
     periods?: Period[];
   }
   ```

3. **`homework/{homeworkId}`** - Homework assignments
   ```typescript
   {
     classId: string;
     teacherId: string;
     title: string;
     instructions?: string;
     tasks: HomeworkTask[];
     dueDate?: Timestamp;
   }
   ```

4. **`studentHomeworks/{id}`** - Student homework progress
   ```typescript
   {
     studentId: string;
     homeworkId: string;
     classId: string;
     status: 'not-started' | 'in-progress' | 'completed';
     progress: { completedTaskIds: string[]; };
   }
   ```

#### Content Collections

5. **`flashcards/{id}`** - Learning flashcards
   ```typescript
   {
     subject: string;
     examBoard: string;
     topic: string;
     subTopic: string;
     term: string;
     definition: string;
     examples: string[];
     hints: string[];
   }
   ```

6. **`puzzles/{id}`** - Coding jigsaw puzzles
   ```typescript
   {
     title: string;
     sectionId: string;
     challengeLevel: number;
     codeSnippet: string;
     initialBlocks: string[];
     solution: string[];
     expectedOutput: string;
   }
   ```

7. **`fillInTheBlanksChallenges/{id}`** - Code completion challenges
   ```typescript
   {
     title: string;
     sectionId: string;
     challengeLevel: number;
     codeParts: (string | null)[];
     solution: string[];
     expectedOutput: string;
   }
   ```

### Security Rules (`firestore.rules`)

#### Role-Based Access Control

```javascript
// Helper functions
function isSignedIn() { return request.auth != null; }
function isTeacher() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher'; }
function isStudent() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student'; }
function isAdmin() { return request.auth != null && request.auth.token.admin == true; }
function isClassTeacher(classId) { return request.auth.uid in get(/databases/$(database)/documents/classes/$(classId)).data.teacherIds; }
```

#### Access Patterns

1. **User Profiles**: Users can read/update their own profile; teachers can read students in their school
2. **Classes**: Teachers manage their classes; students read classes they're in
3. **Homework**: Teachers create/manage homework for their classes; students read their assignments
4. **Content**: All signed-in users can read; only admins can write
5. **Ratings**: Users can only manage their own ratings

---

## Core Features

### 1. Flashcard System

**Location**: `src/components/features/flashcards/`

**Components**:
- `flashcard-client.tsx` - Main controller component
- `flashcard-renderer.tsx` - Card display with flip animation
- `flashcard-controls.tsx` - Navigation and progress controls
- `flashcard-sidebar.tsx` - Filtering and settings panel
- `flashcard-filter-dialog.tsx` - Topic/confidence filtering
- `flashcard-settings-dialog.tsx` - Display preferences
- `flashcard-confidence-dialog.tsx` - Rating interface

**Key Features**:
- **3D Flip Animation**: CSS-based card flipping with perspective
- **Smart Filtering**: By topic, subtopic, and confidence level
- **Progress Tracking**: User confidence ratings saved to Firestore
- **Keyboard Navigation**: Arrow keys and spacebar support
- **Shuffle Mode**: Randomized card order
- **Auto-progression**: Configurable automatic advancement

**Data Flow**:
1. `useFlashcardData()` - Fetches flashcards from Firestore
2. `useFlashcardNavigation()` - Handles card cycling and state
3. `useFlashcardProgress()` - Manages ratings and statistics
4. Cards filtered by topic/confidence and displayed with controls

### 2. Python Challenge System

**Location**: `src/components/features/puzzles/`

#### A. Jigsaw Puzzles (`puzzle-client.tsx`)
- **Drag & Drop**: Powered by @dnd-kit/core
- **Code Blocks**: Draggable code segments to arrange
- **Validation**: Real-time solution checking
- **Hints**: Progressive hint system
- **Auto-completion**: Smart block placement

#### B. Fill-in-the-Blanks (`fill-in-the-blanks-client.tsx`)
- **Interactive Gaps**: Click-to-edit code sections
- **Syntax Highlighting**: Ace Editor integration
- **Dynamic Challenges**: Variable-based problems
- **Input Validation**: Real-time answer checking

**Data Models**:
```typescript
// Jigsaw Puzzle
{
  initialBlocks: string[];  // Scrambled code blocks
  solution: string[];       // Correct order
  expectedOutput: string;   // Program output
  isDynamic: boolean;       // Variable input required
}

// Fill-in-the-Blanks
{
  codeParts: (string | null)[]; // Code with null gaps
  solution: string[];           // Answers for gaps
  expectedOutput: string;       // Expected result
}
```

### 3. Homework Management System

**Location**: `src/components/features/homework/`

#### Teacher Workflow (`HomeworkManagement.tsx`)
1. **Creation Wizard**: Multi-step homework creation
   - `OverviewStep.tsx` - Title, instructions, due date
   - `AddTasksStep.tsx` - Select flashcards/puzzles with filtering
   - `PreviewStep.tsx` - Review and confirm
2. **Progress Monitoring**: Real-time completion tracking
3. **Class Analytics**: Student performance overview

#### Student Workflow (`homework-flash-card-client.tsx`)
1. **Assignment Viewing**: Real-time homework feed
2. **Task Completion**: Interactive task runner
3. **Progress Tracking**: Automatic progress updates

**Task Types**:
- **Flashcard Tasks**: Confidence rating challenges
- **Puzzle Tasks**: Code arrangement/completion
- **Mixed Assignments**: Combined task types

### 4. Seating Plan Generator

**Location**: `src/app/coretools/seating-plan/`

**Core Components**:
- `SeatingPlanTool.tsx` - Main application
- `components/DraggableItem.tsx` - Desk/furniture components
- `components/StudentsPanel.tsx` - Student management
- `components/GroupControl.tsx` - Table grouping tools
- `components/RulesPanel.tsx` - Separation rules

**Hooks**:
- `useSeatingPlan.ts` - Main state management
- `useDragAndDrop.ts` - Drag & drop handling
- `useStudentAssignment.ts` - Auto-assignment algorithm
- `useExport.ts` - Image export functionality

**Key Features**:
- **Drag & Drop Layout**: Visual desk arrangement
- **Auto-Assignment**: Intelligent student placement
- **Separation Rules**: Keep specific students apart
- **Gender Balancing**: Alternate seating by gender
- **Group Management**: Color-coded table groups
- **Export Options**: PNG/JPEG with styling options
- **Responsive Scaling**: Adapts to container size

**Assignment Algorithm**:
1. **Constraint Processing**: Apply separation rules
2. **Preference Sorting**: Fill from front, gender alternating
3. **Conflict Resolution**: Automatic rule satisfaction
4. **Visual Feedback**: Real-time assignment preview

### 5. Gaming Platform (CoreLabs)

**Location**: `src/app/corelabs/`

#### A. Binary Falling Blocks (`binary-game/page.tsx`)
- **Game Mechanics**: Tetris-inspired binary conversion
- **Progressive Difficulty**: Speed increases with level
- **Power-ups**: Bomb items to clear stacks
- **Score Persistence**: High scores saved to user profile

#### B. Denary Conversion (`denary-game/page.tsx`)
- **Binary Input**: Click bits to build binary numbers
- **Time Pressure**: Countdown timer for each challenge
- **Life System**: Multiple chances with visual feedback
- **Special Blocks**: Bonus/life power-ups

#### C. Keyboard Ninja (`keyboard-ninja/page.tsx`)
- **Phaser.js Integration**: Full game engine
- **Dual Modes**: Shortcuts vs. typing practice
- **Difficulty Scaling**: Adaptive speed and complexity
- **Visual Learning**: Color-coded keyboard rows

#### D. Mouse Skills (`mouse-skills/page.tsx`)
- **Multiple Modes**: Classic clicking, tracking, following
- **Precision Training**: Accuracy and speed metrics
- **Fullscreen Support**: Immersive experience
- **Trail Visualization**: Mouse movement tracking

### 6. Admin Content Management

**Location**: `src/app/admin/`

**Content Types**:
- **Flashcards**: CRUD operations with bulk import
- **Puzzles**: Code challenge management
- **Analytics**: Content distribution statistics

**Bulk Import Features**:
- **JSON Upload**: Batch content creation
- **Validation**: Format checking and error reporting
- **Preview**: Review before import
- **Error Handling**: Detailed failure reports

---

## File-by-File Breakdown

### Core Application Files

#### `src/app/layout.tsx`
**Purpose**: Root application layout and provider setup
**Exports**: Default React component
**Key Features**:
- Font configuration (Inter, Lexend)
- Provider nesting (UserProvider, FirestoreMonitorProvider)
- Global layout wrapper (MainLayout)
- Toast notification system
**Dependencies**: 
- Providers: `UserProvider`, `FirestoreMonitorProvider`
- Components: `MainLayout`, `Toaster`
- Fonts: `Inter`, `Lexend` from Google Fonts

#### `src/app/page.tsx`
**Purpose**: Landing page with authentication-aware redirects
**Exports**: Default React component
**Key Features**:
- Welcome screen for new visitors
- Auto-redirect based on user role
- Marketing content for unauthenticated users
- Product showcase (CoreCS, CoreLabs, CoreTools)
**Authentication Flow**:
```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    if (isAdmin) router.replace('/admin');
    else if (user.role === 'teacher') router.replace('/dashboard/teacher');
    else router.replace('/dashboard/student');
  }
}, [user, isAuthenticated, isAdmin]);
```

#### `src/middleware.ts`
**Purpose**: Server-side route protection and authentication
**Exports**: `middleware` function, `config` object
**Protected Routes**:
- `/dashboard/*` - All dashboard pages
- `/admin/*` - Admin panel
- `/account/*` - User account pages
**Cookie Handling**:
```typescript
const sessionCookie = request.cookies.get('session')?.value;
const isAuthenticated = !!sessionCookie;
```

### Authentication System

#### `src/app/api/auth/session/route.ts`
**Purpose**: Session cookie management API
**Exports**: `POST`, `DELETE` handlers
**POST Handler**:
- Verifies Firebase ID token with Admin SDK
- Creates secure session cookie (5-day expiry)
- Returns user data and success status
**DELETE Handler**:
- Clears session cookie
- Handles logout requests
**Security Features**:
- HttpOnly cookies (XSS protection)
- Secure flag in production
- SameSite=Lax (CSRF protection)

#### `src/providers/UserProvider.tsx`
**Purpose**: Global authentication state management
**Exports**: `UserProvider` component, `useAuth` hook
**Key Features**:
- Firebase Auth state listener
- User profile fetching and caching
- Admin claim verification
- Secure logout function
**Context Interface**:
```typescript
interface AuthContextType {
  user: AppUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}
```

#### `src/components/auth/ProtectedRoute.tsx`
**Purpose**: Client-side route protection wrapper
**Exports**: `ProtectedRoute` component
**Props Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'teacher' | 'student';
  redirectTo?: string;
}
```
**Features**:
- Authentication checking
- Role-based access control
- Loading state handling
- Automatic redirects

### Database Layer

#### `src/lib/firebase.ts`
**Purpose**: Client-side Firebase SDK initialization
**Exports**: `app`, `auth`, `db`, `storage`
**Configuration**: Uses `NEXT_PUBLIC_*` environment variables
**Usage**: Imported by all client-side components needing Firebase

#### `src/lib/firebase-admin.ts`
**Purpose**: Server-side Firebase Admin SDK setup
**Exports**: `adminApp`, `adminAuth`, `adminDb`
**Security**: Server-only imports with 'server-only'
**Configuration**: Uses service account credentials
**Error Handling**: Fails fast with helpful error messages

#### `src/lib/types.ts`
**Purpose**: TypeScript type definitions for the entire application
**Exports**: All type definitions used across the platform
**Key Types**:
- `UserProfile` - User account information
- `ClassInfo` - Classroom data structure
- `HomeworkAssignment` - Assignment definitions
- `Flashcard` - Learning card structure
- `Puzzle` - Code challenge definition

#### `firestore.rules`
**Purpose**: Database security rules
**Key Functions**:
- Role-based access control
- Ownership validation
- Admin privilege checking
- Class membership verification
**Security Patterns**:
```javascript
// Users can only read their own profile
allow read: if isSignedIn() && isOwner(userId);

// Teachers manage their classes
allow write: if isSignedIn() && isClassTeacher(resource.data.id);

// Content is read-only except for admins
allow read: if isSignedIn();
allow write: if isAdmin();
```

---

## Component Architecture

### Layout Components (`src/components/layout/`)

#### `main-layout.tsx`
**Purpose**: Application shell with conditional header/footer
**Features**:
- Game page detection (no header/footer for games)
- Responsive layout structure
- Navigation integration

#### `header.tsx`
**Purpose**: Main navigation bar
**Features**:
- User authentication status
- Role-based navigation
- UserNav integration
- Responsive design

#### `footer.tsx`
**Purpose**: Site footer with links and information

### Shared Components (`src/components/shared/`)

#### `UserSearchDialog.tsx`
**Purpose**: User lookup and selection interface
**Used By**: Teacher dashboards, student management
**Features**:
- Real-time search
- Role filtering
- Selection interface

#### `ConfirmationDialog.tsx`
**Purpose**: Reusable confirmation modal
**Props**: Title, description, action handlers
**Usage**: Delete operations, destructive actions

#### `FirestoreStats.tsx`
**Purpose**: Development tool for monitoring database operations
**Features**:
- Read/write counters
- Performance monitoring
- Debug information

### Feature Components

#### Dashboard Components (`src/components/dashboard/`)

**Teacher Components**:
- `ClassCard.tsx` - Class overview cards
- `CreateClassDialog.tsx` - Class creation modal
- `StudentManagement.tsx` - Class roster management
- `JoinRequestPanel.tsx` - Student join request handling
- `WeeklyTimetable.tsx` - Schedule visualization

**Student Components**:
- `JoinClassDialog.tsx` - Class joining interface

---

## Hooks & State Management

### Flashcard Hooks (`src/hooks/flashcard/`)

#### `use-flashcard-data.tsx`
**Purpose**: Flashcard data fetching and management
**Returns**: Flashcards array, loading state, error handling
**Features**:
- Real-time Firestore subscriptions
- Caching for performance
- Filter support

#### `use-flashcard-navigation.tsx`
**Purpose**: Card navigation and display state
**Returns**: Current card, navigation functions, progress tracking
**Features**:
- Keyboard navigation
- Shuffle mode
- Progress calculation

#### `use-flashcard-progress.tsx`
**Purpose**: User progress and rating management
**Returns**: Rating functions, save state, statistics
**Features**:
- Confidence rating storage
- Progress analytics
- Auto-save functionality

### Teacher Hooks (`src/hooks/teacher/`)

#### `use-class-data.ts`
**Purpose**: Single class data management
**Parameters**: `classId`
**Returns**: Class info, students, homework, loading states
**Features**:
- Comprehensive class data fetching
- Real-time updates
- Error handling

#### `use-homework-management.ts`
**Purpose**: Homework CRUD operations
**Returns**: Create, update, delete functions
**Features**:
- Assignment creation
- Progress tracking
- Validation

#### `use-join-requests.ts`
**Purpose**: Student join request management
**Returns**: Requests array, approval/denial functions
**Features**:
- Real-time request monitoring
- Batch operations
- Notification integration

### Shared Hooks (`src/hooks/shared/`)

#### `use-toast.ts`
**Purpose**: Toast notification system
**Returns**: Toast function for displaying messages
**Features**:
- Success/error/warning types
- Auto-dismiss
- Queue management

#### `use-user-search.ts`
**Purpose**: User search functionality
**Returns**: Search function, results, loading state
**Features**:
- Debounced search
- Role filtering
- Pagination support

---

## Deployment & Configuration

### Environment Variables

#### Client-Side (Public)
Required for Firebase client SDK:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

#### Server-Side (Private)
Required for Firebase Admin SDK:
```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=  # Use \n for newlines in Vercel
```

#### AI Configuration
```env
GOOGLE_AI_API_KEY=  # For Genkit integration
```

### Deployment Platforms

#### Vercel (Recommended)
1. **Connect Repository**: Link GitHub repository
2. **Environment Variables**: Add all required variables
3. **Build Settings**: Use default Next.js settings
4. **Domain Configuration**: Set up custom domain
5. **Analytics**: Enable Web Analytics

**Build Configuration**:
```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

#### Firebase Hosting (Alternative)
1. **Initialize Project**: `firebase init hosting`
2. **Build Application**: `npm run build`
3. **Deploy**: `firebase deploy --only hosting`

---

## Development Guide

### Local Setup

#### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Git

#### Installation
```bash
# Clone repository
git clone <repository-url>
cd CoreEDU

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

#### Development Scripts
```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run typecheck    # TypeScript validation
npm run genkit:dev   # AI development server
```

### Code Organization Principles

#### Component Structure
```typescript
// Component file organization
import { /* React imports */ } from 'react';
import { /* UI components */ } from '@/components/ui/';
import { /* Custom hooks */ } from '@/hooks/';
import { /* Types */ } from '@/lib/types';

interface ComponentProps {
  // Props definition
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component implementation
}
```

#### Hook Patterns
```typescript
// Custom hook structure
export function useFeature(param: string) {
  const [state, setState] = useState();
  
  // Effects and logic
  
  return {
    // Exposed state and functions
    data: state,
    loading: isLoading,
    error: error,
    actions: { create, update, delete }
  };
}
```

---

## Troubleshooting

### Common Issues

#### Authentication Problems

**Issue**: "Session cookie not set"
**Solutions**:
1. Verify all environment variables are set
2. Check Firebase service account credentials
3. Ensure HTTPS in production for secure cookies
4. Validate cookie settings in browser dev tools

**Issue**: "Firebase Admin SDK errors"
**Solutions**:
1. Re-download service account JSON
2. Verify project ID matches Firebase console
3. Check private key format (escape newlines for Vercel)

#### Database Access Issues

**Issue**: "Permission denied" in Firestore
**Solutions**:
1. Check Firestore rules in Firebase console
2. Verify user profile exists in `users` collection
3. Confirm user role field is set correctly
4. Test rules in Firebase rules playground

#### Performance Issues

**Issue**: "Slow page loads"
**Solutions**:
1. Analyze bundle with Next.js bundle analyzer
2. Implement caching for frequently accessed data
3. Create Firestore indexes for complex queries
4. Use pagination for large datasets

#### Deployment Issues

**Issue**: "Build failures on Vercel"
**Solutions**:
1. Run `npm run typecheck` locally
2. Verify all environment variables in Vercel dashboard
3. Clear npm cache and reinstall dependencies
4. Check build logs for specific errors

### Debug Tools

#### Development Tools
- **Firestore Monitor**: Real-time database operation tracking
- **React DevTools**: Component hierarchy and state inspection
- **Next.js DevTools**: Performance and bundle analysis

#### Production Monitoring
- **Vercel Analytics**: Performance metrics
- **Firebase Console**: Database usage and errors
- **Browser DevTools**: Network and performance analysis

---

## Conclusion

CoreEDU represents a comprehensive educational platform built with modern web technologies and best practices. The modular architecture allows for easy extension and maintenance, while the robust authentication and database systems ensure security and scalability.

The platform's strength lies in its integration of multiple educational tools under a unified interface, providing value for both educators and students. The combination of interactive learning tools, classroom management features, and gamified experiences creates an engaging educational environment.

For developers working on the platform, this documentation provides the necessary context to understand the system architecture, make modifications, and extend functionality while maintaining the platform's integrity and performance standards.
