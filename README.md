Nexura — Student Task Management Portal
Task management portal for Nexura, a college technical club. Students receive task assignments, submit their work, and coordinators review it.

The app is not a mock-up. It runs against a real Supabase backend: real accounts, real Postgres storage, row-level security, file uploads, and live updates. All state that matters lives in the database.

If the Supabase environment variables are missing, the app falls back to a local demo mode that runs entirely in the browser with sample data and accepts any password. That fallback exists for offline UI work only — it is not how the deployed site behaves. See Demo mode.

Tech stack
React 19 + Vite 8
Tailwind CSS v3
React Router v7
Lucide React icons
Supabase — Auth (email/password), Postgres with RLS, Storage, Realtime
Getting started
npm install
npm run dev
Then open the printed local URL (usually http://localhost:5173).

npm run build     # production bundle into dist/
npm run preview   # serve the built bundle locally
npm run lint      # oxlint
Environment variables
Create .env.local (it is gitignored) with:

Variable	Required	Purpose
VITE_SUPABASE_URL	Yes	Supabase project URL
VITE_SUPABASE_ANON_KEY	Yes	Supabase anon/public key
VITE_APP_URL	Yes (for email confirmation)	Public origin used to build the auth return address, e.g. https://your-domain.com. Must match the origin registered with Supabase — see Registering the return address with Supabase.
The client also accepts NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as fallbacks.

Never put the Supabase service_role key in any VITE_ variable. Everything prefixed with VITE_ is compiled into the browser bundle. The anon key is safe to expose because row-level security — not the key — controls what each user can read and write.

Database setup
The schema, security policies, triggers, and storage bucket live in database.sql. Incremental changes are in migrations/.

Run them in the Supabase SQL editor, in this order, for a fresh project:

database.sql — tables, RLS policies, triggers, indexes, storage bucket
migrations/2026-09-05-role-hardening.sql
migrations/2026-09-05-reviews-notifications.sql
migrations/2026-10-08-profiles-contact-columns.sql
migrations/2026-10-15-domain-scoping.sql — adds profiles.domain and tasks.domain, the five-slug check constraints and the backfill from category. Additive: it changes no policy, trigger or function, so the portal still behaves exactly as before.
migrations/2026-10-15-seed-domain-coordinators.sql — only when provisioning the five domain coordinators, and only after their auth users exist (see STEP A inside the file; it aborts loudly if they do not).
migrations/2026-10-15-domain-isolation.sql — the security boundary. Redefines is_admin() to mean super-admin only, adds the domain-aware helpers, and rewrites the task, submission, notification and storage policies plus the submission trigger and the notification fan-out. This is the step that makes a coordinator see only their own domain.
migrations/2026-10-15-signup-domain.sql — persists the domain a student picks on the signup form (it arrives as user metadata, which the browser cannot write into profiles directly).
migrations/2026-10-16-profile-domain-hardening.sql — run last. Restores the domain lock, the orphan-task check and the resubmission rule that step 7 replaced wholesale, and adds what the portal now offers: students editing their own name, roll number, branch and year and claiming a domain once, and a coordinator editing the roster of their own domain.
All of them are idempotent (if not exists / or replace), so re-running is safe. Order matters for steps 7 → 9: step 7 replaces the guard functions entirely and re-opens three of them, which is why step 9 exists and must come after it. The check that proves this ordering is real, rather than folklore, is in DOMAIN_COORDINATOR_PLAN.md (Part C.0).

Step 7 refuses to run while any student or coordinator has no domain — after it, those accounts match no domain and would see an empty portal. It reports how many there are and how to proceed. See Domain coordinators below.

What this sets up:

Tables: profiles, tasks, submissions, notifications
Storage: a private task-submissions bucket; uploads are read back through short-lived signed URLs
Realtime: profiles, tasks, submissions, notifications (the app falls back to polling every 25 s if Realtime is unavailable)
Accounts and roles
There are two roles, stored in profiles.role:

student — sees tasks assigned to them, submits work, sees their own submissions and notifications.
coordinator — creates and assigns tasks, reviews submissions, manages students. (admin is accepted as a synonym.)
Students register themselves. /signup creates a student account; a database trigger creates the matching profile row. Note the email-domain restriction in Known gaps.

Domain coordinators
Each of the five club domains can have one coordinator whose access is limited to that domain. This is enforced in the database, by row-level security — not by the UI, so it holds even against a hand-made API call with a valid token.

is_admin() now means super-admin (role = 'admin', the club lead, who sees all five domains). It previously meant "any coordinator", which is why any coordinator could once touch every domain's tasks.
current_domain() returns the caller's domain; can_access_domain(d) answers whether they may act on domain d; is_staff() means "a coordinator or a super-admin".
A new task's domain is assigned from its creator's profile by a database trigger, so the value is never taken from the browser.
A coordinator is notified of, and can review, only submissions belonging to their own domain's tasks.
Two limits worth knowing: profiles remain readable by every signed-in user (see Known gaps), and a student with no domain sees nothing — which is why migration step 7 refuses to run while such accounts exist.

Coordinators do not. Public signup always produces a student — the database enforces this, so choosing the coordinator tab during signup does not grant coordinator access. Coordinator accounts are provisioned by an administrator through the Supabase dashboard, then a profile is given role = 'coordinator'.

The role a user actually has always comes from their profile row in the database, never from client-supplied metadata. On login the account's real role must match the portal tab chosen; a mismatch signs the session out and shows "Access Denied" rather than silently redirecting.

Domains
Tasks carry a domain category. The five club domains are:

Technical domain
Graphical domain
PR and Management domain
3D Animation and VFX domain
Parametric Modelling and Simulation domain
Sign-in
Email + password through Supabase Auth. Credentials are validated server-side; a wrong password is rejected with the provider's error — there is no local bypass when a backend is configured.
Email confirmation. If the project requires users to confirm their address, the link in that email returns to /auth/callback, so confirming lands on a working page rather than the public landing page.
Social sign-in is deliberately not offered: no third-party provider is configured, and every account is created through the registration form so that the domain choice is captured. The only return address comes from src/lib/authRedirect.js, so there is exactly one URL to register with the provider.

Registering the return address with Supabase
This step is required for email confirmation to work on the live site. On a developer's laptop the flow can appear to work by accident, because the browser is already on an allowlisted localhost origin. On the real domain it fails until the URL below is registered.

In the Supabase dashboard go to Authentication → URL Configuration:

Field	Value
Site URL	the production origin, e.g. https://nexura.example.com
Redirect URLs	one entry per environment — both the origin and the callback path
https://nexura.example.com
https://nexura.example.com/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback
Replace nexura.example.com with the real domain. The allowlist must match VITE_APP_URL exactly. If VITE_APP_URL is unset the app derives the return address from the browser's current origin, which makes every Vercel preview URL a separate return address that would also need allowlisting — pinning VITE_APP_URL to the production origin avoids that.

Symptoms of getting this wrong: a callback that lands back on the site with no session and no error message, or a confirmation link that returns an error.

Demo mode (no backend configured)
When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent at build time, src/supabaseClient.js substitutes a no-op client. In that mode the app uses the sample data in src/data/mockData.js, accepts any password on the login screen, and keeps changes in memory — a page refresh resets everything. Nothing is persisted and no file is uploaded.

Demo mode also accepts a signup without creating an account. That fallback is deliberately not used when a backend is configured: a failed registration is now reported to the user instead of quietly minting a local session, which previously made a failed signup look successful while no account existed in the database.

Project structure
src/
  components/     Reusable UI: Sidebar, Navbar, StatCard, TaskCard, StatusBadge,
                  Modal, FileUpload, SubmissionTable, NotificationCard, Skeleton, etc.
  context/        AppContext — auth session, live Supabase data, and all mutations
  data/           mockData.js — sample data and date/status helpers (demo mode only)
  hooks/          useNexura.js — Supabase calls (auth, tasks, submissions, storage)
  layouts/        StudentLayout and AdminLayout (sidebar + navbar shells)
  lib/            roleGuard.js, authRedirect.js, sanitizeUrl.js, submissionFile.js
  pages/
    public/       Landing, Login, Signup, AuthCallback (auth return route)
    student/      Dashboard, MyTasks, TaskDetails, SubmitTask, MySubmissions,
                  SubmissionDetails, Notifications, Profile
    admin/        Dashboard, ManageTasks, CreateTask, Students, Submissions,
                  ReviewSubmission, Notifications, Profile
  App.jsx         Routes + auth guards
  supabaseClient.js
Routes under /student and /coordinator are guarded by ProtectedRoute. The legacy /admin/* paths redirect to their /coordinator/* equivalents.

Pages are loaded on demand (React.lazy + Suspense in App.jsx): the public entry pages ship eagerly, and the portal pages download only when a signed-in user opens them. Third-party libraries are grouped into a single long-lived vendor chunk (see vite.config.js) so they stay cached across deploys.

Deploying to Vercel
Push this repository to GitHub.
In Vercel, "Add New Project" -> import the repo. Framework preset Vite, build npm run build, output dist (usually auto-detected).
Add the environment variables from the table above to the project.
In Supabase, under Authentication -> URL Configuration, add the production origin and {origin}/auth/callback to the redirect allowlist (http://localhost:5173 and its /auth/callback too, for local development).
vercel.json already rewrites all paths to /index.html, which client-side routing requires.

What changed most recently (2026-10-17)
Listed here because they replace what older notes in this repo said:

Students can edit their own profile on /student/profile: name, roll number, branch and year. Email is read-only — it belongs to Auth.
A student chooses their club domain once, from the same page. Until then the page says so; afterwards the field is a read-only chip and the database refuses a change (only the club may move them).
A coordinator maintains their own domain's roster on /coordinator/students: search, a domain filter with live counts, and an edit dialog. They are offered only their own domain, and only for a student who has none.
Resubmitting after a rejection works. The guard that blocked it was restored, and the whole flow has been driven end to end: the rejected attempt stays as history, the resubmission is filed as Attempt 2 / Pending, and every view agrees.
The offline demo keeps its own work. Its refresh/polling callback used to re-seed the mock rows a few seconds after any change, so a new submission (or a review, or a roster edit) quietly disappeared.
The whole database was re-verified: 42/42 checks across a fresh install of database.sql, the 2026-10-15 chain, and the 2026-10-16 hardening file. See DOMAIN_COORDINATOR_PLAN.md Part C.
Known gaps
These are real and unaddressed; they are listed so nobody assumes the code works differently than it does.

Signup rejects any address that does not end in .com (isUniversityEmail). A student using an .edu, .ac.in, .org, or the club's own @nexura.club address cannot register, and the signup form's placeholder (you@nexura.club) advertises an address the rule refuses. Decide the club's real policy and either widen the pattern or correct the placeholder — as written, this blocks real students even though the route now works.
Profile rows are readable by every signed-in user. Profiles read all is using (true), so any authenticated account can read every name, email, roll number and branch — including across domains. Scoping it is a small, self-contained change (the exact policy is quoted at the end of migrations/2026-10-15-domain-isolation.sql), but it changes what the roster and name resolution render, so it needs checking against the live project. See DOMAIN_COORDINATOR_PLAN.md.
Domain isolation is not yet verified against the live project. The policies are written and a coordinator's reach is proven against a real Postgres with simulated JWT claims, but not with the live project's own tokens (see Part C.0 of DOMAIN_COORDINATOR_PLAN.md). The Supabase dashboard bypasses RLS, so testing there proves nothing.
The auth redirect allowlist is not part of this repo — it must be configured in the Supabase dashboard per environment. See Registering the return address with Supabase.
