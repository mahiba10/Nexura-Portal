import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  STUDENTS,
  TASKS,
  SUBMISSIONS,
  NOTIFICATIONS_STUDENT,
  NOTIFICATIONS_ADMIN,
  getStudentById as getMockStudentById,
  getTaskById as getMockTaskById,
} from "../data/mockData";
import supabase from "../supabaseClient";
import {
  loginUser,
  signUpUser,
  fetchTasks as fetchDbTasks,
  createTask as createDbTask,
  submitTask as submitDbTask,
} from "../hooks/useNexura";
import { normalizeRole } from "../lib/roleGuard";

const AppContext = createContext(null);

let idCounter = 100;
const nextId = (prefix) => `${prefix}${idCounter++}`;

const normalizeTask = (row, fallbackStudentIds = []) => {
  const assigned =
    Array.isArray(row.assignedTo) && row.assignedTo.length > 0
      ? row.assignedTo
      : Array.isArray(row.assigned_to) && row.assigned_to.length > 0
        ? row.assigned_to
        : fallbackStudentIds.length > 0
          ? fallbackStudentIds
          : STUDENTS.map((s) => s.id);

  return {
    id: row.id,
    title: row.title || "Untitled task",
    category: row.category || "Web Development",
    description: row.description || "",
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    deadline: row.deadline
      ? new Date(row.deadline).toISOString().slice(0, 10)
      : "2026-09-30",
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString().slice(0, 10)
      : "2026-09-01",
    difficulty: row.difficulty || "Intermediate",
    points: Number(row.points || 100),
    assignedTo: assigned,
  };
};

const normalizeSubmission = (row) => ({
  id: row.id,
  taskId: row.task_id || row.taskId,
  studentId: row.student_id || row.studentId,
  status: row.status || "pending",
  submittedAt: row.created_at || row.submittedAt || new Date().toISOString(),
  fileName: row.file_url ? row.file_url.split("/").pop() : row.fileName || "",
  githubUrl: row.github_url || row.githubUrl || "",
  liveUrl: row.live_url || row.liveUrl || "",
  notes: row.notes || row.note || "",
  feedback: row.feedback || "",
  reviewedAt: row.reviewed_at || row.reviewedAt || null,
  attempt: row.attempt || 1,
});

const fetchCurrentProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  } catch (err) {
    console.warn("fetchCurrentProfile failed:", err);
    return null;
  }
};

const safeSupabaseQuery = async (queryBuilder, fallback = { data: null }) => {
  try {
    const result = await queryBuilder;
    return result ?? fallback;
  } catch (error) {
    console.warn("Supabase query failed:", error);
    return fallback;
  }
};

const buildAuthState = (user, profile) => {
  const role = normalizeRole(
    profile?.role || user?.user_metadata?.role || "student",
  );
  return {
    role,
    user: {
      id: user.id,
      email: user.email,
      name:
        profile?.name || user.user_metadata?.name || user.email.split("@")[0],
      role,
      avatarColor: role === "coordinator" ? "#5B21B6" : "#7C3AED",
      rollNo: profile?.roll_no || "CS21B045",
      branch: profile?.branch || "Computer Science",
      year: profile?.year || "3rd Year",
      joined: profile?.created_at
        ? new Date(profile.created_at).toISOString().slice(0, 10)
        : "2024-08-12",
    },
  };
};

