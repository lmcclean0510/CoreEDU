# Teacher Calendar Feature - Implementation Plan

> **Status**: Planning Phase
> **Created**: October 29, 2025
> **Purpose**: Transform the weekly timetable into a full teacher calendar with notes, tasks, and daily agenda

---

## 📋 Overview

### Current State
The teacher dashboard has a **WeeklyTimetable** component that shows:
- Recurring weekly class schedule (e.g., "Class 5B every Monday 9-10 AM")
- Real-time status indicators (past/current/upcoming)
- Week progress percentage
- 7-day grid layout

### Proposed Enhancement
Transform into a **hybrid calendar/planner** that shows:
1. **Recurring classes** (existing weekly schedule)
2. **One-time events** (new: tasks, notes, reminders for specific dates)
3. **"Today" section** on dashboard showing urgent items for current day

---

## 🎯 Goals

### Primary Goals
- Allow teachers to add notes/tasks to specific calendar dates
- Display notes and tasks on the calendar view
- Show today's tasks/notes prominently on dashboard
- Enable task completion tracking (checkboxes)

### Secondary Goals (Future Phases)
- Week/month navigation
- Recurring tasks
- Integration with homework deadlines
- Color coding by type/class
- Calendar export (iCal, Google Calendar)

---

## 🏗️ Technical Architecture

### Firestore Schema

#### New Collection: `teacherCalendarItems`

```typescript
{
  id: string;                    // Auto-generated document ID
  teacherId: string;             // UID of teacher who created it
  type: 'note' | 'task' | 'reminder';
  title: string;                 // Required: "Grade homework", "Parent meeting"
  description?: string;          // Optional: Additional details
  date: Timestamp;               // Specific date (e.g., October 28, 2025)
  createdAt: Timestamp;          // When item was created
  completed?: boolean;           // For tasks: marked complete?
  completedAt?: Timestamp;       // When task was completed
  classId?: string;              // Optional: link to specific class
  updatedAt?: Timestamp;         // Last modification
}
```

**Firestore Rules** (add to `firestore.rules`):
```javascript
match /teacherCalendarItems/{itemId} {
  // Teachers can only read/write their own calendar items
  allow read: if request.auth.uid == resource.data.teacherId;
  allow create: if request.auth.uid == request.resource.data.teacherId
                && isTeacher(request.auth.uid);
  allow update, delete: if request.auth.uid == resource.data.teacherId;
}
```

**Indexes Needed**:
```json
{
  "collectionGroup": "teacherCalendarItems",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "teacherId", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "ASCENDING" }
  ]
}
```

---

### Type Definitions

**Add to `/src/lib/types.ts`:**

```typescript
export type CalendarItemType = 'note' | 'task' | 'reminder';

export type TeacherCalendarItem = {
  id: string;
  teacherId: string;
  type: CalendarItemType;
  title: string;
  description?: string;
  date: Timestamp;
  createdAt: Timestamp;
  completed?: boolean;
  completedAt?: Timestamp;
  classId?: string;
  updatedAt?: Timestamp;
};

export type CalendarDay = {
  date: Date;
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isToday: boolean;
  classes: TimetableClass[];      // From existing timetable
  calendarItems: TeacherCalendarItem[];  // New items
};
```

---

## 📦 Components to Create/Modify

### 1. **Custom Hook: `useCalendarItems`**

**Location**: `/src/hooks/teacher/use-calendar-items.ts`

**Purpose**: Manage CRUD operations for calendar items

**Interface**:
```typescript
export function useCalendarItems(teacherId: string, startDate?: Date, endDate?: Date) {
  return {
    items: TeacherCalendarItem[];
    isLoading: boolean;
    error: string | null;

    // CRUD operations
    createItem: (item: Omit<TeacherCalendarItem, 'id' | 'createdAt'>) => Promise<string>;
    updateItem: (itemId: string, updates: Partial<TeacherCalendarItem>) => Promise<void>;
    deleteItem: (itemId: string) => Promise<void>;
    toggleComplete: (itemId: string) => Promise<void>;

    // Filtering helpers
    getItemsForDate: (date: Date) => TeacherCalendarItem[];
    getTodayItems: () => TeacherCalendarItem[];
    getOverdueItems: () => TeacherCalendarItem[];
  };
}
```

**Features**:
- Real-time Firestore listener (onSnapshot)
- Automatic cleanup on unmount
- Date range filtering
- Query limit (500 items)
- Error handling with toast notifications

