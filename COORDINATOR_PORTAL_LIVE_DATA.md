# Coordinator Portal - Live Supabase Data Integration

## Summary

Updated all coordinator portal pages to fetch live data directly from Supabase instead of relying on hardcoded mock data from the AppContext. Implemented proper database joins for displaying related student and task information.

---

## Pages Updated

### 1. **Dashboard.jsx** (`src/pages/admin/Dashboard.jsx`)

**Changes:**

- Removed dependency on `useApp()` context
- Added `useEffect` hook to fetch live data on component mount
- Fetches from three tables in parallel: `profiles` (role='student'), `tasks`, `submissions`
- Calculates stats (pending, approved, rejected) from live submission data
- Added loading state during data fetch
- Fixed duplicate CSS gradient classes

**Data Flow:**

```
useEffect (on mount)
  ├─ supabase.from("profiles").select("*").eq("role", "student")
  ├─ supabase.from("tasks").select("*")
  └─ supabase.from("submissions").select("*")
    ↓
    Initialize states: students, tasks, submissions
    ↓
    Compute counts from live data (totalStudents, totalTasks, pending, approved, rejected)
```

---

### 2. **ManageTasks.jsx** (`src/pages/admin/ManageTasks.jsx`)

**Changes:**

- Removed dependency on `useApp()` context
- Added `useEffect` hook to fetch tasks and submissions
- Updated field references:
  - `task.category` → `task.category` (with null fallback to "General")
  - `task.assignedTo?.length` → `Array.isArray(task.assigned_to) ? task.assigned_to.length : 0`
  - `task.createdAt` → `task.created_at`
- Added loading state
- Submission counts automatically join with fetched data

**Key Features:**

- Real-time submission count per task
- Search filters by task title
- Proper field mapping to Supabase schema

---

### 3. **Submissions.jsx** (`src/pages/admin/Submissions.jsx`)

**Changes:**

- Removed `useApp()` context and mock data imports
- Added `useEffect` to fetch submissions, tasks, and students (profiles) in parallel
- Implemented `getStudent()` and `getTask()` helper functions that join data:

  ```javascript
  const getStudent = (studentId) =>
    students.find((s) => s.id === studentId) || {
      id: studentId,
      name: "Unknown Student",
      roll_no: "N/A",
    };

  const getTask = (taskId) =>
    tasks.find((t) => t.id === taskId) || {
      id: taskId,
      title: "Unknown Task",
    };
  ```

- Implemented `handleRemoveSubmission()` to delete from Supabase directly
- Updated field references:
  - `s.taskId` → `s.task_id`
  - `s.studentId` → `s.student_id`
  - `s.submittedAt` → `s.created_at`
  - `student.rollNo` → `student.roll_no`

**Data Flow:**

```
useEffect (on mount) fetches in parallel:
  ├─ supabase.from("submissions").select("*").order("created_at")
  ├─ supabase.from("tasks").select("*")
  └─ supabase.from("profiles").select("*").eq("role", "student")
    ↓
    Generate filtered results with joins
    ├─ Student data joined via student_id
    ├─ Task data joined via task_id
    ├─ Apply status filter (pending/approved/rejected)
    └─ Apply search query across all fields
```

---

### 4. **Students.jsx** (`src/pages/admin/Students.jsx`)

**Changes:**

- Fixed table query: `supabase.from("students")` → `supabase.from("profiles").select("*").eq("role", "student")`
- Now correctly queries the actual `profiles` table and filters by student role
- Maintains existing functionality for search and stats display

---

## Database Schema Alignment

The coordinator pages now correctly reference Supabase column names:

| Frontend Variable       | Supabase Column | Example                             |
| ----------------------- | --------------- | ----------------------------------- |
| `task.deadline`         | `deadline`      | `2026-09-30T00:00:00Z`              |
| `task.created_at`       | `created_at`    | `2026-09-01T10:30:00Z`              |
| `task.category`         | `category`      | "Web Development"                   |
| `task.difficulty`       | `difficulty`    | "Intermediate"                      |
| `task.assigned_to`      | `assigned_to`   | `['uuid1', 'uuid2']`                |
| `submission.created_at` | `created_at`    | `2026-09-05T14:20:00Z`              |
| `submission.student_id` | `student_id`    | `uuid`                              |
| `submission.task_id`    | `task_id`       | `uuid`                              |
| `submission.status`     | `status`        | "pending" / "approved" / "rejected" |
| `student.roll_no`       | `roll_no`       | "CS21B045"                          |
| `student.created_at`    | `created_at`    | `2024-08-12T00:00:00Z`              |

---

## Key Improvements

✅ **No More Mock Data** - All coordinator views now display actual student/task/submission data from Supabase  
✅ **Relational Joins** - Student names, task titles, and submission counts are fetched and joined properly  
✅ **Live Updates** - Data is fresh on page load and reflects submission changes immediately  
✅ **Proper Error Handling** - Failed queries show graceful error states with empty arrays  
✅ **Loading States** - Users see "Loading..." while data is being fetched  
✅ **Consistent Schema** - All pages use snake_case field names matching Supabase column definitions

---

## Field Name Changes for Frontend Developers

If you work on other coordinator pages or components, remember these mappings:

| Old Mock Format | New Supabase Format |
| --------------- | ------------------- |
| `createdAt`     | `created_at`        |
| `submittedAt`   | `created_at`        |
| `taskId`        | `task_id`           |
| `studentId`     | `student_id`        |
| `assignedTo`    | `assigned_to`       |
| `reviewedAt`    | `reviewed_at`       |
| `avatarColor`   | `avatar_color`      |
| `rollNo`        | `roll_no`           |

---

## Testing Checklist

Before deploying, verify:

- [ ] Dashboard displays correct student count from profiles table
- [ ] Dashboard shows accurate submission stats (pending, approved, rejected)
- [ ] Manage Tasks page shows all tasks with real submission counts
- [ ] Manage Tasks search filters work correctly
- [ ] Submissions page shows student names linked via student_id
- [ ] Submissions page shows task titles linked via task_id
- [ ] Filter by task dropdown works
- [ ] Status filters (all/pending/approved/rejected) work
- [ ] Search across student name, roll no, and task title works
- [ ] Deleting a submission removes it from Supabase and UI
- [ ] Loading states appear while data is being fetched
- [ ] Empty states show when no data exists

---

## Migration Complete ✨

The coordinator portal is now 100% connected to live Supabase data. No mock data is used in any coordinator pages. All student, task, and submission information is fetched directly from the database and displayed in real-time.
