-- 1. Setup Extensions
create extension if not exists pgcrypto;

-- 2. Create Database Tables First
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

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

-- 3. Create Custom Security Functions
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do update
    set name = excluded.name;
  return new;
end;
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null then
      new.role := 'student';
    end if;
    if new.role not in ('student', 'admin') then
      raise exception 'Invalid role';
    end if;
    if new.id is distinct from auth.uid() and not public.is_admin() then
      raise exception 'Profile creation is restricted to authenticated users';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Role escalation is forbidden';
  end if;
  if new.id is distinct from old.id and not public.is_admin() then
    raise exception 'Profile identity cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function public.prevent_submission_ownership_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.student_id is null then
      raise exception 'student_id is required';
    end if;
    if new.student_id <> auth.uid() and not public.is_admin() then
      raise exception 'Students can only submit their own work';
    end if;
    if new.status is null then
      new.status := 'pending';
    end if;
    if new.status <> 'pending' and not public.is_admin() then
      raise exception 'Only admins may approve or reject submissions';
    end if;
    return new;
  end if;
  if new.student_id is distinct from old.student_id and not public.is_admin() then
    raise exception 'Submission ownership cannot be reassigned';
  end if;
  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'Students cannot change submission status';
  end if;
  return new;
end;
$$;

create or replace function public.set_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Create Automation Triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists trg_profiles_role_guard on public.profiles;
create trigger trg_profiles_role_guard
before insert or update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

drop trigger if exists trg_submissions_guard on public.submissions;
create trigger trg_submissions_guard
before insert or update on public.submissions
for each row execute function public.prevent_submission_ownership_changes();

drop trigger if exists trg_submissions_set_updated_at on public.submissions;
create trigger trg_submissions_set_updated_at
before update on public.submissions
for each row
execute function public.set_submissions_updated_at();

-- 5. Row Level Security Configuration
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Profiles read all" on public.profiles;
create policy "Profiles read all" on public.profiles for select using (true);

drop policy if exists "Profiles insert allowed" on public.profiles;
create policy "Profiles insert allowed" on public.profiles for insert with check (auth.uid() = id and role = 'student');

drop policy if exists "Profiles update self" on public.profiles;
create policy "Profiles update self" on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from public.profiles where id = auth.uid())
);

drop policy if exists "Tasks read all" on public.tasks;
create policy "Tasks read all" on public.tasks for select using (true);

drop policy if exists "Tasks insert admin" on public.tasks;
create policy "Tasks insert admin" on public.tasks for insert with check (public.is_admin());

drop policy if exists "Tasks update admin" on public.tasks;
create policy "Tasks update admin" on public.tasks
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Tasks delete admin" on public.tasks;
create policy "Tasks delete admin" on public.tasks for delete using (public.is_admin());

drop policy if exists "Submissions read own or admin" on public.submissions;
create policy "Submissions read own or admin" on public.submissions
for select using (auth.uid() = student_id or public.is_admin());

drop policy if exists "Submissions insert self or admin" on public.submissions;
create policy "Submissions insert self or admin" on public.submissions
for insert with check (
  (auth.uid() = student_id and status = 'pending')
  or public.is_admin()
);

drop policy if exists "Submissions update self or admin" on public.submissions;
create policy "Submissions update self or admin" on public.submissions
for update
using (auth.uid() = student_id or public.is_admin())
with check (
  auth.uid() = student_id 
  or public.is_admin()
);

drop policy if exists "Submissions delete self or admin" on public.submissions;
create policy "Submissions delete self or admin" on public.submissions
for delete using (auth.uid() = student_id or public.is_admin());

-- 6. Performance Indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_tasks_deadline on public.tasks(deadline);
create index if not exists idx_tasks_category on public.tasks(category);
create index if not exists idx_submissions_student_task on public.submissions(student_id, task_id);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_submissions_created_at on public.submissions(created_at);

-- 7. App Access Permissions
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.tasks, public.submissions to authenticated;
grant insert, update, delete on public.tasks, public.submissions to authenticated;

-- 8. FIXED Realtime Configurations (Simplified to completely bypass system column limits)
drop publication if exists supabase_realtime;
create publication supabase_realtime for table public.profiles, public.tasks, public.submissions;

-- 9. Storage Bucket Initialization
insert into storage.buckets (id, name, public)
values ('task-submissions', 'task-submissions', false)
on conflict (id) do update set public = false;

-- 10. Storage Object Security Policies
drop policy if exists "task-submissions-read-own-admin" on storage.objects;
create policy "task-submissions-read-own-admin" on storage.objects
for select using (
  bucket_id = 'task-submissions' and (
    auth.uid()::text = split_part(name, '/', 1)
    or public.is_admin()
  )
);

drop policy if exists "task-submissions-insert-owner" on storage.objects;
create policy "task-submissions-insert-owner" on storage.objects
for insert with check (
  bucket_id = 'task-submissions' and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "task-submissions-update-own-admin" on storage.objects;
create policy "task-submissions-update-own-admin" on storage.objects
for update using (
  bucket_id = 'task-submissions' and (
    auth.uid()::text = split_part(name, '/', 1)
    or public.is_admin()
  )
)
with check (
  bucket_id = 'task-submissions' and (
    auth.uid()::text = split_part(name, '/', 1)
    or public.is_admin()
  )
);

drop policy if exists "task-submissions-delete-own-admin" on storage.objects;
create policy "task-submissions-delete-own-admin" on storage.objects
for delete using (
  bucket_id = 'task-submissions' and (
    auth.uid()::text = split_part(name, '/', 1)
    or public.is_admin()
  )
);