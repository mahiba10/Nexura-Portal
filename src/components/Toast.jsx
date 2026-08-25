import React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

const STYLES = {
  success: { icon: CheckCircle2, classes: "bg-nexura-950 text-white", iconColor: "text-emerald-400" },
  danger: { icon: XCircle, classes: "bg-nexura-950 text-white", iconColor: "text-red-400" },
  info: { icon: Info, classes: "bg-nexura-950 text-white", iconColor: "text-nexura-300" },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[calc(100%-2.5rem)] max-w-sm">
      {toasts.map((t) => {
        const style = STYLES[t.type] || STYLES.success;
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-2xl ${style.classes} animate-[slideUp_0.25s_ease-out]`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
            <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-white/50 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
