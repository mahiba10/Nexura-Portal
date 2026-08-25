import React from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import NotificationCard from "../../components/NotificationCard";
import EmptyState from "../../components/EmptyState";

export default function Notifications() {
  const { studentNotifs, markNotifRead, markAllNotifRead } = useApp();
  const sorted = [...studentNotifs].sort((a, b) => new Date(b.time) - new Date(a.time));
  const unreadCount = studentNotifs.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p>
        {unreadCount > 0 && (
          <button onClick={() => markAllNotifRead("student")} className="btn-ghost text-sm">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState icon={Bell} title="No notifications" message="You're all caught up." />
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((n) => (
            <NotificationCard key={n.id} notification={n} onRead={(id) => markNotifRead("student", id)} />
          ))}
        </div>
      )}
    </div>
  );
}
