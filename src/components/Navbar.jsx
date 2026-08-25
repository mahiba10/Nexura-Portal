import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, Search } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Navbar({ role, title, onOpenMobile, showSearch = false, searchValue, onSearchChange, searchPlaceholder = "Search..." }) {
  const navigate = useNavigate();
  const { studentNotifs, adminNotifs } = useApp();
  const notifs = role === "admin" ? adminNotifs : studentNotifs;
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-nexura-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onOpenMobile} className="lg:hidden text-nexura-200 shrink-0">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-display font-bold text-lg sm:text-xl text-white truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {showSearch && (
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-64">
              <Search className="w-4 h-4 text-slate shrink-0" />
              <input
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="bg-transparent outline-none text-sm w-full placeholder:text-slate/60"
              />
            </div>
          )}
          <button
            onClick={() => navigate(`/${role}/notifications`)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-nexura-200 hover:bg-white/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent-fuchsia text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
