import { useEffect, useRef, useState } from "react";

import { checkDesktopDownload, DESKTOP_DOWNLOAD_URL, DESKTOP_FILE_NAME, DESKTOP_PLATFORM, isDesktopApp, isWindows } from "../config/desktop.js";
import { formatBytes } from "../utils/format.js";
import { AlertIcon, CheckIcon, CloseIcon, DatabaseIcon, DownloadIcon, LockIcon, ServerIcon, ShieldIcon, SpinnerIcon, UserIcon } from "./Icons.jsx";

const STEPS = [
  { icon: <DownloadIcon size={14} />, title: "Download the installer", text: `${DESKTOP_FILE_NAME} — it saves to your Downloads folder.` },
  {
    icon: <ShieldIcon size={14} />,
    title: "Run it and install",
    text: 'If Windows shows "Windows protected your PC", click More info → Run anyway (the installer is not code-signed).',
  },
  {
    icon: <ServerIcon size={14} />,
    title: "Connect the app database",
    text: "On first start, enter the same database this website uses (ask your admin) — so your account and history are shared.",
  },
  { icon: <UserIcon size={14} />, title: "Sign in with this account", text: "Same email and password as here. Restore TO localhost now works." },
];

function DesktopDownloadModal({ onClose }) {
  const [started, setStarted] = useState(false);
  const [file, setFile] = useState({ status: "checking", bytes: null });
  const closeRef = useRef(null);
  const windows = isWindows();

  // Ask the backend whether an installer is published (and how big it is) before offering the button.
  useEffect(() => {
    let cancelled = false;
    checkDesktopDownload().then((result) => {
      if (!cancelled) setFile({ status: result.available ? "available" : "unavailable", bytes: result.bytes ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const available = file.status === "available";

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#05030b]/75 p-4 backdrop-blur-md"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-download-title"
        className="relative w-full max-w-[560px] animate-scale-in overflow-hidden rounded-3xl border border-line-strong bg-panel shadow-2xl shadow-violet-950/60"
      >
        <div className="h-1 bg-linear-to-r from-violet-600 via-fuchsia-500 to-purple-500" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-ink"
          aria-label="Close"
        >
          <CloseIcon size={16} />
        </button>

        <div className="relative flex items-center gap-3.5 px-6 pb-2 pt-6">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/50">
            <DatabaseIcon size={22} />
          </span>
          <div className="pr-8">
            <p className="eyebrow">Desktop app</p>
            <h3 id="desktop-download-title" className="text-[18px] font-bold tracking-tight">
              Restore into your local database
            </h3>
          </div>
        </div>

        <div className="relative space-y-4 px-6 py-4">
          <p className="text-[13px] leading-relaxed text-muted">
            The website's server runs in the cloud, so it can't reach the PostgreSQL on your computer. The desktop app is this same app —
            same login, history and admin approvals — but it runs on your machine, so <strong className="text-ink">Restore TO localhost</strong>{" "}
            works.
          </p>

          {!windows && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-200">
              <AlertIcon className="mt-0.5 shrink-0 text-amber-400" />
              The installer is for Windows. Download it on a Windows computer, or ask your admin for a Mac / Linux build.
            </p>
          )}

          <ol className="space-y-2">
            {STEPS.map((step, index) => {
              const done = started && index === 0;
              const current = started ? index === 1 : index === 0;
              return (
                <li
                  key={step.title}
                  className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300 ${
                    done
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : current
                        ? "border-violet-500/35 bg-violet-500/[0.08]"
                        : "border-line bg-field/40"
                  }`}
                >
                  <span
                    className={`mt-px inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      done ? "bg-emerald-500/20 text-emerald-300" : current ? "bg-linear-to-br from-violet-500 to-fuchsia-500 text-white" : "bg-raised text-faint"
                    }`}
                  >
                    {done ? <CheckIcon size={13} /> : step.icon}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[13px] font-semibold ${current || done ? "text-ink" : "text-muted"}`}>
                      {index + 1}. {step.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-faint">{step.text}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          {file.status === "unavailable" && (
            <p className="flex animate-fade-up items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-200">
              <AlertIcon className="mt-0.5 shrink-0 text-amber-400" />
              The desktop app has not been published yet, so it can't be downloaded right now. Please ask your admin and try again later.
            </p>
          )}

          {started && (
            <p className="flex animate-fade-up items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-emerald-200">
              <CheckIcon className="mt-0.5 shrink-0 text-emerald-400" />
              <span>
                Your download has started — your browser shows its progress. When it finishes, open <strong>{DESKTOP_FILE_NAME}</strong> from
                your Downloads. Nothing happening?{" "}
                <a href={DESKTOP_DOWNLOAD_URL} className="font-semibold underline underline-offset-2 hover:text-white">
                  Download again
                </a>
                .
              </span>
            </p>
          )}
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-line bg-raised/30 px-6 py-4">
          <span className="flex items-center gap-1.5 text-[11.5px] text-faint">
            <LockIcon size={11} /> {DESKTOP_PLATFORM}
            {file.bytes ? ` · ${formatBytes(file.bytes)}` : ""}
          </span>
          <span className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {started ? "Done" : "Cancel"}
            </button>
            {available ? (
              <a href={DESKTOP_DOWNLOAD_URL} download={DESKTOP_FILE_NAME} onClick={() => setStarted(true)} className="btn-accent no-underline">
                <DownloadIcon size={15} />
                {started ? "Download again" : "Download for Windows"}
              </a>
            ) : (
              <button type="button" className="btn-accent" disabled>
                {file.status === "checking" ? <SpinnerIcon size={15} /> : <DownloadIcon size={15} />}
                {file.status === "checking" ? "Checking…" : "Not available yet"}
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

const VARIANTS = {
  nav: "inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-500/35 bg-violet-500/10 px-3 text-[12.5px] font-medium text-violet-100 transition-all hover:border-violet-400/60 hover:bg-violet-500/20",
  primary: "btn-accent",
  link: "inline-flex items-center gap-1.5 font-medium text-accent-soft hover:text-violet-200 hover:underline",
};

/** "Download desktop app" button + guided download dialog. Renders nothing inside the desktop app itself. */
export default function DesktopDownloadButton({ variant = "nav", label = "Desktop app", className = "" }) {
  const [open, setOpen] = useState(false);
  if (isDesktopApp()) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${VARIANTS[variant]} ${className}`}>
        <DownloadIcon size={variant === "link" ? 13 : 14} />
        {label}
      </button>
      {open && <DesktopDownloadModal onClose={() => setOpen(false)} />}
    </>
  );
}
