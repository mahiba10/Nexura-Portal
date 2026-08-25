# Nexura — Student Task Management Portal

A frontend-only task management portal for **Nexura**, a college technical club. Built with React, Vite, Tailwind CSS, React Router, and Lucide React. All data is mocked and held in local React state — there is no backend, database, or real authentication.

## Tech stack

- React 19 + Vite
- Tailwind CSS (v3)
- React Router v7
- Lucide React icons

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Logging in

This is a frontend demo with mock authentication — any password works.

- **Student login:** use the pre-filled email (`aarav.mehta@nexura.club`) on the login screen, or switch to any student email from `src/data/mockData.js` (e.g. `diya.kapoor@nexura.club`).
- **Coordinator/Admin login:** toggle to "Coordinator" on the login screen and submit with any email/password.
- **Sign up:** creates a new mock student account and logs you straight into the student dashboard.

## Project structure

```
src/
  components/     Reusable UI: Sidebar, Navbar, StatCard, TaskCard, StatusBadge,
                   Modal, FileUpload, SubmissionTable, NotificationCard, etc.
  context/        AppContext — holds all mock state (auth, tasks, submissions,
                   notifications, toasts) and the actions that mutate it.
  data/           mockData.js — seed data (students, tasks, submissions,
                   notifications) plus formatting/status helpers.
  layouts/        StudentLayout and AdminLayout (sidebar + navbar shells).
  pages/
    public/       Landing, Login, Signup
    student/      Dashboard, MyTasks, TaskDetails, SubmitTask, MySubmissions,
                   SubmissionDetails, Notifications, Profile
    admin/        Dashboard, ManageTasks, CreateTask, Students, Submissions,
                   ReviewSubmission, Notifications, Profile
  App.jsx         Route definitions (public / student / admin, route-guarded)
  main.jsx        App entry point
```

## Notes

- All interactions (creating tasks, submitting work, approving/rejecting,
  removing submissions, notifications) are handled with in-memory state in
  `AppContext` — refreshing the page resets the data back to the seed set in
  `mockData.js`.
- File "uploads" only store the selected file's name/size in memory; nothing
  is actually persisted or sent anywhere.

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, "Add New Project" → import the repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output
   directory: `dist`. (Vercel usually detects these automatically.)
4. Deploy.
