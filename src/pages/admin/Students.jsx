import React, { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import EmptyState from "../../components/EmptyState";
import { formatDate, getSubmissionStatusForTask } from "../../data/mockData";

export default function Students() {
  const { students, tasks, submissions } = useApp();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      (students || []).filter(
        (s) =>
          (s.name || "").toLowerCase().includes(query.toLowerCase()) ||
          (s.rollNo || "").toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  );

  const statsFor = (studentId) => {
    const myTasks = tasks.filter(
      (t) =>
        !t.assignedTo ||
        t.assignedTo.length === 0 ||
        t.assignedTo.includes(studentId),
    );
    const approved = myTasks.filter(
      (t) =>
        getSubmissionStatusForTask(submissions, t.id, studentId) === "approved",
    ).length;
    const pending = myTasks.filter(
      (t) =>
        getSubmissionStatusForTask(submissions, t.id, studentId) === "pending",
    ).length;
    return { total: myTasks.length, approved, pending };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 w-full sm:w-80 shadow-sm">
        <Search className="w-4 h-4 text-slate shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or roll number..."
          className="bg-transparent outline-none text-sm w-full placeholder:text-slate/60"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No students found"
            message="Try a different search term."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const stats = statsFor(s.id);
            return (
              <div key={s.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-semibold shrink-0"
                    style={{ backgroundColor: s.avatarColor || "#7C3AED" }}
                  >
                    {(s.name || "S").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate truncate">{s.rollNo}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-slate">
                  <div className="flex justify-between">
                    <span>Branch</span>
                    <span className="text-white font-medium">{s.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year</span>
                    <span className="text-white font-medium">{s.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joined</span>
                    <span className="text-white font-medium">
                      {formatDate(s.joined)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  <div className="flex-1 text-center">
                    <p className="font-display font-bold text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-slate">Assigned</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-display font-bold text-emerald-400">
                      {stats.approved}
                    </p>
                    <p className="text-xs text-slate">Approved</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-display font-bold text-amber-400">
                      {stats.pending}
                    </p>
                    <p className="text-xs text-slate">Pending</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
