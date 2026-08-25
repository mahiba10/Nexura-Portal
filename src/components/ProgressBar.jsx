import React from "react";

export default function ProgressBar({ value, max = 100, showLabel = true, className = "" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate">Progress</span>
          <span className="text-xs font-semibold text-nexura-300">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-nexura-500/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-cta-gradient transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
