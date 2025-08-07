# CoreEDU: Comprehensive Code & Site Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Site Architecture & Navigation](#site-architecture--navigation)
4. [Feature Documentation](#feature-documentation)
5. [Component Architecture](#component-architecture)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization](#authentication--authorization)
8. [AI Integration](#ai-integration)
9. [Development Guide](#development-guide)
10. [Deployment & Configuration](#deployment--configuration)

## Project Overview

CoreEDU is a sophisticated educational platform built with Next.js 15 and Firebase, designed to revolutionize computer science education through interactive learning experiences, comprehensive class management, and innovative teaching tools.

### Core Product Areas
- **CoreCS**: Computer Science curriculum with GCSE content, Python challenges, and interactive tools
- **CoreLabs**: Skills-based games and training exercises for fundamental computing concepts
- **CoreTools**: Professional teacher utilities including seating plan generators and analytics

### User Roles & Capabilities
- **Students**: Access learning content, complete assignments, track progress, join classes
- **Teachers**: Manage classes, create homework, monitor student progress, access teaching tools
- **Administrators**: Full content management, user administration, system analytics

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript 5+ with strict mode
- **UI Framework**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.1 + ShadCN/UI component library
- **Drag & Drop**: @dnd-kit for interactive experiences
- **Game Engine**: Phaser.js 3.80.1 for educational games
- **Code Editor**: Ace Editor with React integration

### Backend & Services
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth with custom claims
- **File Storage**: Firebase Storage
- **AI Services**: Google Genkit 1.13.0 with Gemini 2.0 Flash
- **Hosting**: Firebase Hosting with App Hosting

### Development Tools
- **Build Tool**: Next.js with Turbopack
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint with Next.js config
- **Package Manager**: npm with lock file
- **Development Server**: Custom port 9002

## Site Architecture & Navigation

### Public Routes (No Authentication Required)
```
/ - Landing page with product overview
├── /login - User authentication with role-based redirects
├── /signup - Account creation with student/teacher selection
├── /corecs - Computer Science hub overview
│   ├── /gcse - GCSE Computer Science curriculum
│   ├── /python - Python programming challenges
│   ├── /binary - Binary conversion tools
│   ├── /hex - Hexadecimal conversion exercises
│   └── /concept-detective - Concept recognition game
├── /corelabs - Skills & games hub
│   ├── /binary-game - Binary Fall interactive game
│   ├── /denary-game - Binary Builder challenge
│   ├── /mouse-skills - Mouse accuracy training
│   └── /keyboard-ninja - Keyboard shortcut mastery
└── /coretools - Teacher utilities overview
    └── /seating-plan - Classroom layout generator
```

### Protected Routes (Authentication Required)
```
/dashboard
├── /student - Student learning dashboard
└── /teacher - Teacher management dashboard
    ├── /class/[classId] - Individual class management
    ├── /class/[classId]/create-homework - Homework creation wizard
    └── /leaderboard/[classId] - Class performance analytics

/admin - Content management system (Admin only)

/account - User profile and settings

/homework/attempt/[studentHomeworkId] - Student homework interface

Protected Content Access:
├── /corecs/gcse/flashcards - Interactive flashcard system
├── /corecs/python/fill-in-the-blanks/[id] - Coding challenges
└── /corecs/python/jigsaw/[id] - Code arrangement puzzles
```

### API Routes
```
/api/auth/session - Session management (POST/DELETE)
```

## Feature Documentation

### 1. Authentication & Session Management

**Implementation**: `src/providers/UserProvider.tsx` + `src/middleware.ts`

**Key Features**:
- Firebase Authentication with email/password
- Role-based access control (Student, Teacher, Admin)
- HTTP-only cookie sessions for security
- Automatic token refresh and session management
- Protected route middleware with role verification

**Authentication Flow**:
1. User submits credentials → Firebase Auth
2. Custom claims added to token (role, school)
3. Session cookie created with ID token
4. Middleware validates token on protected routes
5. Context provides user state globally

**Files**:
- `src/providers/UserProvider.tsx` - Global auth context
- `src/middleware.ts` - Route protection and redirects
- `src/app/api/auth/session/route.ts` - Server-side session handling
- `src/components/auth/ProtectedRoute.tsx` - Client-side route protection

### 2. Class Management System

**Implementation**: `src/hooks/teacher/` + `src/components/dashboard/teacher/`

**Key Features**:
- Class creation with unique join codes
- Student join request workflow with approval system
- Weekly timetable management with period scheduling
- Bulk student operations and individual management
- Real-time class updates and notifications

**Class Creation Process**:
1. Teacher creates class with basic info
2. System generates unique 6-digit join code
3. Students request to join using class code
4. Teacher approves/denies join requests
5. Approved students gain access to class content

**Data Flow**:
```
Teacher Input → useClassManagement → Firestore → Real-time Updates → Student Dashboard
```

**Key Files**:
- `src/hooks/teacher/use-teacher-classes.ts` - Class data fetching
- `src/hooks/teacher/use-class-management.ts` - Class CRUD operations
- `src/hooks/teacher/use-join-requests.ts` - Join request handling
- `src/components/dashboard/teacher/ClassCard.tsx` - Class overview interface

### 3. Homework Management System

**Implementation**: Multi-step creation wizard with task selection

**Key Features**:
- 3-step homework creation process (Overview → Tasks → Preview)
- Mixed task types (Flashcards + Coding Puzzles)
- Optional due date enforcement
- Individual student progress tracking
- Automatic assignment distribution

**Creation Workflow**:
1. **Overview Step**: Basic homework details and due date
2. **Task Selection**: Browse and filter available content
3. **Preview Step**: Review and confirm assignment
4. **Distribution**: Auto-create individual student assignments

**Progress Tracking**:
- Real-time completion status per student
- Task-level progress indicators
- Completion timestamps and analytics
- Teacher dashboard integration

**Key Files**:
- `src/hooks/homework/use-homework-creation.ts` - Multi-step form state
- `src/components/features/homework/creation/` - Wizard components
- `src/hooks/teacher/use-homework-management.ts` - Assignment lifecycle
- `src/app/homework/attempt/[studentHomeworkId]/page.tsx` - Student interface

### 4. Interactive Flashcard System

**Implementation**: Spaced repetition with confidence tracking

**Key Features**:
- Subject → Topic → SubTopic hierarchical organization
- 3-level confidence rating system (Red/Amber/Green)
- Advanced filtering by topic, subtopic, and confidence level
- Progress tracking with performance analytics
- Customizable display settings (simple vs. detailed definitions)

**Learning Algorithm**:
- Cards cycle based on confidence ratings
- Lower confidence cards appear more frequently
- Progress tracked per user per card
- Performance analytics drive adaptive sequencing

**Component Architecture**:
```
FlashcardClient (Controller)
├── FlashcardRenderer (Display)
├── FlashcardControls (Navigation)
├── FlashcardSidebar (Progress)
├── FlashcardSettingsDialog (Configuration)
└── FlashcardFilterDialog (Content filtering)
```

**Key Files**:
- `src/components/features/flashcards/flashcard-client.tsx` - Main controller
- `src/hooks/flashcard/use-flashcard-data.tsx` - Data management
- `src/hooks/flashcard/use-flashcard-progress.tsx` - Progress tracking
- `src/hooks/flashcard/use-flashcard-navigation.tsx` - Card sequencing

### 5. Interactive Coding System

**Implementation**: Drag-and-drop with real-time validation

**Puzzle Types**:

**A. Jigsaw Puzzles** (`puzzle-client.tsx`):
- Drag-and-drop code block arrangement
- Real-time syntax validation
- Expected output comparison
- Progressive difficulty levels

**B. Fill-in-the-Blanks** (`fill-in-the-blanks-client.tsx`):
- Code completion exercises
- Multiple choice and text input options
- Contextual hints and explanations
- Immediate feedback on submissions

**AI Integration** (Currently disabled):
- Personalized hint generation
- Explanation of coding concepts
- Adaptive difficulty adjustment

**Key Files**:
- `src/components/features/puzzles/puzzle-client.tsx` - Jigsaw interface
- `src/components/features/puzzles/fill-in-the-blanks-client.tsx` - Fill-in interface
- `src/components/features/puzzles/puzzles-client.tsx` - Puzzle browser

### 6. Gaming & Skills Laboratory

**Implementation**: Phaser.js-based interactive experiences

**Game Portfolio**:

**Binary Fall** (`/corelabs/binary-game`):
- Falling object game with binary conversion challenges
- Real-time score tracking and leaderboards
- Progressive difficulty with speed increases
- Visual feedback and celebration animations

**Binary Builder** (`/corelabs/denary-game`):
- Construction-themed binary building game
- Drag-and-drop binary digit placement
- Visual representation of binary values
- Achievement system with milestone rewards

**Mouse Skills** (`/corelabs/mouse-skills`):
- Precision clicking and dragging exercises
- Accuracy and speed measurement
- Progress tracking over time
- Adaptive difficulty based on performance

**Keyboard Ninja** (`/corelabs/keyboard-ninja`):
- Keyboard shortcut memorization game
- Multiple software environments (VS Code, Photoshop, etc.)
- Typing speed and accuracy metrics
- Competitive leaderboards

**Performance Tracking**:
- Individual high scores per game
- Progress analytics and improvement trends
- Class-wide leaderboards for teachers
- Achievement badges and milestone rewards

### 7. Admin Content Management

**Implementation**: Full CRUD interface with bulk operations

**Content Types Managed**:
- **Flashcards**: Subject-based educational content
- **Puzzles**: Interactive coding challenges
- **Fill-in-the-Blanks**: Code completion exercises
- **User Management**: Student and teacher accounts

**Key Features**:
- **Bulk Import**: JSON-based content upload with validation
- **Advanced Search**: Multi-field content filtering
- **Edit History**: Version control with rollback capabilities
- **Analytics Dashboard**: Usage statistics and performance metrics
- **Content Validation**: Automated quality checks

**Bulk Import Process**:
1. JSON file upload or paste
2. Schema validation and error reporting
3. Preview of changes before commit
4. Batch creation with progress tracking
5. Success/failure reporting per item

**Key Files**:
- `src/app/admin/page.tsx` - Main admin dashboard
- `src/app/admin/components/` - Admin-specific UI components
- `src/app/admin/hooks/` - Admin data management hooks

### 8. Seating Plan Generator

**Implementation**: Advanced drag-and-drop with constraint solving

**Key Features**:
- **Multiple Layouts**: Traditional rows, groups, U-shape, etc.
- **Student Assignment**: Automatic and manual placement options
- **Conflict Resolution**: Separation rules for problematic combinations
- **Export Options**: PDF generation and image export
- **Accessibility**: Screen reader support and keyboard navigation

**Constraint System**:
- Define students who cannot sit together
- Specify required separations (distance-based)
- Randomization with constraint satisfaction
- Manual override capabilities

**Export Capabilities**:
- High-resolution PNG export
- PDF generation with class information
- Print-optimized layouts
- Multiple format options

**Key Files**:
- `src/app/coretools/seating-plan/` - Complete feature directory
- `src/app/coretools/seating-plan/hooks/` - State management
- `src/app/coretools/seating-plan/components/` - UI components
- `src/app/coretools/seating-plan/utils/` - Calculation algorithms

## Component Architecture

### Design System Foundation

**Component Library**: ShadCN/UI with Radix UI primitives
- **Atomic Components**: Button, Input, Card, Dialog, etc.
- **Composed Components**: Forms, Navigation, Data Tables
- **Feature Components**: Domain-specific functionality
- **Layout Components**: Page structure and responsive grids

### Component Hierarchy

```
Application Root
├── UserProvider (Global authentication state)
├── FirestoreMonitorProvider (Development performance tracking)
├── MainLayout (Application shell)
│   ├── Header (Dynamic branding and navigation)
│   ├── Main Content Area (Route-specific content)
│   └── Footer (Contextual footer content)
└── Toaster (Global notification system)
```

### Component Organization Structure

```
src/components/
├── ui/ - Base ShadCN components (25+ components)
│   ├── button.tsx, card.tsx, dialog.tsx
│   ├── form.tsx, input.tsx, select.tsx
│   └── table.tsx, tabs.tsx, toast.tsx
├── shared/ - Cross-feature reusable components
│   ├── ConfirmationDialog.tsx
│   ├── UserListItem.tsx
│   ├── UserSearchDialog.tsx
│   └── user-nav.tsx
├── layout/ - Application structure
│   ├── header.tsx, footer.tsx
│   └── main-layout.tsx
├── auth/ - Authentication components
│   └── ProtectedRoute.tsx
├── dashboard/ - Role-specific interfaces
│   ├── student/ - Student dashboard components
│   └── teacher/ - Teacher dashboard components
└── features/ - Feature-specific components
    ├── flashcards/ - Flashcard system components
    ├── homework/ - Homework management components
    ├── games/ - Gaming interface components
    └── puzzles/ - Interactive coding components
```

### State Management Patterns

**Global State**:
- React Context for authentication and user preferences
- Custom hooks for feature-specific state management
- Firestore real-time listeners for live data updates

**Local State**:
- Component-level state for UI interactions
- Form state management with validation
- Loading and error states for async operations

**Caching Strategy**:
- 10-minute memory cache for frequently accessed data
- Optimistic updates with rollback on failure
- Strategic cache invalidation on data mutations

## Database Schema

### Firestore Collections Overview

#### Core User Data
```typescript
// users/{userId}
{
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
  schoolId: string;
  corebinStats?: {
    binaryFall: { highScore: number };
    binaryBuilder: { highScore: number };
  };
}
```

#### Class Management
```typescript
// classes/{classId}
{
  id: string;
  className: string;
  subject: 'Computer Science' | 'Geography' | 'Maths';
  classCode: string; // 6-digit unique code
  teacherIds: string[];
  studentUids: string[];
  createdAt: Timestamp;
  periods?: Period[]; // Weekly timetable
}

// classJoinRequests/{requestId}
{
  id: string;
  classId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: Timestamp;
  studentInfo: {
    name: string;
    email: string;
  };
}
```

#### Homework System
```typescript
// homework/{homeworkId}
{
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  instructions?: string;
  tasks: HomeworkTask[];
  createdAt: Timestamp;
  dueDate?: Timestamp;
}

// studentHomeworks/{studentHomeworkId}
{
  id: string;
  studentId: string;
  homeworkId: string;
  classId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: Timestamp;
  progress: {
    completedTaskIds: string[];
  };
}
```

#### Educational Content
```typescript
// flashcards/{flashcardId} - Unified collection for all subjects
{
  id: string;
  subject: string; // Enables multi-subject scaling
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
}

// puzzles/{puzzleId}
{
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
}

// fillInTheBlanksChallenges/{challengeId}
{
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
}
```

#### Progress Tracking
```typescript
// userFlashcardRatings/{ratingId}
{
  id: string;
  userId: string;
  flashcardId: string;
  confidence?: 1 | 2 | 3 | null;
  correct?: number;
  incorrect?: number;
  totalAttempts?: number;
  lastUpdated: Timestamp;
}
```

### Security Rules Highlights

**Rule-based Access Control**:
- Students can only read their own data and class content
- Teachers can manage their own classes and students
- Admins have full content management access
- School-based data isolation for multi-tenant support

**Performance Optimizations**:
- Compound indexes for complex queries
- Efficient pagination for large datasets
- Strategic denormalization for read performance
- Query limit enforcement to prevent abuse

## Authentication & Authorization

### Authentication Flow Architecture

```
User Login Attempt
├── Firebase Authentication (Email/Password)
├── Custom Claims Addition (Role, School, Permissions)
├── ID Token Generation with Claims
├── HTTP-Only Session Cookie Creation
├── Middleware Route Validation
└── Context Provider State Management
```

### Role-Based Access Control

**Student Permissions**:
- Access assigned homework and learning content
- View personal progress and analytics
- Join classes with valid class codes
- Submit homework and track completion

**Teacher Permissions**:
- Create and manage classes
- Assign homework to students
- View student progress and analytics
- Access teaching tools and utilities
- Manage class membership and join requests

**Admin Permissions**:
- Full content management (CRUD operations)
- User account administration
- System analytics and monitoring
- Bulk content operations and imports

### Security Implementation

**Session Management**:
- HTTP-only cookies prevent XSS attacks
- Secure flag ensures HTTPS-only transmission
- Automatic token refresh prevents session expiry
- Secure logout clears all session data

**Route Protection**:
- Middleware validates tokens on every request
- Role-based redirects to appropriate dashboards
- Protected API routes validate user permissions
- Client-side route guards prevent unauthorized access

## AI Integration

### Current AI Infrastructure

**Framework**: Google Genkit 1.13.0 with Gemini 2.0 Flash
**Status**: Partially implemented but disabled due to billing requirements

### AI Flows Architecture
```
src/ai/
├── genkit.ts - Core AI service configuration
├── dev.ts - Development server setup
└── flows/ - Individual AI capabilities
    ├── generate-avatar.ts - Profile picture generation
    ├── explain-quiz-answer.ts - Educational explanations
    ├── generate-personalized-hint.ts - Adaptive learning hints
    └── generate-fill-in-the-blanks-hint.ts - Code completion assistance
```

### Implemented Features (Disabled)

**Avatar Generation**:
- Personalized profile pictures based on user preferences
- Multiple style options and customization parameters
- Integration with user profile management

**Educational AI**:
- Quiz answer explanations with step-by-step breakdowns
- Personalized learning hints based on user progress
- Code completion assistance for programming exercises

**Adaptive Learning** (Planned):
- Difficulty adjustment based on performance analytics
- Personalized learning path recommendations
- Intelligent content suggestion algorithms

### AI Integration Points

**Future Capabilities**:
- Automated content generation for flashcards and puzzles
- Natural language processing for question answering
- Performance analysis and learning insights
- Adaptive assessment and feedback systems

## Project Structure & File Dependencies

### High-Level Architecture

The CoreEDU application follows a well-organized Next.js architecture with clear separation of concerns and consistent patterns for data management:

```
Next.js App Router
├── Middleware (authentication & route protection)
├── Layout (providers + UI shell)
│   ├── UserProvider (global authentication state)
│   ├── FirestoreMonitorProvider (performance monitoring)
│   └── MainLayout (header/footer structure)
├── Pages (feature-specific routes)
├── Components (organized by feature/role)
├── Hooks (data fetching + state management)
├── Utils (types, cache, utilities)
└── AI (Genkit flows - currently disabled)
```

### Directory Structure & Dependencies

```
CoreEDU/
├── src/
│   ├── app/ - Next.js App Router pages and API routes
│   │   ├── layout.tsx - Root application bootstrap
│   │   ├── (auth)/ - Authentication pages (login, signup)
│   │   ├── dashboard/ - Role-specific dashboards
│   │   ├── admin/ - Content management system
│   │   ├── corecs/ - Computer Science learning hub
│   │   ├── corelabs/ - Skills-based games
│   │   ├── coretools/ - Teacher utilities
│   │   └── api/ - Server-side API endpoints
│   ├── components/ - Reusable UI components
│   │   ├── ui/ - ShadCN base components (25+ components)
│   │   ├── shared/ - Cross-feature reusable components
│   │   ├── layout/ - Application structure (header, footer)
│   │   ├── auth/ - Authentication components
│   │   ├── dashboard/ - Role-specific interfaces
│   │   └── features/ - Feature-specific components
│   ├── hooks/ - Custom React hooks for data management
│   │   ├── flashcard/ - Flashcard system hooks
│   │   ├── homework/ - Homework management hooks
│   │   ├── teacher/ - Teacher-specific data hooks
│   │   └── shared/ - Utility hooks (toast, monitoring, search)
│   ├── lib/ - Core utility functions and configurations
│   │   ├── firebase.ts - Firebase client configuration
│   │   ├── firebase-admin.ts - Server-side Firebase Admin
│   │   ├── types.ts - System-wide TypeScript definitions
│   │   ├── cache.ts - Performance optimization layer
│   │   ├── utils.ts - CSS class merging utilities
│   │   └── date-utils.ts - Date formatting utilities
│   ├── providers/ - React context providers
│   │   ├── UserProvider.tsx - Global authentication state
│   │   └── FirestoreMonitorProvider.tsx - Database monitoring
│   ├── ai/ - AI integration (currently disabled)
│   │   ├── genkit.ts - AI service configuration
│   │   └── flows/ - Individual AI capabilities
│   └── middleware.ts - Route protection middleware
├── docs/ - Project documentation
├── public/ - Static assets
├── firebase.json - Firebase configuration
├── firestore.rules - Database security rules
├── next.config.ts - Next.js configuration
├── tailwind.config.ts - Tailwind CSS configuration
└── tsconfig.json - TypeScript configuration
```

### Key File Dependencies & Import Relationships

#### 1. Application Bootstrap Chain
```
layout.tsx (root)
├── Imports: globals.css, providers, layout components
├── Sets up: UserProvider → FirestoreMonitorProvider → MainLayout
└── Provides: Global font configuration, toast system

UserProvider.tsx
├── Imports: Firebase Auth, Firestore, cache system, types
├── Provides: useAuth() hook globally
└── Used by: All authenticated components, ProtectedRoute

MainLayout.tsx
├── Imports: Header, Footer components, Next.js navigation
├── Logic: Conditionally renders header/footer (games excluded)
└── Used by: All pages for consistent layout
```

#### 2. Authentication & Security Flow
```
middleware.ts (standalone)
├── Purpose: Route protection and authentication checks
├── Dependencies: Next.js server utilities only
└── Protects: Admin pages, dashboards, protected content

ProtectedRoute.tsx
├── Imports: useAuth hook, Next.js router
├── Purpose: Client-side route protection
└── Wraps: Admin pages, dashboard pages, protected features
```

#### 3. Database Integration Pattern
```
firebase.ts (central config)
├── Imports: Firebase SDK modules
├── Exports: auth, db, storage instances
└── Used by: All components needing Firebase services

Data Flow Pattern:
Component → Custom Hook → Firebase/Cache → UI Update

Example Hook Dependencies:
useTeacherClasses.ts
├── useAuth() - Authentication context
├── db - Firebase Firestore instance
├── dataCache - Performance caching layer
├── useToast() - Error handling
└── ClassInfo types - Type safety
```

#### 4. Component Architecture Patterns
```
All Components Import Pattern:
├── React/Next.js - Core framework
├── UI Components - ShadCN/UI primitives
├── Icons - Lucide React icons
├── Styling - cn() utility for class merging
├── Types - Relevant TypeScript definitions
└── Data Hooks - Feature-specific data management

Header Component Example:
├── Multiple ShadCN components (Button, Sheet, etc.)
├── Lucide icons for UI elements
├── Next.js Link and usePathname for navigation
├── useAuth hook for authentication state
└── cn utility for responsive styling
```

#### 5. Utility System Dependencies
```
utils.ts (CSS utilities)
├── Imports: clsx, tailwind-merge
├── Exports: cn() function for class merging
└── Used by: Every styled component

types.ts (Type definitions)
├── No imports: Pure TypeScript types
├── Defines: UserProfile, ClassInfo, Flashcard, etc.
└── Used by: All data-handling components

cache.ts (Performance layer)
├── No imports: Standalone caching class
├── Features: Memory + localStorage with TTL
└── Used by: UserProvider, all data hooks
```

#### 6. Feature-Specific Dependencies

**Flashcard System:**
```
flashcard-client.tsx (main controller)
├── flashcard-renderer.tsx - Display component
├── flashcard-controls.tsx - Navigation component
├── flashcard-sidebar.tsx - Progress tracking
├── use-flashcard-data.tsx - Data management hook
└── use-flashcard-progress.tsx - Progress tracking hook
```

**Homework System:**
```
HomeworkCreationLayout.tsx (wizard controller)
├── AddTasksStep.tsx - Task selection step
├── OverviewStep.tsx - Basic details step
├── PreviewStep.tsx - Final review step
├── use-homework-creation.ts - Multi-step form state
└── use-homework-management.ts - Assignment lifecycle
```

### Critical Dependency Relationships

#### Must-Have Files for System Function:
1. **`layout.tsx`** - Application bootstrap and provider setup
2. **`UserProvider.tsx`** - Global authentication state management
3. **`firebase.ts`** - Database connection configuration
4. **`types.ts`** - System-wide type definitions
5. **`cache.ts`** - Performance optimization layer
6. **`ProtectedRoute.tsx`** - Security boundary component
7. **`middleware.ts`** - Server-side route protection

#### Common Import Patterns:
- **Authentication**: Every protected component imports `useAuth()`
- **Styling**: Every styled component imports `cn()` utility
- **Database**: Data hooks import Firebase + cache + types
- **UI**: Components import ShadCN components + Lucide icons
- **Routing**: Components use Next.js navigation hooks (`useRouter`, `usePathname`)

## Development Guide

### Getting Started

**Prerequisites**:
- Node.js 18+ with npm
- Firebase CLI for deployment
- Git for version control

**Installation**:
```bash
git clone [repository-url]
cd CoreEDU
npm install
```

**Development Commands**:
```bash
npm run dev          # Start development server (port 9002)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
npm run typecheck    # TypeScript type checking

# AI Development (when enabled)
npm run genkit:dev   # Start Genkit development server
npm run genkit:watch # Start Genkit with file watching
```

### Development Guidelines

**Code Standards**:
- TypeScript strict mode for type safety
- ESLint configuration for code quality
- Consistent component naming conventions
- Comprehensive error handling and loading states

**Feature Development Process**:
1. Create feature branch from main
2. Implement components with TypeScript
3. Add custom hooks for state management
4. Implement Firestore integration
5. Add proper error handling and loading states
6. Test functionality across user roles
7. Create pull request with detailed description

**Database Best Practices**:
- Use existing type definitions from `src/lib/types.ts`
- Implement proper security rules for new collections
- Use compound indexes for complex queries
- Cache frequently accessed data appropriately

## Deployment & Configuration

### Firebase Configuration

**Services Used**:
- **Firestore**: NoSQL database with real-time updates
- **Authentication**: User management with custom claims
- **Hosting**: Static site hosting with CDN
- **App Hosting**: Server-side rendering support

**Configuration Files**:
- `firebase.json` - Hosting and service configuration
- `firestore.rules` - Database security rules
- `apphosting.yaml` - App hosting configuration

### Environment Variables

**Required Variables**:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account-email
FIREBASE_PRIVATE_KEY=service-account-private-key
NEXT_PUBLIC_FIREBASE_CONFIG=firebase-client-config
```

### Build Configuration

**Next.js Configuration** (`next.config.ts`):
- TypeScript and ESLint errors ignored during builds (for development speed)
- Image optimization for external domains (placehold.co, robohash.org)
- Custom port configuration (9002)

**Performance Optimizations**:
- Turbopack for faster development builds
- Static generation where possible
- Automatic code splitting by route
- Image optimization and lazy loading

### Monitoring & Analytics

**Built-in Monitoring**:
- Firestore operation tracking for performance analysis
- Real-time connection status monitoring
- Error boundary implementation for graceful failures
- User activity analytics for feature usage

**Development Tools**:
- Firestore Monitor Provider for debugging database operations
- Console logging for authentication state changes
- Performance metrics for component render times
- Network request monitoring for API calls

---

*This documentation provides a comprehensive overview of the CoreEDU platform's architecture, features, and implementation details. For specific implementation questions or contribution guidelines, please refer to the individual component documentation or contact the development team.*