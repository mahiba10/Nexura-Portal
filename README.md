# Nexura — Student Task Management Portal

Task management portal for Nexura, a college technical club. Students receive task assignments, submit their work, and coordinators review it.

The app is not a mock-up. It runs against a real Supabase backend: real accounts, real Postgres storage, row-level security, file uploads, and live updates. All state that matters lives in the database.

If the Supabase environment variables are missing, the app falls back to a local demo mode that runs entirely in the browser with sample data and accepts any password. That fallback exists for offline UI work only — it is not how the deployed site behaves. See Demo mode.

---

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS v3
- React Router v7
- Lucide React icons
- Supabase — Auth (email/password), Postgres with RLS, Storage, Realtime

---

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

```bash
npm run build     # production bundle into dist/
npm run preview   # serve the built bundle locally
npm run lint      # oxlint
```

---

## Environment Variables

Create `.env.local` (it is gitignored) with:

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_APP_URL` | Yes (for email confirmation) | Public origin used to build the auth return address, e.g. `https://your-domain.com`. Must match the origin registered with Supabase. |

The client also accepts `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as fallbacks.

**Security:** Never put the Supabase `service_role` key in any `VITE_` variable. Everything prefixed with `VITE_` is compiled into the browser bundle. The anon key is safe to expose because row-level security — not the key — controls what each user can read and write.

---

## Database Setup

The schema, security policies, triggers, and storage bucket live in `database.sql`. Incremental changes are in `migrations/`.

Run them in the Supabase SQL editor, in this order, for a fresh project:

1. `database.sql` — tables, RLS policies, triggers, indexes, storage bucket
2. `migrations/2026-09-05-role-hardening.sql`
3. `migrations/2026-09-05-reviews-notifications.sql`
4. `migrations/2026-10-08-profiles-contact-columns.sql`
5. `migrations/2026-10-15-domain-scoping.sql`
6. `migrations/2026-10-15-seed-domain-coordinators.sql`
7. `migrations/2026-10-15-domain-isolation.sql`
8. `migrations/2026-10-15-signup-domain.sql`
9. `migrations/2026-10-16-profile-domain-hardening.sql`

**Important:** Follow the instructions inside the migration files. Step 6 is conditional and should only be run when provisioning domain coordinators after their Auth users exist. Step 7 requires all students and coordinators to have a domain assigned.

All migrations are idempotent, so re-running them is safe. Order matters for steps 7–9. See `DOMAIN_COORDINATOR_PLAN.md` (Part C.0).

### What This Sets Up

- **Tables:** `profiles`, `tasks`, `submissions`, `notifications`
- **Storage:** A private `task-submissions` bucket; uploads are read back through short-lived signed URLs.
- **Realtime:** `profiles`, `tasks`, `submissions`, `notifications`. The app falls back to polling every 25 seconds if Realtime is unavailable.

---

## Accounts and Roles

There are two roles, stored in `profiles.role`:

- **Student:** Sees assigned tasks, submits work, and sees their own submissions and notifications.
- **Coordinator:** Creates and assigns tasks, reviews submissions, and manages students. (`admin` is accepted as a synonym.)

Students register themselves through `/signup`. A database trigger creates the matching profile row. See Known Gaps for the email-domain restriction.

---

## Domain Coordinators

Each of the five club domains can have one coordinator whose access is limited to that domain. This is enforced in the database through row-level security, not just by the UI.

- `is_admin()` means super-admin only (role = `admin`, the club lead).
- `current_domain()` returns the caller's domain.
- `can_access_domain(d)` checks whether the caller may act on domain `d`.
- `is_staff()` means a coordinator or a super-admin.
- A new task's domain is assigned by a database trigger using its creator's profile.
- A coordinator receives notifications about and can review only submissions belonging to their domain's tasks.

**Important notes:**

- Profiles remain readable by every signed-in user.
- A student with no domain sees nothing.
- Coordinators are provisioned by an administrator through the Supabase dashboard.
- Public signup always creates a student account. Selecting the coordinator tab does not grant coordinator access.
- The role is determined by the database profile, never by client-supplied metadata.
- If the login portal selected does not match the user's actual role, the session is signed out and "Access Denied" is shown.

---

## Domains

The five club domains are:

1. Technical domain
2. Graphical domain
3. PR and Management domain
4. 3D Animation and VFX domain
5. Parametric Modelling and Simulation domain

---

## Sign-In

Email and password authentication through Supabase Auth. Credentials are validated server-side. When a backend is configured, an incorrect password is rejected by the provider.

### Email Confirmation

If email confirmation is required, the confirmation link returns to `/auth/callback`.

### Social Sign-In

Social sign-in is deliberately not offered. No third-party provider is configured, and every account is created through the registration form so that the domain choice is captured.

The only return address comes from `src/lib/authRedirect.js`.

---

## Registering the Return Address with Supabase

In the Supabase dashboard, go to **Authentication → URL Configuration**.

**Site URL:**

```text
https://nexura.example.com
```

**Redirect URLs:**

```text
https://nexura.example.com
https://nexura.example.com/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback
```

Replace `nexura.example.com` with the real domain.

The allowlist must match `VITE_APP_URL` exactly. If `VITE_APP_URL` is unset, the app derives the return address from the browser's current origin, which means each Vercel preview URL would also need allowlisting.

**Symptoms of incorrect configuration:**

- A callback returns to the site with no session and no error message.
- A confirmation link returns an error.

---

## Demo Mode (No Backend Configured)

When `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are absent at build time, `src/supabaseClient.js` substitutes a no-op client.

