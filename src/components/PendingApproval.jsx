import { useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { CheckIcon, HourglassIcon, RefreshIcon, ShieldIcon, SpinnerIcon, UserIcon } from "./Icons.jsx";
import AppLayout from "./layout/AppLayout.jsx";
import { Alert } from "./ui.jsx";

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

  const steps = [
    { label: "Account created", done: true, icon: <UserIcon size={13} /> },
    { label: rejected ? "Admin rejected access" : "Waiting for admin review", done: false, current: true, icon: <ShieldIcon size={13} /> },
    { label: "Backup & Restore unlocked", done: false, icon: <CheckIcon size={13} /> },
  ];

  return (
    <AppLayout>
      <section role="alert" className="panel relative mx-auto mt-6 max-w-xl animate-scale-in overflow-hidden p-8 text-center sm:mt-12">
        <div
          className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-[28rem] -translate-x-1/2 rounded-full blur-3xl ${
            rejected ? "bg-rose-600/20" : "bg-violet-600/25"
          }`}
        />
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          {!rejected && <span className="absolute inset-0 animate-ping-slow rounded-full bg-violet-500/30" />}
          <span
            className={`relative inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-inset ${
              rejected ? "bg-rose-500/15 text-rose-300 ring-rose-400/40" : "bg-linear-to-br from-violet-600 to-fuchsia-600 text-white ring-white/20"
            }`}
          >
            {rejected ? <ShieldIcon size={28} /> : <HourglassIcon size={28} className="animate-[spin_3s_ease-in-out_infinite]" />}
          </span>
        </div>

        <h2 className="relative text-xl font-bold tracking-tight">
          {rejected ? "Your account was rejected" : "You are not verified by an admin yet"}
        </h2>
        <p className="relative mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
          {rejected
            ? "An admin rejected your account, so you cannot use Backup & Restore. Contact an admin if you think this is a mistake."
            : "Your account was created, but an admin has to approve it before you can use Backup & Restore. You will get access as soon as they do."}
        </p>

        <ol className="relative mx-auto mt-7 max-w-sm space-y-2 text-left">
          {steps.map((step) => (
            <li
              key={step.label}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] ${
                step.done
                  ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-200"
                  : step.current
                    ? rejected
                      ? "border-rose-500/30 bg-rose-500/[0.06] text-rose-200"
                      : "border-violet-500/35 bg-violet-500/[0.08] text-violet-100"
                    : "border-line text-faint"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                  step.done ? "bg-emerald-500/20" : step.current ? (rejected ? "bg-rose-500/20" : "bg-violet-500/25 animate-glow-pulse") : "bg-raised"
                }`}
              >
                {step.icon}
              </span>
              {step.label}
            </li>
          ))}
        </ol>

        {!rejected && (
          <div className="relative mt-7 flex flex-col items-center gap-3">
            <button type="button" className="btn-accent" onClick={checkAgain} disabled={checking}>
              {checking ? <SpinnerIcon /> : <RefreshIcon />} {checking ? "Checking…" : "Check again"}
            </button>
            {message && (
              <Alert key={message} tone="info" className="w-full text-left">
                {message}
              </Alert>
            )}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
