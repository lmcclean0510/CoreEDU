# Role-Based Access Control (RBAC) Guide

**Date:** October 28, 2025
**Purpose:** Comprehensive guide for implementing role-based access control in CoreEDU

---

## Overview

CoreEDU implements a **three-tier role-based access control system**:
- **Students** - Can access learning content, homework, and games
- **Teachers** - Have student access + classroom management tools
- **Admins** - Have full access to everything including content management

---

## Example Implementation: Seating Plan Tool (Teachers Only)

The seating plan tool has been restricted to teachers only using a **3-layer security approach**:

### Layer 1: Navigation Hiding (UX Level)

**File:** `/src/components/app-layout/AppSidebar.tsx`

**What it does:** Hides the "CoreTools" link from the sidebar for non-teachers

```typescript
const navItems: NavItem[] = [
  // ... other items
  {
    title: 'CoreTools',
    href: '/coretools',
    icon: Grid3X3,
    roles: ['teacher'], // Only teachers see this in navigation
  },
];
```

**How it works:**
- Each navigation item can have an optional `roles` array
- The `shouldShowItem()` function checks if current user's role matches
- Non-teachers won't see the link at all

**Benefits:**
- Clean UX - students don't see tools they can't use
- Reduces confusion
- Still allows direct URL access for testing (blocked by Layer 2 & 3)

---

### Layer 2: Page-Level Protection (Redirect)

**File:** `/src/app/coretools/page.tsx`

**What it does:** Redirects non-teachers who visit `/coretools` to their dashboard

```typescript
export default function CoreToolsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect non-teachers to dashboard
  useEffect(() => {
    if (!isLoading && user && user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show access denied if not a teacher
  if (user && user.role !== 'teacher') {
    return <AccessDeniedAlert />;
  }

  // Render page for teachers
  return <CoreToolsContent />;
}
```

**How it works:**
1. Check user authentication and role
2. If not loading and not a teacher → redirect to dashboard
3. If somehow not redirected (race condition) → show access denied alert
4. Only teachers see the actual page content

**Benefits:**
- Catches users who try to access via direct URL
- Friendly error message before redirect
- Automatic redirect improves UX

---

### Layer 3: Route-Level Protection (Deepest Level)

**File:** `/src/app/coretools/seating-plan/page.tsx`

**What it does:** Protects the specific tool page even if user bypasses Layer 2

```typescript
export default function SeatingPlanPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect non-teachers to dashboard
  useEffect(() => {
    if (!isLoading && user && user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  // Access denied
  if (user && user.role !== 'teacher') {
    return (
      <AccessDeniedAlert
        message="The Seating Plan tool is only available to teachers."
      />
    );
  }

  // Only teachers reach this point
  return <SeatingPlanTool />;
}
```

**Benefits:**
- **Defense in depth** - multiple layers of protection
- Even if someone manipulates client code, they can't access the tool
- Firestore security rules (Layer 4, not shown) prevent data access

---

## The Complete Security Stack

```
User tries to access Seating Plan Tool
  ↓
LAYER 1: Navigation Check
  ├─ Teacher? → Show "CoreTools" in sidebar
  └─ Student/Admin? → Hide "CoreTools" from sidebar
  ↓
LAYER 2: Page List Check (/coretools)
  ├─ Teacher? → Show list of tools
  └─ Student/Admin? → Redirect + Access Denied
  ↓
LAYER 3: Route Check (/coretools/seating-plan)
  ├─ Teacher? → Load SeatingPlanTool
  └─ Student/Admin? → Redirect + Access Denied
  ↓
LAYER 4: Firestore Rules (not in this document)
  ├─ Teacher? → Can read/write seating plans
  └─ Student/Admin? → Firestore returns permission denied
```

---

## How to Apply This Pattern to Other Features

### Example: Admin-Only Content Management

**Step 1: Update Sidebar Navigation**

```typescript
// src/components/app-layout/AppSidebar.tsx
const navItems: NavItem[] = [
  {
    title: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    roles: ['admin'], // Only admins see this
  },
];
```

**Step 2: Protect the Page**

```typescript
// src/app/admin/page.tsx
"use client";

import { useAuth } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) return <LoadingSpinner />;

  if (!isAdmin) {
    return <AccessDeniedAlert message="Admin access required" />;
  }

  return <AdminDashboard />;
}
```

**Step 3: Add Firestore Rules** (if applicable)

```javascript
// firestore.rules
match /adminSettings/{document} {
  allow read, write: if request.auth.token.admin == true;
}
```

---

### Example: Teacher-Only Homework Creation

**Already implemented!** See:
- `/src/app/dashboard/teacher/class/[classId]/create-homework/page.tsx`
- Uses same pattern as seating plan

---

### Example: Student-Only Game Access

**If you want to restrict games to students only:**

```typescript
// src/app/corelabs/page.tsx
const { user } = useAuth();

// Filter games based on role
const availableGames = allGames.filter(game => {
  if (game.requiredRole === 'student') {
    return user?.role === 'student';
  }
  return true; // Available to everyone
});
```

---

## User Roles & Permissions Matrix

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| **Dashboard** | ✅ Student view | ✅ Teacher view | ✅ Admin view |
| **CoreCS (Learning)** | ✅ | ✅ | ✅ |
| **CoreLabs (Games)** | ✅ | ✅ | ✅ |
| **Homework (Viewing)** | ✅ Own homework | ✅ All class homework | ✅ All homework |
| **CoreTools** | ❌ | ✅ | ❌* |
| **Seating Plan** | ❌ | ✅ | ❌* |
| **Class Management** | ❌ | ✅ | ✅ |
| **Admin Dashboard** | ❌ | ❌ | ✅ |
| **Flashcard Editing** | ❌ | ❌ | ✅ |
| **Puzzle Creation** | ❌ | ❌ | ✅ |

