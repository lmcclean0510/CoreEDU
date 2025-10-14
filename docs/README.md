# CoreEDU Platform Guide

> Comprehensive reference for the CoreEDU learning platform. Use this document to understand the feature surface, data model, and day‑to‑day developer workflows.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture & Stack](#architecture--stack)
4. [Product Surface](#product-surface)
5. [Data & Security Model](#data--security-model)
6. [Authentication & Sessions](#authentication--sessions)
7. [UI & Experience System](#ui--experience-system)
8. [Development Workflow](#development-workflow)
9. [Deployment Notes](#deployment-notes)
10. [Testing & Quality](#testing--quality)
11. [Roadmap & Known Gaps](#roadmap--known-gaps)
12. [Reference Files & Further Reading](#reference-files--further-reading)

---

## Overview

CoreEDU is a role-aware learning environment built with Next.js 15. It serves three primary audiences:

- **Students**: Interactive learning via flashcards, coding puzzles, games, and homework tracking.
- **Teachers**: Class management, homework authoring, and seating-plan tooling.
- **Administrators**: Content management flows for flashcards and coding challenges (subject to enabling admin claims).

Key product areas:

- **CoreCS** – Curriculum-aligned Computer Science content (flashcards, puzzles, concept challenges).
- **CoreLabs** – Skill-building mini-games (binary conversions, typing, mouse precision).
- **CoreTools** – Teacher utilities (seating plan generator, additional tools in progress).
- **Dashboards & Homework** – Role-specific dashboards, homework assignment creation, and completion tracking.
- **Account & Profile** – Personalisation, password changes, and optional AI avatar generation.

---

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm (project uses `package-lock.json`)
- Firebase project (Auth + Firestore + optional Storage)
- Firebase service account credentials for Admin SDK
- (Optional) Google AI Studio key for Genkit avatar generation

### Initial Setup

```bash
git clone <repo-url>
cd CoreEDU
npm install
```

Create `./.env.local` (and `.env` for server actions if desired) with the required settings:

```env
# Firebase client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (escape newlines in the private key)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional – unlock AI avatar generation
GOOGLE_AI_API_KEY=
```

Start the development server (Turbopack on port 9002) and iterate:

```bash
npm run dev
```

Optional auxiliary scripts:

- `npm run lint` – Next.js lint rules
- `npm run typecheck` – Strict TypeScript checks
- `npm run genkit:dev` – Launches the Genkit dev server (only needed when using AI flows)

Populate Firestore collections (`users`, `classes`, `flashcards`, `puzzles`, etc.) before exercising authenticated areas.

---

## Architecture & Stack

### Core Technologies

- **Framework**: Next.js 15 (App Router, React 18, TypeScript, Turbopack)
- **State & Data**: Firebase Auth, Firestore (client SDK + Admin SDK), custom React hooks
- **UI System**: Tailwind CSS, shadcn/ui component library, Lucide icons, Inter & Lexend fonts
- **Games & Interaction**: Custom React games, Phaser (Keyboard Ninja), @dnd-kit for drag-and-drop, html-to-image for exports
- **AI Integration**: Genkit with Google Gemini 2.0 Flash (only the avatar flow is currently active)
- **Security**: Server-side session cookies, middleware rate limiting, hardened Firestore security rules

### High-Level Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   Browser   │ ──► │ Next.js (AppDir)│ ──► │ Firebase Services   │
│ (React 18)  │     │  API routes     │     │ - Auth              │
│             │ ◄── │  Middleware     │ ◄── │ - Firestore         │
└─────────────┘     │  Server actions │     │ - Storage (optional)│
                     └─────────────────┘     └─────────────────────┘
```

- Client components authenticate with Firebase Auth, then swap tokens for a secure session cookie via `/api/auth/session`.
- Middleware attaches security headers, throttles requests, and protects `/dashboard`, `/account`, `/admin`, and `/homework`.
- Server components/actions (e.g., `src/lib/auth/server.ts`) use the `session` cookie plus Firebase Admin to fetch user data securely.

---

## Product Surface

### CoreCS (`src/app/corecs`)

- **Landing (`page.tsx`)** – Module cards powered by `ActivityCard`.
- **Python Challenges (`python/page.tsx`)** – `PuzzlesClient` surfaces drag-and-drop jigsaw puzzles and fill-in-the-blank challenges pulled from Firestore (`puzzles`, `puzzleSections`, `fillInTheBlanks*` collections). Uses `@dnd-kit`, Ace Editor, and real-time validation.
- **Concept Detective (`concept-detective/page.tsx`)** – Scenario-based flashcard quiz that synthesizes distractors and timers. Depends on rich flashcard metadata (`flashcards` collection).
- **Binary & Hex Tools (`binary/page.tsx`, `hex/page.tsx`)** – Number conversion helpers with practice tasks.
- **GCSE Hub (`gcse/`)** – Subject-specific navigation scaffolding (expects flashcard content per topic).

### CoreLabs (`src/app/corelabs`)

- **Binary Game (Binary Fall)** – Arcade-style stacking game; stores high scores in `users.corebinStats.binaryFall`.
- **Denary Game** – Reverse conversion challenge with timers and power-ups.
- **Keyboard Ninja** – Phaser-powered typing/shortcut trainer with dynamic spawning and accessibility-friendly colour coding.
- **Mouse Skills** – Precision and tracking trainer with multiple modes, cursor trails, and adaptive difficulty.
- All games render inside the shared `GameContainer` so the app sidebar/topbar remain consistent.

### CoreTools (`src/app/coretools`)

- **Seating Plan (`seating-plan/`)** – Full-featured classroom layout tool:
  - Drag-and-drop desks, students, and groups.
  - Auto-assignment with separation rules, gender balancing, and conflict resolution (`hooks/useStudentAssignment.ts`).
  - Canvas export via `html-to-image`.
- Additional utilities (grade calculator, attendance, reports) are scaffolded as “Coming Soon” cards.

### Dashboards & Homework

- **Student Dashboard (`src/app/dashboard/student/page.tsx`)**
  - Uses `useSubscriptionManager` to manage Firestore listeners.
  - Displays homework progress, quick links, and onboarding prompts (Join Class dialog).
- **Teacher Dashboard (`src/app/dashboard/teacher/page.tsx`)**
  - Class creation (`CreateClassDialog`), weekly timetable, and join-request moderation with cooldowns.
  - Depends on `useTeacherClasses`, `useJoinRequests`, and class metadata stored in Firestore.
- **Homework Experience**
  - Homework creation flows live under `src/components/features/homework/creation/`.
  - Student attempt UI (`src/app/homework/attempt/[studentHomeworkId]/page.tsx`) orchestrates mixed flashcard/puzzle tasks, tracks progress, and updates status (`studentHomeworks` collection).

### Account & Profile (`src/app/account/page.tsx`)

- Profile editing with Firestore-backed fields (`firstName`, `lastName`, avatar colours).
- Password changes via Firebase Auth `updatePassword`.
- Rewards codes unlock optional features (e.g., AI avatar generator).
- AI Avatar generation calls `generateAvatar` (Genkit + Gemini 2.0) and stores returned image URLs; requires `GOOGLE_AI_API_KEY`.

### Admin Console (`src/app/admin`)

- CRUD tooling for flashcards and puzzles (`useAdminFlashcards`, `useAdminPuzzles`), JSON imports, and lightweight analytics.
- Access is gated by the `isAdmin` flag from custom claims; note that `UserProvider` currently hard-codes `isAdmin` to `false` (see [Known Gaps](#roadmap--known-gaps)).

### Additional Surfaces

- **Landing Page (`src/app/page.tsx`)** – Marketing-style hero, feature list, module highlights, and call-to-action buttons.
- **Help (`src/app/help/page.tsx`)** – Static support cards for documentation, contact, and feedback.
- **Quick Quiz (`src/app/quick-quiz/page.tsx`)** – Placeholder “Coming Soon” screen.
- **Settings (`src/app/settings/page.tsx`)** – Placeholder messaging; preferences not yet implemented.
- **Authentication routes** – Located under `src/app/(auth)/login` and `signup`.

---

## Data & Security Model

### Firestore Collections (see `firestore.rules`)

- `users/{uid}` – Profile data (`role`, `schoolId`, avatar preferences, `corebinStats`, unlocked features). Students and teachers may only mutate constrained fields; admins can full-access.
- `classes/{classId}` – Class metadata (teacher IDs, student UIDs, timetable periods).
- `classJoinRequests/{id}` – Pending join approvals linked to classes and students.
- `homework/{id}` – Assignments (title, due date, tasks array referencing flashcards/puzzles).
- `studentHomeworks/{id}` – Per-student homework status and completed task IDs.
- `flashcards/{id}` – Curriculum-aligned flashcards with definitions, hints, and examples.
- `userFlashcardRatings/{id}` – Per-user confidence ratings and attempt stats.
- `puzzles/{id}` / `puzzleSections/{id}` – Coding jigsaw content.
- `fillInTheBlanksChallenges/{id}` / `fillInTheBlanksSections/{id}` – Code completion exercises.
- `sandbox_items/{id}` – Placeholder for future sandbox content.

### Security Highlights

- Helper functions enforce role checks (`isTeacher`, `isStudent`, `isAdmin`), class membership validation, and email/role validation.
- Strict create/update checks prevent privilege escalation (e.g., students cannot change their role or class assignments).
- List queries validate `request.query` parameters to keep scans narrow.
- Admin actions are reserved for users with the `admin` custom claim.
- `firebase.json` references `storage.rules`, but that file is not present in the repository—add one before deploying Storage.

---

## Authentication & Sessions

- **Client Auth (`src/providers/UserProvider.tsx`)**
  - Subscribes to Firebase Auth, fetches `users/{uid}`, and exposes `useAuth()` with `user`, `isAuthenticated`, and `logout`.
  - `isAdmin` is currently hard-coded to `false`; customise this to read custom claims if admin flows are required.
- **Session Exchange (`src/app/api/auth/session/route.ts`)**
  - Validates ID tokens, applies a 5-attempt/15-minute rate limit, and mints a 5-day `session` cookie (HTTP-only, `SameSite=Lax`).
  - DELETE handler revokes refresh tokens and clears cookies.
- **Middleware (`src/middleware.ts`)**
  - Global rate limiting (100 req/min per IP).
  - Injects strict security headers (CSP, HSTS, XSS protection).
  - Protects `/dashboard`, `/admin`, `/account`, `/homework`, and non-auth API routes.
- **Server Utilities (`src/lib/auth/server.ts`)**
  - `getCurrentUser()` verifies the session cookie via Firebase Admin and hydrates server components with user role info.

---

## UI & Experience System

- **App Layout (`src/components/app-layout`)**
  - `AppLayout` wraps authenticated screens with `AppSidebar` and `AppTopBar`.
  - Sidebar navigation is role-aware (teachers see “My Classes”, students see “My Homework”).
  - Layout is skipped for public/auth routes via an allowlist.
- **Design Language**
  - Tailwind theme configured in `tailwind.config.ts` with CSS variable-driven colours and font families (`--font-inter`, `--font-lexend`).
  - shadcn/ui components live in `src/components/ui`; configuration documented in `components.json`.
  - Iconography from `lucide-react`.
- **Reusable Building Blocks**
  - `ActivityCard` and `ContentSection` provide consistent dashboard and catalog layouts.
  - `GameContainer` standardises game presentation within the main shell (no browser fullscreen).
  - `DueDateBadge`, `UserSearchDialog`, `ConfirmationDialog`, and other shared components reduce duplication.
- **Developer Tooling**
  - `FirestoreMonitorProvider` + `FirestoreStats` overlay (dev-only) tracks Firestore reads/writes per page.
  - `SubscriptionManager` utility (and hook variant) prevents Firestore listener leaks in long-lived components.

---

## Development Workflow

1. **Configure Firebase** – Create a project with Auth (email/password), Firestore, and (optionally) Storage. Download service account credentials.
2. **Seed Data** – Add baseline documents: at minimum `users` (with `role`, `schoolId`), `flashcards`, `puzzles`, and sample `classes`. Without data many pages will appear empty.
3. **Run the App**
   ```bash
   npm run dev
   ```
   - Runs Next.js in development mode on `http://localhost:9002`.
   - The app auto-redirects authenticated users to role-specific dashboards; unauthenticated users see the marketing landing page.
4. **AI Features (optional)**
   - Set `GOOGLE_AI_API_KEY` and run `npm run genkit:dev` if you plan to exercise the avatar generator locally.
   - Other Genkit flows (`generate-personalized-hint`, etc.) are intentionally disabled to avoid paid usage.
5. **Lint / Typecheck**
   ```bash
   npm run lint
   npm run typecheck
   ```
6. **Project Conventions**
   - Path aliases use the `@/` prefix (`tsconfig.json`).
   - Client components start with `"use client";` declarations.
   - Avoid importing `firebase-admin` utilities into client modules—`firebase-admin.ts` is server-only.

---

## Deployment Notes

### Environment Variables

- Supply all Firebase client + Admin variables in hosting providers (Vercel, Firebase Hosting, etc.).
- For `FIREBASE_PRIVATE_KEY`, replace literal newlines with `\n`.
- Provide `GOOGLE_AI_API_KEY` only if AI avatar generation should be live.

### Vercel

1. Connect the GitHub repository.
2. Configure environment variables in the Vercel dashboard.
3. `npm run build` will produce a standard Next.js output; no custom build steps required.
4. Ensure custom domains use HTTPS so cookies marked `secure` work correctly.

### Firebase Hosting / App Hosting

- `firebase.json` already points to `firestore.rules`; run:
  ```bash
  firebase deploy --only hosting
  ```
- To use Firebase App Hosting, update `apphosting.yaml` (currently limits to 1 instance).
- Add a `storage.rules` file or remove the storage block if Storage is unused.
- Remember to upload Firestore indexes (`firestore.indexes.json`) if complex queries require them.

---

## Testing & Quality

- There is **no automated test suite** in this repository (`__tests__`, Jest, Playwright, etc. are absent).
- Consider adding:
  - Unit tests for hooks (`useSubscriptionManager`, `useTeacherClasses`).
  - Integration tests for Firestore-driven flows (using the Firebase emulator suite).
  - End-to-end smoke tests covering login, dashboard redirects, and homework completion.
- Manual QA checklist: authentication, class creation, homework assignment, game score persistence, seating plan export, and admin CRUD (once enabled).

---

## Roadmap & Known Gaps

- **Admin Access** – `UserProvider` sets `isAdmin` to `false`; adjust to read custom claims or explicit profile flags before using the admin console.
- **Placeholder Routes** – Quick Quiz, Settings, and several CoreTools items are marked “Coming Soon”.
- **AI Flows** – Hint-generation flows are stubbed out to avoid paid APIs. Re-enable as needed in `src/ai/flows`.
- **Storage Rules** – `firebase.json` references `storage.rules`, but the file is missing. Add appropriate rules before deploying Storage-backed features (e.g., avatar uploads).
- **Firestore Indexes** – Dynamic `where(..., 'in', ...)` queries may require composite indexes; generate `firestore.indexes.json` via the Firebase CLI.
- **Data Dependencies** – Many pages assume seeded content (flashcards with examples for Concept Detective, puzzle sections, etc.).
- **Logging** – Development consoles output verbose logs (e.g., subscription manager). Trim or guard with environment checks for production.

---

## Reference Files & Further Reading

- `CONSISTENCY_UPDATE.md` – Historical context for UI/UX refactors and game integration.
- `firestore.rules` – Authoritative source for security policies and access patterns.
- `components.json` – shadcn/ui configuration and path aliases.
- `apphosting.yaml` – Firebase App Hosting defaults.
- `src/lib/security/rate-limit.ts` – In-memory rate limiter used by middleware and auth APIs.
- This document – `docs/README.md` (update alongside major feature or architectural changes).

---

Happy building! Reach out to the CoreEDU maintainers before introducing breaking schema changes or enabling new paid services.