In this mode:

- The app uses sample data from `src/data/mockData.js`.
- Any password is accepted on the login screen.
- Changes are kept in memory and reset when the page is refreshed.
- Nothing is persisted and no file is uploaded.
- Signup is accepted without creating a real account.

When a backend is configured, failed registrations are reported to the user instead of creating a local session.

---

## Project Structure

```text
src/
├── components/     # Reusable UI components
├── context/        # AppContext — auth session, live data and mutations
├── data/           # mockData.js — demo data and date/status helpers
├── hooks/          # useNexura.js — Supabase calls
├── layouts/        # StudentLayout and AdminLayout
├── lib/            # Role guards, auth redirects and utilities
├── pages/
│   ├── public/     # Landing, Login, Signup, AuthCallback
│   ├── student/    # Student task and submission pages
│   └── admin/      # Coordinator management pages
├── App.jsx         # Routes and auth guards
└── supabaseClient.js
```

Routes under `/student` and `/coordinator` are guarded by `ProtectedRoute`. Legacy `/admin/*` paths redirect to their `/coordinator/*` equivalents.

Pages are loaded on demand using `React.lazy` and `Suspense`. Public entry pages load eagerly, while portal pages download when a signed-in user opens them.

Third-party libraries are grouped into a single long-lived vendor chunk in `vite.config.js` to improve caching across deployments.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, select **Add New Project** and import the repository.
3. Select Vite as the framework preset.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Add the required environment variables.
7. Configure the production origin and `/auth/callback` in Supabase Authentication settings.
8. Deploy the application.

`vercel.json` already rewrites all paths to `/index.html`, which client-side routing requires.

---

## What Changed Most Recently (2026-10-17)

- Students can edit their own profile at `/student/profile`: name, roll number, branch and year. Email is read-only.
- Students choose their club domain once. The database prevents subsequent changes.
- Coordinators manage their own domain's roster at `/coordinator/students`, including search, domain filtering, live counts and editing eligible students.
- Resubmission after rejection works. The rejected attempt stays in history, and the resubmission is filed as Attempt 2 / Pending.
- The offline demo no longer silently resets mock data after changes.
- The database was re-verified with 42/42 checks across a fresh install of `database.sql`, the 2026-10-15 migration chain, and the 2026-10-16 hardening file.

See `DOMAIN_COORDINATOR_PLAN.md` Part C.

---

## Known Gaps

These issues are real and remain unaddressed.

### 1. Signup Email Restriction

Signup rejects any address that does not end in `.com` (`isUniversityEmail`). Addresses ending in `.edu`, `.ac.in`, `.org`, or the club's own `@nexura.club` cannot register, even though the signup placeholder suggests that `you@nexura.club` is accepted.

The club's email policy needs to be decided, and the validation pattern or placeholder must be corrected.

### 2. Profile Data Visibility

Profile rows are readable by every signed-in user. The `profiles read all` policy uses `(true)`, allowing authenticated accounts to read names, email addresses, roll numbers and branches across domains.

Scoping this policy requires checking the roster and name-resolution behavior against the live project. See `DOMAIN_COORDINATOR_PLAN.md` and the end of `migrations/2026-10-15-domain-isolation.sql`.

### 3. Live Domain-Isolation Verification

Domain isolation has been tested against a real PostgreSQL environment with simulated JWT claims, but not against the live project's own tokens.

The Supabase dashboard bypasses RLS, so testing there does not prove that the live policies work correctly.

See Part C.0 of `DOMAIN_COORDINATOR_PLAN.md`.

### 4. Authentication Redirect Configuration

The authentication redirect allowlist is not part of this repository. It must be configured in the Supabase dashboard for each environment.

See Registering the Return Address with Supabase.

---

## License

No license has been specified yet. Add a `LICENSE` file if you intend to publish the project under a particular open-source license.

