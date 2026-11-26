import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { SpinnerIcon } from "./Icons.jsx";

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-[13px] text-muted">
      <SpinnerIcon className="text-accent" /> Checking your session…
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();
  if (checking) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAuthenticated, isAdmin, checking } = useAuth();
  const location = useLocation();
  if (checking) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, checking } = useAuth();
  if (checking) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}
