import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { BrandLoader } from "./ui.jsx";

function FullPageSpinner() {
  return <BrandLoader label="Checking your session" />;
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
