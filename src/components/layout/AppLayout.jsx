import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { listUsers } from "../../api/admin.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ChevronRightIcon, CloseIcon, DatabaseIcon, LogOutIcon, MenuIcon, ShieldIcon, UsersIcon } from "../Icons.jsx";
import { Avatar, BrandMark } from "../ui.jsx";
import UserMenu from "../UserMenu.jsx";
import DesktopDownloadButton from "../DesktopDownload.jsx";

export const USERS_CHANGED_EVENT = "db-backup-local:users-changed";

/** Picks the admin console or the user workspace layout from the signed-in role. */
export default function AppLayout(props) {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminLayout {...props} /> : <UserLayout {...props} />;
}

function PageHeader({ eyebrow, title, subtitle, actions }) {
  if (!title) return null;
  return (
    <header className="mb-6 flex animate-fade-up flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          <span className="gradient-text">{title}</span>
        </h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* User workspace: a single top navigation bar, centred content.       */
/* ------------------------------------------------------------------ */

export function UserLayout({ title, subtitle, actions, busy = false, children }) {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-line/80 bg-page/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div className="leading-tight">
              <p className="text-[14px] font-bold tracking-tight">DB Backup &amp; Restore</p>
              <p className="text-[11px] text-faint">Local development tool</p>
            </div>
          </div>
          <div className="hidden items-center gap-1 rounded-xl border border-line bg-panel/60 p-1 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-[12.5px] font-medium text-accent-soft">
              <DatabaseIcon /> Workspace
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DesktopDownloadButton className="hidden sm:inline-flex" />
            <UserMenu disabled={busy} />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-[1320px] px-4 py-7 sm:px-6">
        <PageHeader eyebrow="Workspace" title={title} subtitle={subtitle} actions={actions} />
        {children}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin console: sidebar navigation + top bar with breadcrumbs.       */
/* ------------------------------------------------------------------ */

function usePendingCount() {
  const [pending, setPending] = useState(null);
  useEffect(() => {
    listUsers("PENDING")
      .then((data) => setPending(data.counts?.PENDING ?? 0))
      .catch(() => undefined);
    const onChanged = (event) => setPending(event.detail?.PENDING ?? 0);
    window.addEventListener(USERS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(USERS_CHANGED_EVENT, onChanged);
  }, []);
  return pending;
}

const navClass = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
    isActive
      ? "bg-linear-to-r from-violet-600/25 to-fuchsia-600/10 text-ink ring-1 ring-inset ring-violet-500/30"
      : "text-muted hover:bg-white/[0.04] hover:text-ink"
  }`;

function SidebarContent({ pending, busy, onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <BrandMark />
        <div className="leading-tight">
          <p className="text-[14px] font-bold tracking-tight">DB Backup</p>
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-accent-soft">
            <ShieldIcon size={10} /> Admin console
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3" aria-label="Admin navigation">
        <div>
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-faint">Operations</p>
          <NavLink to="/" end className={navClass} onClick={onNavigate}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-violet-400 to-fuchsia-400" />}
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-accent/25 text-violet-200" : "bg-raised text-faint group-hover:text-accent-soft"}`}>
                  <DatabaseIcon size={15} />
                </span>
                Backup &amp; Restore
              </>
            )}
          </NavLink>
        </div>
        <div>
          <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-faint">Management</p>
          <NavLink to="/admin/users" className={navClass} onClick={onNavigate}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-violet-400 to-fuchsia-400" />}
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-accent/25 text-violet-200" : "bg-raised text-faint group-hover:text-accent-soft"}`}>
                  <UsersIcon size={15} />
                </span>
                <span className="flex-1">Users &amp; access</span>
                {pending > 0 && (
                  <span className="relative inline-flex min-w-[22px] items-center justify-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/40">
                    {pending}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      <div className="m-3 rounded-2xl border border-line bg-raised/50 p-3">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{user?.name}</p>
            <p className="truncate text-[11px] text-faint">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            title="Sign out"
            aria-label="Sign out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
          >
            <LogOutIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ title, subtitle, actions, busy = false, children }) {
  const pending = usePendingCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const section = location.pathname.startsWith("/admin/users") ? "Users & access" : "Backup & Restore";

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-[#0e0a1b]/90 backdrop-blur-xl lg:block">
        <SidebarContent pending={pending} busy={busy} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] animate-slide-in-left border-r border-line bg-[#0e0a1b]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-6 inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-raised hover:text-ink"
              aria-label="Close menu"
            >
              <CloseIcon size={16} />
            </button>
            <SidebarContent pending={pending} busy={busy} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <div className="sticky top-0 z-20 border-b border-line/80 bg-page/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-ink lg:hidden"
                aria-label="Open menu"
              >
                <MenuIcon size={16} />
              </button>
              <p className="flex items-center gap-1.5 text-[13px] text-faint">
                <span className="hidden sm:inline">Admin console</span>
                <ChevronRightIcon size={12} className="hidden sm:block" />
                <span className="font-medium text-ink">{section}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DesktopDownloadButton className="hidden sm:inline-flex" />
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-2.5 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Local only
              </span>
              <span className="lg:hidden">
                <UserMenu disabled={busy} />
              </span>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-8">
          <PageHeader eyebrow="Admin console" title={title} subtitle={subtitle} actions={actions} />
          {children}
        </main>
      </div>
    </div>
  );
}
