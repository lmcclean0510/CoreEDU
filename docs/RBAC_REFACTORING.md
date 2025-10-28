# Role-Based Access Control Refactoring

**Date:** October 28, 2025
**Purpose:** Refactored role-based access from redundant client-side checks to proper server-side protection

---

## Summary

Discovered that the site already had a **better security pattern** in place (server-side layouts) that wasn't being used for CoreTools. Refactored to use the existing pattern instead of adding redundant client-side checks.

---

## What Was Wrong

### Initial Implementation (Redundant)

I initially added **client-side role checking** with useEffect/useAuth:

```typescript
// ❌ REDUNDANT CLIENT-SIDE APPROACH
export default function CoreToolsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <LoadingSpinner />;
  if (user?.role !== 'teacher') return <AccessDenied />;

  return <Content />;
}
```

**Problems:**
- ❌ Client-side (can be bypassed with browser dev tools)
- ❌ Creates loading states and page flashing
- ❌ Redundant with existing server-side patterns
- ❌ Causes extra re-renders
- ❌ Not following the codebase's existing security pattern

---

## What the Site Already Had

### Existing Pattern: Server-Side Layouts

**Files:**
- `/src/app/dashboard/teacher/layout.tsx` - Protects teacher routes
- `/src/app/dashboard/student/layout.tsx` - Protects student routes
- `/src/app/coretools/layout.tsx` - Existed but only checked authentication, not role

**How it works:**
```typescript
// ✅ SERVER-SIDE LAYOUT (secure, fast, follows pattern)
import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isTeacher } from '@/lib/auth/shared';

export default async function TeacherLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isTeacher(user)) redirect('/dashboard');
  return <>{children}</>;
}
```

