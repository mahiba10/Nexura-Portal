import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/tasks": "Manage Tasks",
  "/admin/tasks/create": "Create Task",
  "/admin/students": "Students",
  "/admin/submissions": "Submissions",
  "/admin/notifications": "Notifications",
  "/admin/profile": "Profile",
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title =
    TITLES[location.pathname] ||
    (location.pathname.includes("/submissions/") ? "Review Submission" :
     location.pathname.includes("/tasks/edit") ? "Edit Task" : "Nexura");

  return (
    <div className="min-h-screen flex bg-surface bg-nexura-radial">
      <Sidebar role="admin" mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar role="admin" title={title} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
