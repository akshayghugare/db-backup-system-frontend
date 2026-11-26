import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { ChevronDownIcon, LogOutIcon, ShieldIcon } from "./Icons.jsx";
import { Avatar } from "./ui.jsx";

/** Avatar button with a dropdown holding the account details and sign out. */
export default function UserMenu({ disabled = false }) {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl border border-line bg-panel/70 py-1.5 pl-1.5 pr-2.5 text-left transition-all hover:border-accent/40 hover:bg-raised"
      >
        <Avatar name={user?.name} size="sm" />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[160px] truncate text-[13px] font-medium leading-tight">{user?.name}</span>
          <span className="block max-w-[160px] truncate text-[11px] leading-tight text-faint">{isAdmin ? "Administrator" : "Member"}</span>
        </span>
        <ChevronDownIcon className={`text-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-2xl shadow-black/60"
        >
          <div className="flex items-center gap-3 border-b border-line bg-linear-to-br from-violet-600/15 to-fuchsia-600/5 p-4">
            <Avatar name={user?.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{user?.name}</p>
              <p className="truncate text-[11px] text-faint">{user?.email}</p>
              {isAdmin && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-soft">
                  <ShieldIcon size={10} /> Admin
                </span>
              )}
            </div>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              disabled={disabled}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOutIcon /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
