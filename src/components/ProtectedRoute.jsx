import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { isCoordinatorRole } from "../lib/roleGuard";

export default function ProtectedRoute({ role, children }) {
  const { auth } = useApp();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  const isAllowedCoordinator = isCoordinatorRole(auth.role);

  if (role === "coordinator") {
    if (!isAllowedCoordinator) {
      return <Navigate to="/student/dashboard" replace />;
    }
  } else if (role === "student") {
    if (isAllowedCoordinator) {
      return <Navigate to="/coordinator/dashboard" replace />;
    }
  }

  return children;
}