---

### 2. **Dialog Component: `AddCalendarItemDialog`**

**Location**: `/src/components/dashboard/teacher/AddCalendarItemDialog.tsx`

**Purpose**: Form dialog to create new calendar items

**UI Fields**:
1. **Type selector** (Radio or Tabs)
   - 📝 Note
   - ✓ Task
   - 🔔 Reminder

2. **Title** (required)
   - Text input
   - Placeholder: "Grade homework submissions"
   - Max length: 100 characters

3. **Date** (required)
   - Date picker
   - Default: Today
   - Min date: Today (no past dates)

4. **Description** (optional)
   - Textarea
   - Placeholder: "Additional details..."
   - Max length: 500 characters

5. **Link to class** (optional)
   - Dropdown select from teacher's classes
   - Shows class name + subject
   - Can be left blank (general task)

**Validation**:
- Title required
- Date required
- Type required
- Description optional but trimmed

**Example Implementation Pattern**:
```typescript
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/providers/UserProvider';
import { useCalendarItems } from '@/hooks/teacher/use-calendar-items';
import { useToast } from '@/hooks/shared/use-toast';

export function AddCalendarItemDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'note' | 'task' | 'reminder'>('note');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');

  const { user } = useAuth();
  const { createItem, isLoading } = useCalendarItems(user?.uid || '');
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Validation and Firestore creation
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Note</Button>
      </DialogTrigger>
      <DialogContent>
        {/* Form fields */}
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3. **Enhanced Component: `TeacherCalendar`**

**Location**: `/src/components/dashboard/teacher/TeacherCalendar.tsx`

**Option A: Enhance Existing WeeklyTimetable**
- Rename `WeeklyTimetable.tsx` → `TeacherCalendar.tsx`
- Add calendar items overlay
- Keep existing class display logic

**Option B: Create New Component (Recommended)**
- Keep `WeeklyTimetable.tsx` unchanged
- Create new `TeacherCalendar.tsx` that imports and enhances it
- Better for backwards compatibility

**New Features**:
1. **Fetch calendar items** for current week
2. **Display items** on each day (badges, icons, or cards)
3. **Click to expand** item details
4. **Quick complete** toggle for tasks (checkbox)
5. **Add button** in header to open AddCalendarItemDialog

**Visual Design**:
```
┌─────────────────────────────────────────────────────────┐
│  📅 Teacher Calendar              [+ Add Note] [< > ]   │
│  Week of Oct 28 - Nov 3, 2025                           │
├─────────────────────────────────────────────────────────┤
│  MON      TUE       WED       THU       FRI    SAT  SUN │
│  Oct 28   Oct 29    Oct 30    Oct 31    Nov 1  2    3   │
│                                                          │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌──────┐       │
│ │Class  │ │ TODAY │ │Class  │ │Class  │ │Class │  No   │
│ │9-10am │ │       │ │1-2pm  │ │10-11  │ │9-10  │ items │
│ │       │ │Class  │ │       │ │       │ │      │       │
│ │📝Note │ │9-10am │ │       │ │       │ │      │       │
│ │       │ │       │ │✓Task  │ │       │ │      │       │
│ │       │ │📝Note │ │✓Task  │ │       │ │      │       │
│ └───────┘ │✓Task  │ └───────┘ └───────┘ └──────┘       │
│           └───────┘                                      │
└─────────────────────────────────────────────────────────┘
```

**Item Display Options**:

**Option 1: Badges** (Simple, minimal space)
- Small colored badges below class times
- 📝 = Note, ✓ = Task (uncompleted), ✅ = Task (completed)
- Hover to see title

**Option 2: Cards** (More detail, takes more space)
- Small cards with title visible
- Color coded by type
- Checkbox for tasks

**Option 3: Icon + Count** (Compact)
- Show icon with number (e.g., "📝 2" = 2 notes)
- Click day to expand modal with all items

**Recommendation**: Start with **Option 1 (Badges)**, add Option 2 in Phase 2

---

### 4. **New Component: `TodaySection`**

**Location**: `/src/components/dashboard/teacher/TodaySection.tsx`

**Purpose**: Dashboard widget showing today's urgent items

**Placement**:
- Above or below current WeeklyTimetable on teacher dashboard
- Could also be in a separate tab or collapsible section

**Content Sections**:

1. **Today's Classes** (from existing timetable)
   - Current class highlighted
   - Next class with countdown
   - Click to view class details

2. **Today's Tasks** (from calendar items)
   - Uncompleted tasks due today
   - Checkbox to mark complete
   - Show overdue tasks from previous days (in red)

3. **Today's Notes** (from calendar items)
   - Notes scheduled for today
   - Quick view, click to expand
   - Delete button

4. **Upcoming This Week** (optional)
   - Next 3 tasks/notes in chronological order
   - Preview of what's coming

**Visual Design**:
```
┌─────────────────────────────────────────────────────────┐
│  📅 Today - Tuesday, October 29, 2025                   │
├─────────────────────────────────────────────────────────┤
│  📚 Classes                                              │
│    ✅ test 1 (Computer Science) - 9:00 AM (Completed)   │
│    ▶️  Period 3 (Maths) - Starting in 1 hour 23 mins   │
│                                                          │
│  ✓ Tasks                                                │
│    ⚠️ □ Grade assignments (OVERDUE from Oct 27)         │
│    □ Review homework submissions                        │
│    □ Prepare seating plan for Period 3                  │
│    ✓ Email parents about field trip                    │
│                                                          │
│  📝 Notes                                                │
│    • Remember: Assembly at 10:30 AM                     │
│    • Sarah needs extra time on quiz today               │
│                                                          │
│  📆 Coming Up This Week                                  │
│    Wed: Faculty meeting at 3 PM                         │
│    Thu: Parent conferences start                        │
│    Fri: Submit grade reports by 5 PM                    │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Real-time updates (classes, task completion)
- Quick actions (complete task without opening calendar)
- Collapse/expand sections
- "Mark all complete" button for tasks
- Link to full calendar view

