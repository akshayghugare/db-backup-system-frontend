import { Navigate, Route, Routes } from "react-router-dom";

import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import BackupRestorePage from "./pages/BackupRestorePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<BackupRestorePage />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