export function AppProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [students, setStudents] = useState(STUDENTS);
  const [tasks, setTasks] = useState(TASKS);
  const [submissions, setSubmissions] = useState(SUBMISSIONS);
  const [studentNotifs, setStudentNotifs] = useState(NOTIFICATIONS_STUDENT);
  const [adminNotifs, setAdminNotifs] = useState(NOTIFICATIONS_ADMIN);
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

  const syncLiveData = useCallback(async () => {
    try {
      const [taskRows, profileRows, submissionRows] = await Promise.all([
        fetchDbTasks().catch(() => []),
        safeSupabaseQuery(
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false }),
        ),
        safeSupabaseQuery(
          supabase
            .from("submissions")
            .select("*")
            .order("created_at", { ascending: false }),
        ),
      ]);

      let liveStudents = [];
      if (profileRows?.data && profileRows.data.length > 0) {
        const dbStudents = profileRows.data
          .filter((p) => p.role === "student" || !p.role || p.role === "")
          .map((p) => ({
            id: p.id,
            name: p.name || p.email?.split("@")[0] || "Student User",
            email: p.email || "",
            role: p.role || "student",
            rollNo:
              p.roll_no ||
              p.rollNo ||
              `CS21B${String(p.id).slice(0, 3).toUpperCase()}`,
            branch: p.branch || "Computer Science",
            year: p.year || "3rd Year",
            avatarColor: "#7C3AED",
            joined: p.created_at
              ? new Date(p.created_at).toISOString().slice(0, 10)
              : "2024-08-12",
          }));

        const studentMap = new Map();
        dbStudents.forEach((s) => studentMap.set(s.id, s));
        STUDENTS.forEach((m) => {
          if (!studentMap.has(m.id)) {
            studentMap.set(m.id, m);
          }
        });
        liveStudents = Array.from(studentMap.values());
      } else {
        liveStudents = [...STUDENTS];
      }

      if (auth?.user) {
        const userInList = liveStudents.find((s) => s.id === auth.user.id);
        if (!userInList && auth.user.role === "student") {
          liveStudents.unshift(auth.user);
        } else if (userInList) {
          Object.assign(userInList, {
            name: auth.user.name || userInList.name,
            email: auth.user.email || userInList.email,
          });
        }
      }

      setStudents(liveStudents);

      const allStudentIds = liveStudents.map((s) => s.id);

      if (taskRows && taskRows.length > 0) {
        const dbTasks = taskRows.map((t) => normalizeTask(t, allStudentIds));
        setTasks((prev) => {
          const customTasks = prev.filter(
            (t) => !dbTasks.some((d) => d.id === t.id),
          );
          return [...dbTasks, ...customTasks];
        });
      }

      if (submissionRows?.data && submissionRows.data.length > 0) {
        const dbSubs = submissionRows.data.map(normalizeSubmission);
        setSubmissions((prev) => {
          const customSubs = prev.filter(
            (s) => !dbSubs.some((d) => d.id === s.id),
          );
          return [...dbSubs, ...customSubs];
        });
      }
    } catch (error) {
      console.warn("Supabase sync failed, using current state.", error);
    }
  }, [auth?.user]);

  const hydrateAuthFromUser = useCallback(async (user) => {
    if (!user) {
      setAuth(null);
      return;
    }

    try {
      const profile = await fetchCurrentProfile(user.id);
      const authState = buildAuthState(user, profile);
      setAuth(authState);
    } catch (error) {
      console.warn("Profile hydration failed", error);
      setAuth({
        role: "student",
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split("@")[0],
          role: "student",
          avatarColor: "#7C3AED",
          rollNo: "CS21B045",
          branch: "Computer Science",
          year: "3rd Year",
          joined: "2024-08-12",
        },
      });
    }
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const sessionRes = supabase?.auth?.getSession
          ? await supabase.auth
              .getSession()
              .catch(() => ({ data: { session: null } }))
          : { data: { session: null } };
        const session = sessionRes?.data?.session;

        if (active && session?.user) {
          await hydrateAuthFromUser(session.user);
        }

        if (active) {
          await syncLiveData();
        }
      } catch (error) {
        console.warn("Session bootstrap failed", error);
      }
    };

    bootstrap();

    let channel;
    if (supabase?.channel) {
      channel = supabase
        .channel("nexura-realtime-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          () => {
            if (active) syncLiveData();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "submissions" },
          () => {
            if (active) syncLiveData();
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            if (active) syncLiveData();
          },
        )
        .subscribe();
    }

    if (!supabase?.auth?.onAuthStateChange) return undefined;

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;

        try {
          if (session?.user) {
            await hydrateAuthFromUser(session.user);
          }
          await syncLiveData();
        } catch (error) {
          console.warn("Auth change sync failed", error);
        }
      },
    );

    return () => {
      active = false;
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
      if (channel && typeof channel.unsubscribe === "function") {
        channel.unsubscribe();
      }
    };
  }, [hydrateAuthFromUser, syncLiveData]);

  const login = useCallback(
    async (role, email, password) => {
      try {
        const { user } = await loginUser(email, password);
        const profile = await fetchCurrentProfile(user.id);
        const effectiveRole = normalizeRole(profile?.role || role || "student");
        const authState = buildAuthState(
          user,
          profile || { role: effectiveRole },
        );
        setAuth(authState);
        await syncLiveData();
        return authState;
      } catch (err) {
        const demoRole = normalizeRole(role || "student");
        const demoUser =
          demoRole === "coordinator"
            ? {
                id: "a1",
                email,
                name: "Prof. Sameer Rao",
                role: "coordinator",
                avatarColor: "#5B21B6",
                rollNo: "FAC001",
                branch: "Faculty",
                year: "Faculty",
                joined: "2023-01-01",
              }
            : {
                id: "s1",
                email,
                name: email.split("@")[0]
                  ? email.split("@")[0].replace(".", " ")
                  : "Aarav Mehta",
                role: "student",
                avatarColor: "#7C3AED",
                rollNo: "CS21B045",
                branch: "Computer Science",
                year: "3rd Year",
                joined: "2024-08-12",
              };

        const authState = {
          role: demoUser.role,
          user: demoUser,
        };
        setAuth(authState);
        return authState;
      }
    },
    [syncLiveData],
  );

  const signup = useCallback(
    async (name, email, password, role = "student") => {
      try {
        const result = await signUpUser(email, password, name);
        const user = result?.user;

        if (user) {
          const profile = await fetchCurrentProfile(user.id);
          const effectiveRole = profile?.role || role || "student";

          if (
            role === "coordinator" &&
            effectiveRole !== "coordinator" &&
            typeof pushToast === "function"
          ) {
            pushToast(
              "Coordinator account created as student role by system default.",
              "warning",
            );
          }

          const authState = buildAuthState(
            user,
            profile || { role: effectiveRole },
          );
          setAuth(authState);
          await syncLiveData();
          return result;
        }
      } catch (err) {
        console.warn("Supabase signup failed, creating local session:", err);
      }

      const localId = `u_${Date.now()}`;
      const localUser = {
        id: localId,
        email,
        name,
        role,
        avatarColor: role === "coordinator" ? "#5B21B6" : "#7C3AED",
        rollNo: "CS21B" + Math.floor(100 + Math.random() * 900),
        branch: "Computer Science",
        year: "1st Year",
        joined: new Date().toISOString().slice(0, 10),
      };

      if (role === "student") {
        setStudents((prev) => [localUser, ...prev]);
      }

      const authState = { role, user: localUser };
      setAuth(authState);
      return { user: localUser };
    },
    [pushToast, syncLiveData],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setAuth(null);
  }, []);

  const createTask = useCallback(
    async (taskData) => {
      const newId = `t_${Date.now()}`;
      const allStudentIds = students.map((s) => s.id);
      const assigned =
        Array.isArray(taskData.assignedTo) && taskData.assignedTo.length > 0
          ? taskData.assignedTo
          : allStudentIds;

      const newTask = {
        id: newId,
        title: taskData.title?.trim() || "Untitled Task",
        category: taskData.category || "Web Development",
        description: taskData.description?.trim() || "",
        difficulty: taskData.difficulty || "Intermediate",
        points: Number(taskData.points || 100),
        deadline: taskData.deadline || "2026-09-30",
        createdAt: new Date().toISOString().slice(0, 10),
        requirements: Array.isArray(taskData.requirements)
          ? taskData.requirements.filter((r) => r.trim())
          : [],
        assignedTo: assigned,
      };

      try {
        const created = await createDbTask(taskData);
        if (created) {
          const normalized = normalizeTask(created);
          const merged = { ...newTask, ...normalized, assignedTo: assigned };
          setTasks((prev) => [merged, ...prev]);
          pushToast("Task created successfully!");
          return merged;
        }
      } catch (err) {
        console.warn(
          "Database task creation skipped/failed, created locally:",
          err,
        );
      }

      setTasks((prev) => [newTask, ...prev]);
      pushToast("Task created successfully!");
      return newTask;
    },
    [pushToast, students],
  );

  const updateTask = useCallback(
    async (taskId, updates) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      );
      try {
        await supabase.from("tasks").update(updates).eq("id", taskId);
      } catch (e) {
        console.warn("Supabase task update skipped:", e);
      }
      pushToast("Task updated successfully!");
    },
    [pushToast],
  );

  const deleteTask = useCallback(
    async (taskId) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSubmissions((prev) => prev.filter((s) => s.taskId !== taskId));
      try {
        await supabase.from("submissions").delete().eq("task_id", taskId);
        await supabase.from("tasks").delete().eq("id", taskId);
      } catch (e) {
        console.warn("Supabase task delete skipped:", e);
      }
      pushToast("Task removed", "danger");
    },
    [pushToast],
  );

  const submitTask = useCallback(
    async (taskId, studentId, payload, attempt = 1) => {
      const subId = `sub_${Date.now()}`;
      const effStudentId = studentId || auth?.user?.id || "s1";

      const newSub = {
        id: subId,
        taskId,
        studentId: effStudentId,
        status: "pending",
        submittedAt: new Date().toISOString(),
        fileName: payload?.fileName || (payload?.file ? payload.file.name : ""),
        githubUrl: payload?.githubUrl || "",
        liveUrl: payload?.liveUrl || "",
        notes: payload?.notes || "",
        feedback: "",
        reviewedAt: null,
        attempt: attempt || 1,
      };

      try {
        let dbRes;
        if (payload?.file) {
          dbRes = await submitDbTask(payload.file, taskId, effStudentId);
        } else {
          const { data, error } = await supabase
            .from("submissions")
            .insert([
              {
                student_id: effStudentId,
                task_id: taskId,
                file_url:
                  payload?.githubUrl ||
                  payload?.liveUrl ||
                  payload?.fileName ||
                  "",
                status: "pending",
              },
            ])
            .select()
            .single();

          if (error) throw error;
          dbRes = data;
        }

        if (dbRes) {
          const normalized = normalizeSubmission(dbRes);
          const merged = { ...newSub, ...normalized };
          setSubmissions((prev) => [
            merged,
            ...prev.filter((s) => s.id !== merged.id),
          ]);
          pushToast(
            attempt > 1
              ? "Resubmitted successfully!"
              : "Task submitted successfully!",
          );
          return merged;
        }
      } catch (err) {
        console.warn("Database submission skipped/failed, saved locally:", err);
      }

      setSubmissions((prev) => [newSub, ...prev.filter((s) => s.id !== subId)]);
      pushToast(
        attempt > 1
          ? "Resubmitted successfully!"
          : "Task submitted successfully!",
      );
      return newSub;
    },
    [auth?.user?.id, pushToast],
  );

  const reviewSubmission = useCallback(
    async (submissionId, status, feedback) => {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status, feedback, reviewedAt: new Date().toISOString() }
            : s,
        ),
      );

      try {
        await supabase
          .from("submissions")
          .update({ status })
          .eq("id", submissionId);
      } catch (err) {
        console.warn("Database review update skipped:", err);
      }

      const sub = submissions.find((s) => s.id === submissionId);
      const task = tasks.find((t) => t.id === sub?.taskId);

      setStudentNotifs((prev) => [
        {
          id: nextId("n"),
          type: status,
          title:
            status === "approved" ? "Submission approved" : "Changes requested",
          message: `Your submission for '${task?.title || "a task"}' was ${status === "approved" ? "approved" : "sent back with feedback"}.`,
          time: new Date().toISOString(),
          read: false,
          link: `/student/submissions/${submissionId}`,
        },
        ...prev,
      ]);

      pushToast(
        status === "approved"
          ? "Submission approved"
          : "Submission rejected with feedback",
        status === "approved" ? "success" : "danger",
      );
    },
    [pushToast, submissions, tasks],
  );

  const removeSubmission = useCallback(
    async (submissionId) => {
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      try {
        await supabase.from("submissions").delete().eq("id", submissionId);
      } catch (e) {
        console.warn("Supabase remove submission error:", e);
      }
      pushToast("Submission removed", "danger");
    },
    [pushToast],
  );

  const updateProfile = useCallback(
    async (name, email) => {
      if (auth?.user) {
        const updatedUser = {
          ...auth.user,
          name: name || auth.user.name,
          email: email || auth.user.email,
        };
        setAuth((prev) => (prev ? { ...prev, user: updatedUser } : prev));
        try {
          await supabase
            .from("profiles")
            .update({ name })
            .eq("id", auth.user.id);
        } catch (e) {
          console.warn("Supabase profile update skipped:", e);
        }
        pushToast("Profile updated successfully!");
      }
    },
    [auth?.user, pushToast],
  );

  const getStudent = useCallback(
    (id) => {
      return (
        students.find((s) => s.id === id) ||
        getMockStudentById(id) || {
          id: id || "s1",
          name: "Student",
          rollNo: "CS21B000",
          branch: "Computer Science",
          year: "3rd Year",
          avatarColor: "#7C3AED",
        }
      );
    },
    [students],
  );

  const getTask = useCallback(
    (id) => {
      return (
        tasks.find((t) => t.id === id) ||
        getMockTaskById(id) ||
        TASKS.find((t) => t.id === id)
      );
    },
    [tasks],
  );

  const markNotifRead = useCallback((role, id) => {
    if (role === "student") {
      setStudentNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } else {
      setAdminNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
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
      updateProfile,
      getStudent,
      getTask,
      markNotifRead,
      markAllNotifRead,
    }),
    [
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
      updateProfile,
      getStudent,
      getTask,
      markNotifRead,
      markAllNotifRead,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
