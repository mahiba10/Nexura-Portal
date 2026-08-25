import React from "react";
import { Clock, CheckCircle2, XCircle, Circle, AlertTriangle } from "lucide-react";

const CONFIG = {
  pending: { label: "Pending", classes: "bg-warning/10 text-amber-400 border-amber-500/30", Icon: Clock },
  approved: { label: "Approved", classes: "bg-success/10 text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
  rejected: { label: "Rejected", classes: "bg-danger/10 text-red-400 border-red-500/30", Icon: XCircle },
  not_submitted: { label: "Not Submitted", classes: "bg-white/10 text-nexura-200 border-white/15", Icon: Circle },
  overdue: { label: "Overdue", classes: "bg-danger/10 text-red-400 border-red-500/30", Icon: AlertTriangle },
};

export default function StatusBadge({ status, size = "md" }) {
  const cfg = CONFIG[status] || CONFIG.not_submitted;
  const { label, classes, Icon } = cfg;
  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${sizeClasses} ${classes}`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {label}
    </span>
  );
}
