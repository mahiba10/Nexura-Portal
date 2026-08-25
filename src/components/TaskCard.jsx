import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Layers, Award } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDate, daysUntil, isOverdue } from "../data/mockData";

const DIFFICULTY_COLOR = {
  Beginner: "text-emerald-400 bg-emerald-500/10",
  Intermediate: "text-amber-400 bg-amber-500/10",
  Advanced: "text-red-400 bg-red-500/10",
};

export default function TaskCard({ task, status, to }) {
  const overdue = isOverdue(task.deadline, status) && status !== "approved";
  const displayStatus = overdue && status === "not_submitted" ? "overdue" : status;
  const days = daysUntil(task.deadline);

  return (
    <Link
      to={to}
      className="card p-5 flex flex-col gap-3.5 hover:shadow-card-hover hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-nexura-400 mb-1">{task.category}</p>
          <h3 className="font-display font-semibold text-white leading-snug group-hover:text-nexura-300 transition-colors">
            {task.title}
          </h3>
        </div>
        {displayStatus && <StatusBadge status={displayStatus} size="sm" />}
      </div>

      <p className="text-sm text-slate line-clamp-2">{task.description}</p>

      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-slate mt-1">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          Due {formatDate(task.deadline)}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${DIFFICULTY_COLOR[task.difficulty]}`}>
          <Layers className="w-3 h-3" />
          {task.difficulty}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          {task.points} pts
        </span>
      </div>

      {status === "not_submitted" && !overdue && days >= 0 && (
        <p className="text-xs font-medium text-nexura-400">
          {days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left`}
        </p>
      )}
    </Link>
  );
}
