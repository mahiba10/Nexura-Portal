# Error 400 (Bad Request) - Root Cause Analysis & Fixes

## Issues Found & Resolved

### **Issue 1: CreateTask.jsx - Missing State Variable**

**File:** [src/pages/admin/CreateTask.jsx](src/pages/admin/CreateTask.jsx)

**Problem:**

- Lines 31-32 referenced a `requirements` state variable that was never initialized
- Calling `setRequirements()` and reading `requirements` caused ReferenceError
- Validation failed with undefined, breaking form submission
- Payload sent to database was malformed

**Fix:**
Added initialization on line 18:

```jsx
const [requirements, setRequirements] = useState(["", ""]);
```

---

### **Issue 2: createTask() - Missing Database Columns**

**File:** [src/hooks/useNexura.js](src/hooks/useNexura.js) & [database.sql](database.sql)

**Problem:**
The `createTask()` function only sent basic fields: `title`, `description`, `deadline`, `points`

Missing fields that the UI collected but never persisted:

- `category`
- `difficulty`
- `requirements` (string array)
- `assigned_to` (UUID array of student IDs)

Supabase returned 400 because the request payload didn't match the table schema expectations.

**Fix:**

1. Updated `database.sql` - Added new columns to tasks table:

   ```sql
   category text not null default 'General',
   difficulty text not null default 'Medium',
   requirements text[] not null default '{}',
   assigned_to uuid[] not null default '{}',
   ```

2. Updated `createTask()` in useNexura.js to send all fields:
   ```javascript
   const payload = {
     title: taskData.title?.trim() || "Untitled Task",
     description: taskData.description?.trim() || "",
     deadline: deadline.toISOString(),
     points: Number(taskData.points || 10),
     category: taskData.category || "General",
     difficulty: taskData.difficulty || "Medium",
     requirements: Array.isArray(taskData.requirements)
       ? taskData.requirements
       : [],
     assigned_to: Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [],
   };
   ```

---

### **Issue 3: submitTask() - UNIQUE Constraint Violation**

**File:** [src/hooks/useNexura.js](src/hooks/useNexura.js) & [database.sql](database.sql)

**Problem:**
The submissions table has a UNIQUE constraint on `(student_id, task_id)`:

```sql
unique(student_id, task_id)
```

When a student attempted to resubmit, the code always tried to INSERT, causing:

- Duplicate key violation
- Error 400 from Supabase
- No way to resubmit work after rejection

**Fix:**

1. Updated `database.sql` - Added new columns to submissions table:

   ```sql
   github_url text,
   live_url text,
   notes text,
   feedback text,
   attempt integer not null default 1,
   reviewed_at timestamptz,
   updated_at timestamptz not null default now(),
   ```

2. Updated `submitTask()` to check for existing submission:

   ```javascript
   // Check if a submission already exists for this student+task pair
   const { data: existingSubmission, error: checkError } = await supabase
     .from("submissions")
     .select("id")
     .eq("student_id", studentId)
     .eq("task_id", taskId)
     .maybeSingle();

   if (existingSubmission?.id) {
     // Update existing submission (resubmission)
     const { data, error } = await supabase
       .from("submissions")
       .update({
         file_url: signedUrlData.signedUrl,
         status: "pending",
       })
       .eq("id", existingSubmission.id)
       .select()
       .single();
   } else {
     // Insert new submission
     const { data, error } = await supabase
       .from("submissions")
       .insert([...])
       .select()
       .single();
   }
   ```

3. Added trigger to auto-update `updated_at`:

   ```sql
   create or replace function public.set_submissions_updated_at()
   returns trigger
   language plpgsql
   as $$
   begin
     new.updated_at = now();
     return new;
   end;
   $$;

   create trigger trg_submissions_set_updated_at
   before update on public.submissions
   for each row
   execute function public.set_submissions_updated_at();
   ```

---

## Database Schema Updates

### Tasks Table

```sql
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  difficulty text not null default 'Medium',
  requirements text[] not null default '{}',
  assigned_to uuid[] not null default '{}',
  deadline timestamptz not null check (deadline > now()),
  points integer not null default 10 check (points >= 0),
  created_at timestamptz not null default now()
);
```

### Submissions Table

```sql
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_url text,
  github_url text,
  live_url text,
  notes text,
  feedback text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  attempt integer not null default 1,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, task_id)
);
```

---

## Testing Checklist

Before deploying, verify:

- [ ] Run `database.sql` migration in Supabase
- [ ] Test coordinator creating a task with all fields
  - Expected: Task saved with category, difficulty, requirements, assigned_to
  - Verify via Supabase dashboard or API
- [ ] Test student submitting a task
  - Expected: Submission record created with file_url, status='pending'
  - No 400 error
- [ ] Test student resubmitting after rejection
  - Expected: Existing submission updated (not new INSERT)
  - `attempt` incremented (requires AppContext update if tracking)
  - No 400 error
- [ ] Test all RLS policies still function correctly

---

## Files Modified

1. [src/pages/admin/CreateTask.jsx](src/pages/admin/CreateTask.jsx) - Added `requirements` state
2. [src/hooks/useNexura.js](src/hooks/useNexura.js) - Fixed `createTask()` and `submitTask()`
3. [database.sql](database.sql) - Extended tasks & submissions tables, added trigger

---

## Error Prevention Going Forward

- **Always initialize all state variables used in forms**
- **Keep database schema in sync with frontend payloads**
- **Check for UNIQUE constraints when implementing update-or-insert logic**
- **Add detailed logging to Supabase error responses** (e.g., `console.error(error.message, error.details)`)
