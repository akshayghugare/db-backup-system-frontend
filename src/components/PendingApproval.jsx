import { useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { DatabaseIcon, ShieldIcon, SpinnerIcon } from "./Icons.jsx";
import UserMenu from "./UserMenu.jsx";

export default function PendingApproval() {
  const { user, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);
  const rejected = user?.approval_status === "REJECTED";

  const checkAgain = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const fresh = await refreshUser();
      if (fresh && fresh.approval_status !== "APPROVED") setMessage("Still waiting — an admin has not approved your account yet.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-3 p-3 lg:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <DatabaseIcon size={18} className="text-accent" />
          Database Backup &amp; Restore
        </h1>
        <UserMenu />
      </header>

      <section
        role="alert"
        className={`panel mx-auto mt-10 max-w-xl border-t-2 p-5 text-center ${rejected ? "border-t-rose-500/70" : "border-t-amber-500/70"}`}
      >
        <div
          className={`mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
            rejected ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-amber-500/40 bg-amber-500/10 text-accent"
          }`}
        >
          <ShieldIcon size={20} />
        </div>
        <h2 className="text-[15px] font-semibold">{rejected ? "Your account was rejected" : "You are not verified by an admin yet"}</h2>
        <p className="mt-2 text-[13px] text-muted">
          {rejected
            ? "An admin rejected your account, so you cannot use Backup & Restore. Contact an admin if you think this is a mistake."
            : "Your account was created, but an admin has to approve it before you can use Backup & Restore. You will get access as soon as they do."}
        </p>
        {!rejected && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <button type="button" className="btn-ghost" onClick={checkAgain} disabled={checking}>
              {checking && <SpinnerIcon />} Check again
            </button>
            {message && <p className="text-xs text-faint">{message}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
