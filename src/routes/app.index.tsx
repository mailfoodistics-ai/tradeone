import React from "react";
import { Navigate } from "react-router-dom";

export default function AppIndex() {
  return <Navigate to="/app/dashboard" replace />;
}
