import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import ToastContainer from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import MyTasks from "./pages/student/MyTasks";
import TaskDetails from "./pages/student/TaskDetails";
import SubmitTask from "./pages/student/SubmitTask";
import MySubmissions from "./pages/student/MySubmissions";
import SubmissionDetails from "./pages/student/SubmissionDetails";
import StudentNotifications from "./pages/student/Notifications";
import StudentProfile from "./pages/student/Profile";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageTasks from "./pages/admin/ManageTasks";
import CreateTask from "./pages/admin/CreateTask";
import Students from "./pages/admin/Students";
import Submissions from "./pages/admin/Submissions";
import ReviewSubmission from "./pages/admin/ReviewSubmission";
import AdminNotifications from "./pages/admin/Notifications";
import AdminProfile from "./pages/admin/Profile";

function AppRoutes() {
  const { auth } = useApp();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={auth ? <Navigate to={auth.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={auth ? <Navigate to={auth.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace /> : <Signup />}
      />

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="tasks/:id" element={<TaskDetails />} />
        <Route path="tasks/:id/submit" element={<SubmitTask />} />
        <Route path="submissions" element={<MySubmissions />} />
        <Route path="submissions/:id" element={<SubmissionDetails />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="tasks" element={<ManageTasks />} />
        <Route path="tasks/create" element={<CreateTask />} />
        <Route path="students" element={<Students />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="submissions/:id" element={<ReviewSubmission />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
