# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 9002 with Turbopack
- `npm run build` - Build the production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run typecheck` - Run TypeScript type checking

### AI Development (Genkit)
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit with file watching

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + ShadCN/UI components
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with custom user profiles
- **AI**: Google Genkit for AI flows (avatar generation, quiz explanations, hints)
- **Drag & Drop**: dnd-kit for interactive components

### Project Structure
CoreEDU follows a hub-based architecture with three main subject areas:

- **CoreCS** (`/corecs`) - Computer Science content including Python puzzles, binary/hex tools, flashcards
- **CoreLabs** (`/corelabs`) - Skills-based games (binary, denary, keyboard ninja, mouse skills)  
- **CoreTools** (`/coretools`) - Teacher utilities (seating plan generator)

### Key Architectural Patterns

#### Authentication & Authorization
- Global `UserProvider` context provides authentication state via `useAuth()` hook
- `ProtectedRoute` component wraps authenticated pages
- Role-based access: `student`, `teacher`, `admin` (via Firebase Custom Claims)
- User profiles stored in Firestore `users` collection with role field

#### Data Management
- Custom hooks pattern for data fetching (e.g., `useTeacherClasses`, `useFlashcardData`)
- In-memory caching layer (`src/lib/cache.ts`) to reduce redundant Firestore reads
- Type safety enforced through `src/lib/types.ts` definitions

#### Component Organization
- Feature-based component structure under `src/components/features/`
- Shared components in `src/components/shared/`
- Dashboard-specific components separated by user role
- ShadCN/UI base components in `src/components/ui/`

### Database Schema (Firestore)

#### Core Collections
- `users` - User profiles with role-based access
- `classes` - Class information and student/teacher relationships
- `flashcards` - Unified collection for all subjects (filtered by `subject` field)
- `puzzles` - Python coding jigsaw puzzles
- `fillInTheBlanksChallenges` - Python fill-in-the-blanks exercises
- `homework` - Teacher-created assignments
- `studentHomeworks` - Individual student progress on assignments

#### Key Design Principles
- Single `flashcards` collection scales across subjects using `subject` field
- Homework system uses separate collections for assignments vs. student progress
- Class management supports multiple teachers and pending join requests

### AI Integration (Genkit)
- AI flows located in `src/ai/flows/`
- Available flows: avatar generation, quiz explanations, personalized hints
- Development server runs on separate process from main Next.js app

### Important Configuration Notes
- Development server runs on port 9002 (not default 3000)
- TypeScript and ESLint errors are ignored during builds (`next.config.ts`)
- Path alias `@/*` maps to `src/*`
- Firebase config and admin SDK setup in `src/lib/`

### Testing & Deployment
- Firebase hosting configuration in `firebase.json`
- App hosting configuration in `apphosting.yaml`
- Firestore security rules in `firestore.rules`

## Development Guidelines

### Adding New Features
1. Check existing patterns in similar features before implementing
2. Use custom hooks for data fetching and state management
3. Follow the feature-based component organization
4. Ensure proper TypeScript typing using existing type definitions
5. Wrap authenticated pages with `ProtectedRoute`

### Working with Firestore
- Use existing cache layer for frequently accessed data
- Follow established naming conventions in `types.ts`
- Implement proper error handling and loading states
- Use the unified `flashcards` collection pattern for new subjects

### UI Development
- Build on existing ShadCN/UI components
- Follow established color palette and typography patterns
- Use Tailwind classes consistently with the `cn()` utility
- Implement proper responsive design patterns