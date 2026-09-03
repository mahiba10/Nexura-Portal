import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  FolderCheck,
  Bell,
  User,
  X,
  PlusSquare,
  Users,
  Inbox,
  Zap,
  LogOut,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const STUDENT_LINKS = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/student/submissions", label: "My Submissions", icon: FolderCheck },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile", icon: User },
];

const COORDINATOR_LINKS = [
  { to: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coordinator/tasks", label: "Manage Tasks", icon: ListChecks },
  { to: "/coordinator/tasks/create", label: "Create Task", icon: PlusSquare },
  { to: "/coordinator/students", label: "Students", icon: Users },
  { to: "/coordinator/submissions", label: "Submissions", icon: Inbox },
  { to: "/coordinator/notifications", label: "Notifications", icon: Bell },
  { to: "/coordinator/profile", label: "Profile", icon: User },
];

export default function Sidebar({ role, mobileOpen, onCloseMobile }) {
  const { auth, logout } = useApp();
  const links = role === "coordinator" ? COORDINATOR_LINKS : STUDENT_LINKS;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-nexura-950/60 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-nexura-gradient text-white flex flex-col z-50 border-r border-white/5 shadow-2xl shadow-black/40 transition-transform duration-300 shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cta-gradient flex items-center justify-center shrink-0 shadow-glow-purple">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <p className="font-display font-extrabold text-lg tracking-wide leading-none">
                NEXURA
              </p>
              <p className="text-[11px] text-nexura-200 mt-1">
                {role === "coordinator"
                  ? "Coordinator Portal"
                  : "Member Portal"}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-nexura-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/12 text-white shadow-sm"
                    : "text-nexura-200 hover:text-white hover:bg-white/8"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: auth?.user?.avatarColor || "#7C3AED" }}
            >
              {auth?.user?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {auth?.user?.name}
              </p>
              <p className="text-xs text-nexura-300 truncate">
                {auth?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-nexura-200 hover:text-white hover:bg-white/8 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