**Benefits:**
- ✅ Runs on Next.js server (secure, can't be bypassed)
- ✅ No loading states or flashing
- ✅ SEO-friendly
- ✅ Uses existing helper functions (`isTeacher`, `isStudent`)
- ✅ Consistent with rest of codebase

---

## What We Fixed

### Changes Made

**1. Updated `/src/app/coretools/layout.tsx`**

Added the missing teacher role check:

```typescript
// BEFORE
export default async function CoretoolsLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?blocked=/coretools');
  return <>{children}</>;  // ❌ No role check!
}

// AFTER
import { isTeacher } from '@/lib/auth/shared';

export default async function CoretoolsLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?blocked=/coretools');
  if (!isTeacher(user)) redirect('/dashboard');  // ✅ Added role check
  return <>{children}</>;
}
```

**2. Simplified `/src/app/coretools/page.tsx`**

Removed all redundant client-side checks:

```typescript
// BEFORE (59 lines with checks)
export default function CoreToolsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => { /* redirect logic */ }, [user, isLoading, router]);
  if (isLoading) return <LoadingSpinner />;
  if (user?.role !== 'teacher') return <AccessDenied />;

  return <Content />;
}

// AFTER (17 lines, no checks)
export default function CoreToolsPage() {
  // Protected by server-side layout (layout.tsx)
  // Only teachers can reach this page
  return <Content />;
}
```

**3. Simplified `/src/app/coretools/seating-plan/page.tsx`**

Removed all redundant client-side checks:

```typescript
// BEFORE (73 lines with checks)
export default function SeatingPlanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => { /* redirect logic */ }, [user, isLoading, router]);
  if (isLoading) return <LoadingSpinner />;
  if (user?.role !== 'teacher') return <AccessDenied />;

  return <SeatingPlanTool />;
}

// AFTER (29 lines, no checks)
export default function SeatingPlanPage() {
  // Protected by server-side layout (../layout.tsx)
  // Only teachers can reach this page
  return <SeatingPlanTool />;
}
```

**4. Kept Sidebar Changes (Good UX)**

The sidebar role filtering is still there and is good for UX:

```typescript
// src/components/app-layout/AppSidebar.tsx
const navItems: NavItem[] = [
  {
    title: 'CoreTools',
    href: '/coretools',
    icon: Grid3X3,
    roles: ['teacher'], // ✅ Good: Hides from non-teachers
  },
];
```

---

## Security Comparison

### Client-Side Only (Bad)
```
Student tries /coretools/seating-plan
  ↓
✅ Sidebar hidden (good UX)
  ↓
❌ Types URL directly → Page loads → useAuth checks → Redirects
  ↓
Problem: Can be bypassed with dev tools
User sees page flash before redirect
```

### Server-Side (Good) - Our Fix
```
Student tries /coretools/seating-plan
  ↓
✅ Sidebar hidden (good UX)
  ↓
✅ Types URL directly → Server checks layout → Redirects immediately
  ↓
Benefits: Can't be bypassed
No page flashing
Faster redirect
```

---

## Existing Helpers Used

We're now using the **same helper functions** the rest of the codebase uses:

**From `/src/lib/auth/shared.ts`:**
```typescript
export function isTeacher(user) {
  return hasRole(user, 'teacher');
}

export function isStudent(user) {
  return hasRole(user, 'student');
}

export function isAdmin(user) {
  return !!user?.isAdmin;
}
```

**From `/src/lib/auth/server.ts`:**
```typescript
export async function getCurrentUser() {
  // Gets user from session cookie
  // Returns NormalizedUser or null
}
```

These are **already used** in:
- `/src/app/dashboard/teacher/layout.tsx`
- `/src/app/dashboard/student/layout.tsx`
- `/src/app/dashboard/teacher/class/[classId]/create-homework/page.tsx`

---

## What About the ProtectedRoute Component?

**File:** `/src/components/auth/ProtectedRoute.tsx`

**Status:** Dead code, not used anywhere

**Recommendation:** Can be safely deleted

It was a client-side wrapper component for role checking, but:
- Not used in any pages
- Inferior to server-side layouts
- If needed in future, use server-side layouts instead

---

## Benefits of This Refactoring

### Before (Client-Side Checks)
- ❌ 132 lines of redundant code
- ❌ Multiple loading states
- ❌ Page flashing on redirect
- ❌ Can be bypassed
- ❌ Extra re-renders
- ❌ Not following codebase pattern

### After (Server-Side Layouts)
- ✅ 2 lines added to existing layout
- ✅ No loading states
- ✅ Instant server-side redirect
- ✅ Secure, can't be bypassed
- ✅ Better performance
- ✅ Consistent with codebase

### Code Reduction
- **CoreTools page:** 59 lines → 17 lines (42 lines removed)
- **Seating plan page:** 73 lines → 29 lines (44 lines removed)
- **CoreTools layout:** 12 lines → 14 lines (2 lines added)
- **Net change:** -84 lines of code

---

## How Server-Side Layouts Work

### Execution Flow

```
1. User requests /coretools/seating-plan
   ↓
2. Next.js server runs layout.tsx first
   ↓
3. getCurrentUser() reads session cookie
   ↓
4. isTeacher() checks user.role === 'teacher'
   ↓
5. If NOT teacher: redirect('/dashboard') on SERVER
   ↓
6. Browser receives redirect response
   ↓
7. If IS teacher: Layout returns {children}
   ↓
8. page.tsx renders (SeatingPlanTool)
   ↓
9. HTML sent to browser (with content!)
```

**Key point:** Steps 2-5 happen on the **server** before any HTML is sent to the browser.

### Why This Is Secure

- ✅ **Server-side execution** - Code runs on Next.js server, not in browser
- ✅ **Can't be bypassed** - No client-side JavaScript can bypass server checks
- ✅ **Session-based** - Uses httpOnly cookies (can't be read by JS)
- ✅ **Early exit** - Redirects before any page code runs

---

## Pattern for Future Features

When adding role-based features, follow this pattern:

### 1. Create Server-Side Layout

```typescript
// src/app/feature/layout.tsx
import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { isTeacher } from '@/lib/auth/shared'; // or isStudent, isAdmin

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function FeatureLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?blocked=/feature');
  if (!isTeacher(user)) redirect('/dashboard');
  return <>{children}</>;
}
```

### 2. Add to Sidebar Navigation

```typescript
// src/components/app-layout/AppSidebar.tsx
const navItems: NavItem[] = [
  {
    title: 'Feature',
    href: '/feature',
    icon: Icon,
    roles: ['teacher'], // UX: Hide from non-teachers
  },
];
```

### 3. Page Just Renders Content

```typescript
// src/app/feature/page.tsx
export default function FeaturePage() {
  // Protected by server-side layout
  return <Content />;
}
```

**That's it!** No client-side checks needed.

---

## Testing

### Manual Testing Checklist

**As a Student:**
- [ ] CoreTools link hidden in sidebar
- [ ] Visiting `/coretools` → Instant redirect to dashboard
- [ ] Visiting `/coretools/seating-plan` → Instant redirect to dashboard
- [ ] No page flashing or loading states

**As a Teacher:**
- [ ] CoreTools link visible in sidebar
- [ ] Can access `/coretools` page
- [ ] Can access `/coretools/seating-plan`
- [ ] All tools work correctly
- [ ] No unnecessary loading states

**As an Admin:**
- [ ] CoreTools link hidden (admins aren't teachers)
- [ ] Visiting `/coretools` → Redirect to dashboard
- [ ] If admins need access, add `'admin'` to roles array in sidebar

---

## Summary

✅ **Refactored from client-side to server-side protection**
✅ **Now follows the existing codebase pattern**
✅ **Uses existing helper functions** (isTeacher, getCurrentUser)
✅ **More secure** (can't be bypassed)
✅ **Better UX** (no page flashing)
✅ **Less code** (84 lines removed)
✅ **Consistent** with teacher/student dashboard protection

The CoreTools feature is now properly secured using the same pattern that already protects teacher and student dashboards throughout the codebase.
