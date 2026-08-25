import React from "react";

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-nexura-500/15 text-nexura-400 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="font-display font-semibold text-white mb-1.5">{title}</h3>
      {message && <p className="text-sm text-slate max-w-sm mb-5">{message}</p>}
      {action}
    </div>
  );
}
