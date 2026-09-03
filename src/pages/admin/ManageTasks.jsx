import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  PlusSquare,
  ListChecks,
  CalendarDays,
  Users,
  Trash2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import supabase from "../../supabaseClient";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ManageTasks() {
  const { deleteTask } = useApp();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [query, setQuery] = useState("");
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [taskResult, submissionResult] = await Promise.all([
          supabase
            .from("tasks")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("submissions")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        if (!active) return;

        if (taskResult.error) throw taskResult.error;
        if (submissionResult.error) throw submissionResult.error;

        setTasks(taskResult.data || []);
        setSubmissions(submissionResult.data || []);
      } catch (error) {
        console.error("Failed to fetch tasks data:", error);
        setTasks([]);
        setSubmissions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      tasks
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tasks, query],
  );

  const submissionCount = (taskId) =>
    submissions.filter((s) => s.task_id === taskId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 w-full sm:w-72 shadow-sm">
          <Search className="w-4 h-4 text-slate shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate/60"
          />
        </div>
        <Link to="/coordinator/tasks/create" className="btn-primary text-sm">
          <PlusSquare className="w-4 h-4" /> Create Task
        </Link>
      </div>

      {loading ? (
        <div className="card p-6 text-sm text-slate">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="No tasks found"
            message="Create your first task to get started."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => (
            <div key={task.id} className="card p-5 flex flex-col gap-3.5">
              <div>
                <p className="text-xs font-semibold text-nexura-400 mb-1">
                  {task.category || "General"}
                </p>
                <h3 className="font-display font-semibold text-white leading-snug">
                  {task.title}
                </h3>
              </div>
              <p className="text-sm text-slate line-clamp-2">
                {task.description}
              </p>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-slate">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Due{" "}
                  {formatDate(task.deadline)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />{" "}
                  {Array.isArray(task.assigned_to)
                    ? task.assigned_to.length
                    : 0}{" "}
                  assigned
                </span>
                <span className="text-nexura-300 font-medium">
                  {submissionCount(task.id)} submitted
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <Link
                  to={`/coordinator/submissions?task=${task.id}`}
                  className="btn-ghost text-sm flex-1 justify-center bg-white/5"
                >
                  View Submissions
                </Link>
                <button
                  onClick={() => setTaskToDelete(task)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          deleteTask(taskToDelete.id);
          setTaskToDelete(null);
        }}
        title="Remove this task?"
        message={`This will permanently remove "${taskToDelete?.title}" and all of its submissions. This action cannot be undone.`}
        confirmLabel="Remove Task"
        danger
      />
    </div>
  );
}
