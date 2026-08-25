import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  STUDENTS,
  TASKS,
  SUBMISSIONS,
  NOTIFICATIONS_STUDENT,
  NOTIFICATIONS_ADMIN,
  ADMIN_USER,
  CURRENT_STUDENT_ID,
  getStudentById,
} from "../data/mockData";

const AppContext = createContext(null);

let idCounter = 100;
const nextId = (prefix) => `${prefix}${idCounter++}`;

export function AppProvider({ children }) {
  // ---- Auth ----
  const [auth, setAuth] = useState(null); // { role: 'student' | 'admin', user }

  const login = useCallback((role, email) => {
    if (role === "admin") {
      setAuth({ role: "admin", user: ADMIN_USER });
    } else {
      const student = STUDENTS.find((s) => s.email.toLowerCase() === email.toLowerCase()) || getStudentById(CURRENT_STUDENT_ID);
      setAuth({ role: "student", user: student });
    }
  }, []);

  const signup = useCallback((name, email) => {
    const newStudent = {
      id: nextId("s"),
      name,
      email,
      rollNo: "NEW" + Math.floor(1000 + Math.random() * 9000),
      branch: "Computer Science",
      year: "1st Year",
      avatarColor: "#7C3AED",
      joined: "2026-08-23",
    };
    setStudents((prev) => [...prev, newStudent]);
    setAuth({ role: "student", user: newStudent });
  }, []);

  const logout = useCallback(() => setAuth(null), []);

  // ---- Core data ----
  const [students, setStudents] = useState(STUDENTS);
  const [tasks, setTasks] = useState(TASKS);
  const [submissions, setSubmissions] = useState(SUBMISSIONS);
  const [studentNotifs, setStudentNotifs] = useState(NOTIFICATIONS_STUDENT);
  const [adminNotifs, setAdminNotifs] = useState(NOTIFICATIONS_ADMIN);

  // ---- Toasts ----
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((message, type = "success") => {
    const id = nextId("toast");
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Task actions ----
  const createTask = useCallback((task) => {
    const newTask = {
      ...task,
      id: nextId("t"),
      createdAt: "2026-08-23",
    };
    setTasks((prev) => [newTask, ...prev]);
    // Notify assigned students conceptually (admin-side notif only in this mock)
    setAdminNotifs((prev) => [
      { id: nextId("an"), type: "task", title: "Task created", message: `'${newTask.title}' was created and assigned to ${newTask.assignedTo.length} student(s).`, time: "2026-08-23T12:00:00", read: true, link: "/admin/tasks" },
      ...prev,
    ]);
    pushToast("Task created and assigned successfully");
    return newTask;
  }, [pushToast]);

  const updateTask = useCallback((taskId, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    pushToast("Task updated successfully");
  }, [pushToast]);

  const deleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSubmissions((prev) => prev.filter((s) => s.taskId !== taskId));
    pushToast("Task removed", "danger");
  }, [pushToast]);

  // ---- Submission actions ----
  const submitTask = useCallback((taskId, studentId, payload, attempt = 1) => {
    const newSub = {
      id: nextId("sub"),
      taskId,
      studentId,
      status: "pending",
      submittedAt: "2026-08-23T12:00:00",
      fileName: payload.fileName || "",
      githubUrl: payload.githubUrl || "",
      liveUrl: payload.liveUrl || "",
      notes: payload.notes || "",
      feedback: "",
      reviewedAt: null,
      attempt,
    };
    setSubmissions((prev) => [newSub, ...prev]);
    const task = tasks.find((t) => t.id === taskId);
    setAdminNotifs((prev) => [
      { id: nextId("an"), type: "pending", title: "New submission", message: `${getStudentById(studentId)?.name || "A student"} submitted '${task?.title || "a task"}'.`, time: "2026-08-23T12:00:00", read: false, link: `/admin/submissions/${newSub.id}` },
      ...prev,
    ]);
    pushToast(attempt > 1 ? "Resubmitted successfully" : "Task submitted successfully");
    return newSub;
  }, [pushToast, tasks]);

  const reviewSubmission = useCallback((submissionId, status, feedback) => {
    let updated = null;
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          updated = { ...s, status, feedback, reviewedAt: "2026-08-23T12:00:00" };
          return updated;
        }
        return s;
      })
    );
    setTimeout(() => {
      if (updated) {
        const task = tasks.find((t) => t.id === updated.taskId);
        setStudentNotifs((prev) => [
          {
            id: nextId("n"),
            type: status,
            title: status === "approved" ? "Submission approved" : "Changes requested",
            message: `Your submission for '${task?.title || "a task"}' was ${status === "approved" ? "approved" : "sent back with feedback"}.`,
            time: "2026-08-23T12:00:00",
            read: false,
            link: `/student/submissions/${updated.id}`,
          },
          ...prev,
        ]);
      }
    }, 0);
    pushToast(status === "approved" ? "Submission approved" : "Submission rejected with feedback", status === "approved" ? "success" : "danger");
  }, [pushToast, tasks]);

  const removeSubmission = useCallback((submissionId) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    pushToast("Submission removed", "danger");
  }, [pushToast]);

  // ---- Notification actions ----
  const markNotifRead = useCallback((role, id) => {
    if (role === "student") {
      setStudentNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } else {
      setAdminNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  }, []);

  const markAllNotifRead = useCallback((role) => {
    if (role === "student") {
      setStudentNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } else {
      setAdminNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, []);

  const value = useMemo(
    () => ({
      auth,
      login,
      signup,
      logout,
      students,
      tasks,
      submissions,
      studentNotifs,
      adminNotifs,
      toasts,
      pushToast,
      dismissToast,
      createTask,
      updateTask,
      deleteTask,
      submitTask,
      reviewSubmission,
      removeSubmission,
      markNotifRead,
      markAllNotifRead,
    }),
    [auth, login, signup, logout, students, tasks, submissions, studentNotifs, adminNotifs, toasts, pushToast, dismissToast, createTask, updateTask, deleteTask, submitTask, reviewSubmission, removeSubmission, markNotifRead, markAllNotifRead]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