*Note: Admins could access CoreTools if you add 'admin' to the roles array

---

## Best Practices

### 1. Always Use All 3 Layers

**Why?**
- **Layer 1 (Navigation):** UX - hide what users can't access
- **Layer 2 (Page):** Security - prevent unauthorized access
- **Layer 3 (Route):** Defense in depth - final check before loading components

**Example of what NOT to do:**
```typescript
// ❌ BAD: Only hiding in navigation
// User can still access via direct URL!
const navItems = [
  { title: 'Admin', href: '/admin', roles: ['admin'] }
];
// No protection on /admin page itself!
```

### 2. Check Both Authentication & Role

```typescript
// ✅ GOOD: Check auth state AND role
if (!isLoading && user && user.role !== 'teacher') {
  router.push('/dashboard');
}

// ❌ BAD: Only checking role (what if user is null?)
if (user.role !== 'teacher') { // Error if user is null!
  router.push('/dashboard');
}
```

### 3. Show Loading States

```typescript
// ✅ GOOD: Show loading while checking
if (isLoading) {
  return <LoadingSpinner message="Checking permissions..." />;
}

// ❌ BAD: Flash of content then redirect
// (User sees protected content briefly before redirect)
```

### 4. Provide Clear Error Messages

```typescript
// ✅ GOOD: Explain why access is denied
<Alert variant="destructive">
  <AlertTitle>Access Denied</AlertTitle>
  <AlertDescription>
    The Seating Plan tool is only available to teachers.
    This tool helps organize classroom seating arrangements.
    <Button onClick={() => router.push('/dashboard')}>
      Go to Dashboard
    </Button>
  </AlertDescription>
</Alert>

// ❌ BAD: Generic error
<div>Access denied</div>
```

### 5. Add Firestore Security Rules

**Always pair frontend role checks with Firestore rules:**

```javascript
// firestore.rules
function isTeacher() {
  return request.auth != null &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
}

match /seatingPlans/{planId} {
  allow read, write: if isTeacher();
}
```

This ensures even if someone bypasses your frontend, they can't access the data.

---

## Testing Role-Based Access

### Manual Testing Checklist

**As a Student:**
- [ ] CoreTools link is hidden in sidebar
- [ ] Visiting `/coretools` redirects to dashboard
- [ ] Visiting `/coretools/seating-plan` redirects to dashboard
- [ ] Error messages are clear and helpful

**As a Teacher:**
- [ ] CoreTools link is visible in sidebar
- [ ] Can access `/coretools` page
- [ ] Can access and use seating plan tool
- [ ] All features work correctly

**As an Admin:**
- [ ] CoreTools link is hidden (since admins aren't teachers)
- [ ] Visiting `/coretools` redirects to dashboard
- [ ] Admin dashboard is accessible
- [ ] If you want admins to access tools, add 'admin' to roles array

### Testing with Different Accounts

1. **Create test accounts:**
   ```
   student@test.com (role: 'student')
   teacher@test.com (role: 'teacher')
   admin@test.com (role: 'admin')
   ```

2. **Test each scenario:**
   - Login as each role
   - Check sidebar navigation
   - Try accessing `/coretools` directly
   - Try accessing `/coretools/seating-plan` directly
   - Verify redirects and error messages

3. **Test edge cases:**
   - User with no role (role: null)
   - Unauthenticated user
   - User with invalid role value

---

## Common Patterns & Reusable Components

### Reusable Access Check Hook

You could create a custom hook for cleaner code:

```typescript
// src/hooks/shared/use-role-check.ts
import { useAuth } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRoleCheck(allowedRoles: ('student' | 'teacher' | 'admin')[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, allowedRoles, router]);

  const hasAccess = user && allowedRoles.includes(user.role);

  return { isLoading, hasAccess };
}
```

**Usage:**

```typescript
// src/app/coretools/seating-plan/page.tsx
import { useRoleCheck } from '@/hooks/shared/use-role-check';

export default function SeatingPlanPage() {
  const { isLoading, hasAccess } = useRoleCheck(['teacher']);

  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return <AccessDeniedAlert />;

  return <SeatingPlanTool />;
}
```

---

## Extending to API Routes

For server-side API routes, add role checks:

```typescript
// src/app/api/admin/flashcards/route.ts
import { getCurrentUser } from '@/lib/auth/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const user = await getCurrentUser();

  // Check authentication
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check role
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  // Process request...
  return NextResponse.json({ success: true });
}
```

---

## Summary

✅ **3-Layer Protection Implemented for CoreTools:**
1. Navigation hiding (sidebar)
2. Page-level redirect (`/coretools`)
3. Route-level protection (`/coretools/seating-plan`)

✅ **Benefits:**
- Clean UX - users only see what they can access
- Secure - multiple layers prevent unauthorized access
- Maintainable - clear pattern to follow for other features
- User-friendly - clear error messages and automatic redirects

✅ **How to Apply to Other Features:**
1. Add `roles` array to sidebar navigation
2. Add role check + redirect on page
3. Add role check + access denied on specific routes
4. Add Firestore security rules for data protection

This pattern is now established in your codebase and can be easily replicated for any feature that needs role-based restrictions!