---

## 🎨 UI/UX Specifications

### Color Coding

| Type | Color | Icon | Purpose |
|------|-------|------|---------|
| **Note** | Blue (`bg-blue-50 border-blue-200`) | 📝 | General reminders |
| **Task** | Green (`bg-green-50 border-green-200`) | ✓ | Action items to complete |
| **Task (complete)** | Gray (`bg-gray-50 border-gray-200`) | ✅ | Done! |
| **Reminder** | Yellow (`bg-yellow-50 border-yellow-200`) | 🔔 | Time-sensitive alerts |
| **Overdue** | Red (`bg-red-50 border-red-200`) | ⚠️ | Past due date |

### Interaction Patterns

1. **Add Calendar Item**
   - Click "+ Add Note" button anywhere → Opens dialog
   - Submit → Toast notification "Note added to Oct 29"
   - Calendar updates in real-time

2. **Complete Task**
   - Click checkbox on task → Immediate toggle
   - Strikethrough text + gray out
   - Toast: "Task marked complete!"
   - Can undo by unchecking

3. **View/Edit Item**
   - Click item → Opens details modal or inline expansion
   - Edit mode with same fields as creation
   - Delete button (with confirmation)

4. **Navigate Calendar**
   - Arrow buttons: < Previous Week | Next Week >
   - "Today" button to jump back to current week
   - Date range shown in header

### Responsive Design

**Desktop (> 1024px)**:
- Full 7-day calendar grid
- Today section as sidebar or full-width card

**Tablet (768px - 1024px)**:
- 7-day calendar with smaller cards
- Today section full-width below calendar

**Mobile (< 768px)**:
- Collapse to 3-day view (Yesterday, Today, Tomorrow)
- Or vertical list view by day
- Today section prioritized at top

---

## 📊 Implementation Phases

### **Phase 1: MVP - Basic Note System** ⭐ START HERE

**Goal**: Teachers can add notes to calendar and see them on dashboard

