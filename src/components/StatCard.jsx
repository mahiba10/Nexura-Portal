import React from "react";

export default function StatCard({ label, value, icon: Icon, tone = "purple", trend }) {
  const tones = {
    purple: "bg-nexura-500/10 text-nexura-300",
    success: "bg-success/10 text-emerald-400",
    warning: "bg-warning/10 text-amber-400",
    danger: "bg-danger/10 text-red-400",
    slate: "bg-white/10 text-nexura-200",
  };
  return (
    <div className="card p-5 flex items-start justify-between hover:shadow-card-hover hover:border-white/20 transition-all duration-200">
      <div>
        <p className="text-sm text-slate font-medium">{label}</p>
        <p className="text-3xl font-display font-bold text-white mt-1.5">{value}</p>
        {trend && <p className="text-xs text-slate mt-1.5">{trend}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
