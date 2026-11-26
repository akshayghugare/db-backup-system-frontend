import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { DatabaseIcon, LogOutIcon, UserIcon, UsersIcon } from "./Icons.jsx";

const linkClass = ({ isActive }) =>
  `inline-flex h-[34px] items-center gap-1.5 rounded-md border px-3 text-[13px] ${
    isActive ? "border-amber-500/50 bg-amber-500/10 text-ink" : "border-line-strong text-muted hover:bg-raised hover:text-ink"
  }`;

export default function UserMenu({ disabled = false }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <nav className="flex gap-2" aria-label="Admin navigation">
          <NavLink to="/" end className={linkClass}>
            <DatabaseIcon /> Backup &amp; Restore
          </NavLink>
          <NavLink to="/admin/users" className={linkClass}>
            <UsersIcon /> Users
          </NavLink>
        </nav>
      )}
      <span className="inline-flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px]">
        <UserIcon className="text-accent" />
        <span>
          <span className="block leading-tight">
            {user?.name}
            {isAdmin && <span className="ml-1.5 rounded border border-amber-500/50 px-1 text-[10px] uppercase text-accent">admin</span>}
          </span>
          <span className="block text-[11px] leading-tight text-faint">{user?.email}</span>
        </span>
      </span>
      <button type="button" className="btn-ghost" onClick={logout} disabled={disabled}>
        <LogOutIcon /> Sign out
      </button>
    </div>
  );
}
