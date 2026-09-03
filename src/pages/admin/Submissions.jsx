import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Inbox, X } from "lucide-react";
import supabase from "../../supabaseClient";
import SubmissionTable from "../../components/SubmissionTable";
import EmptyState from "../../components/EmptyState";
import ConfirmDialog from "../../components/ConfirmDialog";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

export default function Submissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const taskFilter = searchParams.get("task") || "all";
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [toRemove, setToRemove] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [submissionResult, taskResult, studentResult] = await Promise.all(
          [
            supabase
              .from("submissions")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase
              .from("tasks")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase
              .from("profiles")
              .select("*")
              .eq("role", "student")
              .order("created_at", { ascending: false }),
          ],
        );

        if (!active) return;

        if (submissionResult.error) throw submissionResult.error;
        if (taskResult.error) throw taskResult.error;
        if (studentResult.error) throw studentResult.error;

        setSubmissions(submissionResult.data || []);
        setTasks(taskResult.data || []);
        setStudents(studentResult.data || []);
      } catch (error) {
        console.error("Failed to fetch submissions data:", error);
        setSubmissions([]);
        setTasks([]);
        setStudents([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

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

  const filtered = useMemo(() => {
    return submissions
      .filter((s) => taskFilter === "all" || s.task_id === taskFilter)
      .filter((s) => status === "all" || s.status === status)
      .filter((s) => {
        if (!query.trim()) return true;
        const student = getStudent(s.student_id);
        const task = getTask(s.task_id);
        const q = query.toLowerCase();
        return (
          (student?.name || "").toLowerCase().includes(q) ||
          (task?.title || "").toLowerCase().includes(q) ||
          (student?.roll_no || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [submissions, taskFilter, status, query, students, tasks]);

  const filterTask = taskFilter !== "all" ? getTask(taskFilter) : null;

  const handleRemoveSubmission = async (submissionId) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      setToRemove(null);
    } catch (error) {
      console.error("Failed to remove submission:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-sm text-slate">Loading submissions…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filterTask && (
        <div className="flex items-center gap-2 bg-nexura-500/10 border border-nexura-500/25 rounded-lg px-3.5 py-2 text-sm w-fit">
          <span className="text-nexura-200">
            Filtering by task: <strong>{filterTask.title}</strong>
          </span>
          <button
            onClick={() => setSearchParams({})}
            className="text-nexura-400 hover:text-nexura-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 w-full sm:w-80 shadow-sm">
          <Search className="w-4 h-4 text-slate shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student, roll no, or task..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate/60"
          />
        </div>
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`text-sm font-medium px-3.5 py-2 rounded-lg capitalize transition-colors ${
                status === f
                  ? "bg-nexura-500 text-white"
                  : "bg-white/5 text-slate border border-white/10 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No submissions found"
            message="Try adjusting your search or filters."
          />
        ) : (
          <SubmissionTable submissions={filtered} onRemove={setToRemove} />
        )}
      </div>

      <ConfirmDialog
        isOpen={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() => handleRemoveSubmission(toRemove.id)}
        title="Remove this submission?"
        message="This will permanently delete the submission record. The student will need to resubmit if this was in error."
        confirmLabel="Remove Submission"
        danger
      />
    </div>
  );
}
