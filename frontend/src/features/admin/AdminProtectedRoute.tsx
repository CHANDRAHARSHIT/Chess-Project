import React from "react";
import { Navigate } from "react-router";
import { useAdminSession } from "./useAdminSession";

/** Sends anyone without a live admin session back to the admin sign-in page. */
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAdminSession();

  if (status === "loading") return <div className="w-full min-h-[calc(100vh-4rem)] bg-brand-bg" />;
  if (status === "unauthenticated") return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default AdminProtectedRoute;
