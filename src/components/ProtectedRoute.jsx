import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedRoute({ role, children }) {
  const { auth } = useApp();
  if (!auth || auth.role !== role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
