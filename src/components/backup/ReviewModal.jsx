import { useEffect, useRef } from "react";

import { AlertIcon, DatabaseIcon, DownloadIcon, UploadIcon } from "../Icons.jsx";

function Endpoint({ tone, icon, role, name, host }) {
  const styles =
    tone === "from"
      ? "border-sky-500/30 bg-sky-500/[0.06] text-sky-300"
      : "border-fuchsia-500/30 bg-fuchsia-500/[0.06] text-fuchsia-300";
  return (
    <div className={`min-w-0 flex-1 rounded-xl border p-3 ${styles}`}>
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider">
        {icon} {role}
      </p>
      <p className="mt-1 truncate text-[14px] font-bold text-ink">{name}</p>
      <p className="truncate font-mono text-[11px] text-faint">{host}</p>
    </div>
  );
}

export default function ReviewModal({ from, to, overwrite, mode, selectionSummary, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const fromLabel = from.DB_NAME.trim();
  const toLabel = to.DB_NAME.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#05030b]/75 p-4 backdrop-blur-md"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        className="w-full max-w-[560px] animate-scale-in overflow-hidden rounded-3xl border border-line-strong bg-panel shadow-2xl shadow-violet-950/60"
      >
        <div className="h-1 bg-linear-to-r from-violet-600 via-fuchsia-500 to-purple-500" />
        <div className="flex items-center gap-3 px-6 pb-2 pt-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/50">
            <DatabaseIcon size={20} />
          </span>
          <div>
            <h3 id="review-title" className="text-[17px] font-bold tracking-tight">
              Start Backup &amp; Restore?
            </h3>
            <p className="text-[12.5px] text-muted">
              Copy {mode === "SELECTED" ? "the structure, and data of the selected tables" : "everything"} — review before it starts.
            </p>
          </div>
        </div>

        <div className="space-y-3 px-6 py-4 text-[13px]">
          <div className="flex items-stretch gap-2">
            <Endpoint tone="from" icon={<UploadIcon size={11} />} role="Backup FROM" name={fromLabel} host={`${from.DB_HOST.trim()}:${from.DB_PORT}`} />
            <span className="flex items-center">
              <svg viewBox="0 0 36 12" className="h-3 w-9" aria-hidden>
                <path d="M0 6 H36" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" className="animate-flow" />
              </svg>
            </span>
            <Endpoint tone="to" icon={<DownloadIcon size={11} />} role="Restore TO" name={toLabel} host={`${to.DB_HOST.trim()}:${to.DB_PORT}`} />
          </div>

          {mode === "SELECTED" && (
            <p className="rounded-xl border border-violet-500/25 bg-violet-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-violet-100">{selectionSummary}</p>
          )}
          {overwrite ? (
            <p className="flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-rose-200">
              <AlertIcon className="mt-0.5 text-rose-400" />
              Everything currently in {toLabel} will be deleted and replaced. This cannot be undone once it finishes.
            </p>
          ) : (
            <p className="rounded-xl border border-line bg-field/50 px-3.5 py-2.5 text-[12.5px] text-muted">
              {toLabel} must be empty. If it already contains anything, the run stops without changing it.
            </p>
          )}
          <p className="text-[12px] text-faint">{fromLabel} is only read and is not changed. The copy runs in the background on the server.</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-raised/30 px-6 py-4">
          <button ref={cancelRef} type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn-accent ${overwrite ? "from-rose-600 via-pink-600 to-fuchsia-600" : ""}`}
            onClick={onConfirm}
          >
            <DatabaseIcon />
            {overwrite ? `Replace ${toLabel} and copy` : "Copy now"}
          </button>
        </div>
      </div>
    </div>
  );
}