**Scope**:
1. Create Firestore collection `teacherCalendarItems`
2. Add type definitions to `types.ts`
3. Create `useCalendarItems` hook (basic CRUD only)
4. Create `AddCalendarItemDialog` component (notes only, no tasks yet)
5. Enhance `WeeklyTimetable` to show note badges on days
6. Create simple `TodaySection` component (just today's notes)

**Time Estimate**: 4-6 hours

**Success Criteria**:
- ✅ Teacher can click "+ Add Note" button
- ✅ Dialog opens with title, date, description fields
- ✅ Note saves to Firestore
- ✅ Note appears as badge on calendar
- ✅ Note shows in "Today" section if date is today
- ✅ Teacher can delete notes

**Deliverables**:
- `/src/hooks/teacher/use-calendar-items.ts`
- `/src/components/dashboard/teacher/AddCalendarItemDialog.tsx`
- `/src/components/dashboard/teacher/TodaySection.tsx`
- Updated `/src/lib/types.ts`
- Firestore rules update
- Updated teacher dashboard page to include TodaySection

---

### **Phase 2: Task Management**

**Goal**: Add task functionality with completion tracking

**Scope**:
1. Add "Task" type to AddCalendarItemDialog (radio/tab selector)
2. Add checkbox rendering in calendar view
3. Implement `toggleComplete` function in hook
4. Show completed vs incomplete distinction visually
5. Add "overdue tasks" logic (tasks from past dates not completed)
6. Enhance TodaySection to show tasks with checkboxes

**Time Estimate**: 2-3 hours

**Success Criteria**:
- ✅ Teacher can choose "Note" or "Task" when creating item
- ✅ Tasks show checkbox instead of just icon
- ✅ Clicking checkbox marks task complete (strikethrough)
- ✅ Overdue tasks show in red on TodaySection
- ✅ Completed tasks remain visible but grayed out

**New Features**:
- Task completion animations
- "Mark all complete" button
- Filter: Show/hide completed tasks

---

### **Phase 3: Enhanced Calendar View**

**Goal**: Full-featured calendar navigation and display

**Scope**:
1. Week navigation buttons (< Previous / Next >)
2. "Jump to today" button
3. Month view option (toggle week/month)
4. Expanded item cards with full details visible
5. Click-to-edit functionality (inline or modal)
6. Color coding by class (if classId linked)

**Time Estimate**: 3-4 hours

**Success Criteria**:
- ✅ Navigate between weeks
- ✅ Always can return to current week
- ✅ Items color-coded by type
- ✅ Click item to see full description
- ✅ Edit items without deleting and recreating

**Advanced Features**:
- Drag-and-drop to reschedule items
- Duplicate item to another date
- Bulk operations (delete multiple items)

---

### **Phase 4: Advanced Features** (Future)

**Scope**:
1. **Recurring tasks**: "Repeat every Monday"
2. **Reminders/Notifications**: Browser notifications at scheduled time
3. **Class integration**: Auto-create tasks when homework assigned
4. **Shared notes**: Co-teachers can view notes for shared classes
5. **Templates**: Save note templates for common tasks
6. **Calendar export**: iCal, Google Calendar sync
7. **File attachments**: Attach PDFs, images to notes
8. **Search/Filter**: Search all notes by keyword

**Time Estimate**: 10+ hours (large scope)

---

## 🔧 Technical Implementation Details

### Firestore Query Patterns

**Fetch items for specific date range:**
```typescript
const startOfWeek = /* calculate */;
const endOfWeek = /* calculate */;

const q = query(
  collection(db, 'teacherCalendarItems'),
  where('teacherId', '==', teacherId),
  where('date', '>=', Timestamp.fromDate(startOfWeek)),
  where('date', '<=', Timestamp.fromDate(endOfWeek)),
  orderBy('date', 'asc'),
  limit(500)
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setCalendarItems(items);
});
```

**Fetch today's items:**
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const q = query(
  collection(db, 'teacherCalendarItems'),
  where('teacherId', '==', teacherId),
  where('date', '>=', Timestamp.fromDate(today)),
  where('date', '<', Timestamp.fromDate(tomorrow))
);
```

**Fetch overdue incomplete tasks:**
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const q = query(
  collection(db, 'teacherCalendarItems'),
  where('teacherId', '==', teacherId),
  where('type', '==', 'task'),
  where('completed', '==', false),
  where('date', '<', Timestamp.fromDate(today))
);
```

---

### Date Handling Utilities

**Helper functions to add:**

```typescript
// /src/lib/date-utils.ts (add to existing file)

/**
 * Get start and end of current week (Monday - Sunday)
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear()
    && date1.getMonth() === date2.getMonth()
    && date1.getDate() === date2.getDate();
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Format date for display
 */
export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  // Output: "Tuesday, October 29, 2025"
}
```

---

### Performance Considerations

1. **Query Limits**
   - Always use `.limit(500)` on Firestore queries
   - Paginate if teachers create > 500 items

2. **Real-time Listeners**
   - Use `onSnapshot` for real-time updates
   - Clean up listeners in `useEffect` return
   - Consider using `useSubscriptionManager` pattern

3. **Caching**
   - Cache current week's items in memory
   - Use dual-layer cache (memory + localStorage) pattern
   - Only re-fetch when week changes

4. **Optimistic Updates**
   - Update UI immediately when marking task complete
   - Rollback if Firestore update fails
   - Show loading spinner only for initial fetch

---

## 🎯 Key Design Decisions

### Decision 1: Date Only vs Date + Time

**Chosen**: **Date Only** (for Phase 1)

**Rationale**:
- Simpler to implement (no time picker needed)
- Most teacher tasks are day-specific ("Grade homework Friday")
- Can add time in Phase 3 if needed

**Schema**: Store midnight timestamp for date-only items
```typescript
const date = new Date('2025-10-29');
date.setHours(0, 0, 0, 0);
const timestamp = Timestamp.fromDate(date);
```

---

### Decision 2: Replace Timetable or Enhance?

**Chosen**: **Enhance Existing** (Hybrid approach)

**Rationale**:
- Teachers like seeing recurring weekly schedule
- Calendar items complement (not replace) class schedule
- Both types of information are valuable

**Implementation**:
- Keep `WeeklyTimetable` component mostly unchanged
- Add calendar items as badges/overlays on same grid
- Eventually rename to `TeacherCalendar` but keep both features

---

### Decision 3: Where to Show "Today" Section?

**Chosen**: **Top of Dashboard** (above or replacing current timetable)

**Rationale**:
- "What's happening today" is most urgent information
- Should be visible immediately on page load
- Full week calendar can scroll below

**Layout**:
```
Teacher Dashboard:
1. TodaySection (TODAY's urgent items)
2. TeacherCalendar (WEEK's schedule + items)
3. YourClasses (class management cards)
```

---

### Decision 4: Task Completion Behavior

**Chosen**: **Keep completed tasks visible** (grayed out)

**Rationale**:
- Teachers want to see what they've accomplished
- Provides sense of progress
- Can be hidden with toggle filter later

**Visual**:
- Uncompleted: ☐ Task name (bold, colorful)
- Completed: ☑ ~~Task name~~ (strikethrough, gray)

---

## 🚨 Edge Cases to Handle

### 1. No Calendar Items Yet
**Scenario**: Teacher opens calendar, hasn't created any items

**Solution**:
- Show empty state with helpful message
- "Get started by adding your first note!"
- Large "+ Add Note" button

### 2. Too Many Items on One Day
**Scenario**: 10+ items scheduled for same day

**Solution**:
- Show first 3 items, then "+ 7 more"
- Click to expand full list in modal
- Warn teacher when adding 10th item to same day

### 3. Overdue Tasks Accumulate
**Scenario**: Teacher has 50 overdue tasks from past months

**Solution**:
- Show max 5 overdue tasks in TodaySection
- "View all overdue" link to full list
- Bulk action: "Mark all overdue as complete"

### 4. Date Timezone Issues
**Scenario**: User travels to different timezone

**Solution**:
- Store dates as midnight UTC
- Display in user's local timezone
- Use consistent date normalization

### 5. Concurrent Edits (Rare)
**Scenario**: Two teachers share account, edit same item

**Solution**:
- Firestore handles this with transactions
- Last write wins (acceptable for this use case)
- Show toast if item changes while editing

---

## 🧪 Testing Checklist

### Phase 1 Testing (MVP)

**Functional Tests**:
- [ ] Create note with title, date, description
- [ ] Note appears on calendar on correct day
- [ ] Note appears in TodaySection if date is today
- [ ] Delete note removes it from calendar and TodaySection
- [ ] Multiple notes can exist on same day
- [ ] Notes persist after page refresh
- [ ] Notes are teacher-specific (don't show other teachers' notes)

**Edge Cases**:
- [ ] Create note with empty description (should work)
- [ ] Create note with very long title (truncate/wrap)
- [ ] Create note for past date (should warn or prevent)
- [ ] Create note for far future date (next year)
- [ ] Delete last note on a day (day shows "No items")

**UI/UX**:
- [ ] Dialog opens/closes smoothly
- [ ] Loading states show when saving
- [ ] Error toast shows if save fails
- [ ] Calendar updates immediately after creation
- [ ] Today section highlights current day
- [ ] Responsive on mobile (< 768px)

---

### Phase 2 Testing (Tasks)

**Functional Tests**:
- [ ] Create task (vs note) works correctly
- [ ] Task shows checkbox instead of static icon
- [ ] Click checkbox marks task complete
- [ ] Completed task shows strikethrough and grayed out
- [ ] Uncompleted task from yesterday shows as overdue in red
- [ ] Task completion persists after refresh

**Edge Cases**:
- [ ] Toggle task complete/incomplete multiple times rapidly
- [ ] Task due "today" before midnight, becomes "overdue" after
- [ ] Many overdue tasks (10+) handled gracefully

---

## 📚 Reference Materials

### Existing Codebase Patterns to Follow

1. **Custom Hooks**: See `/src/hooks/teacher/use-class-management.ts`
   - Real-time Firestore listeners
   - CRUD operations with error handling
   - Toast notifications

2. **Dialog Components**: See `/src/components/dashboard/teacher/CreateClassDialog.tsx`
   - Form validation
   - Loading states
   - Success callbacks
   - Dialog open/close state

3. **Dashboard Cards**: See `/src/components/dashboard/teacher/ClassCard.tsx`
   - Card layout with header/content
   - Action buttons
   - Consistent styling

4. **Date Handling**: See `/src/lib/date-utils.ts`
   - Date formatting functions
   - Timestamp conversions

### External Inspiration

**Similar Features in Other Platforms**:
- **Google Classroom**: Upcoming work widget
- **Canvas LMS**: To Do sidebar
- **Microsoft Teams**: Calendar integration
- **Notion**: Calendar database views
- **Trello**: Calendar power-up

---

## 🎬 Getting Started (When Ready)

### Prerequisites
1. Firestore set up and working (✅ already done)
2. Teacher authentication working (✅ already done)
3. TypeScript + React knowledge (✅ already have)

### Step-by-Step First Implementation

1. **Create Firestore collection** (1 min)
   - Go to Firebase Console
   - Create collection `teacherCalendarItems`
   - Add test document manually to verify

2. **Update types.ts** (5 min)
   - Add `TeacherCalendarItem` type
   - Export `CalendarItemType`

3. **Create hook skeleton** (30 min)
   - Create file `use-calendar-items.ts`
   - Set up Firestore query with onSnapshot
   - Implement `createItem` function first
   - Test with console.log

4. **Create dialog component** (1-2 hours)
   - Copy structure from CreateClassDialog
   - Simplify to just title + date + description
   - Wire up to `createItem` from hook

5. **Test creation flow** (30 min)
   - Click button → opens dialog
   - Fill form → submit
   - Check Firestore Console → document created
   - Fix any bugs

6. **Add to timetable** (1-2 hours)
   - Fetch items in WeeklyTimetable
   - Map items to days
   - Show simple badge for each item
   - Click badge shows title in tooltip

7. **Create TodaySection** (1 hour)
   - New component with card layout
   - Filter items for today's date
   - Display as simple list
   - Add to teacher dashboard page

8. **Polish & deploy** (1 hour)
   - Loading states
   - Error handling
   - Toast notifications
   - Test on mobile

**Total Time: ~6-8 hours for Phase 1**

---

## ❓ Open Questions (To Decide Before Implementation)

### Question 1: Scope
Do you want to start with **MVP** (simple notes + today section) or build the **full calendar** right away?

**Recommendation**: MVP first, then iterate

---

### Question 2: Timetable Modification
Should I **replace** the current WeeklyTimetable or **enhance** it to show both classes and notes?

**Recommendation**: Enhance (show both)

---

### Question 3: Date Granularity
Just **date** (e.g., "October 28") or **date + time** (e.g., "October 28 at 2:30 PM")?

**Recommendation**: Date only for Phase 1

---

### Question 4: Item Types
Start with just **"notes"** or include **"tasks"** (with checkboxes) from the beginning?

**Recommendation**: Notes only in Phase 1, add tasks in Phase 2

---

### Question 5: UI Priority
More important to have the **"Today" section on dashboard** or the **full calendar view** first?

**Recommendation**: Both, but Today section is higher priority

---

## 📞 Contact/Continuation

**When Ready to Implement**:
1. Share this document with Claude
2. Say: "I'm ready to implement the teacher calendar feature. Let's start with Phase 1 MVP."
3. Claude will create files based on this plan

**If You Need Clarification**:
- Review the "Open Questions" section above
- Decide on your preferences
- Update this document with decisions

---

## 📝 Version History

- **v1.0** (October 29, 2025): Initial planning document created
  - Comprehensive brainstorm of dashboard improvements
  - Detailed implementation plan for calendar feature
  - Phase 1 MVP scope defined

---

**Next Steps**: Review this plan, make any decisions on open questions, and share with Claude when ready to build! 🚀
