import { useEffect, useRef } from "react";

import { AlertIcon } from "../Icons.jsx";

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
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="w-full max-w-[520px] rounded-xl border border-line-strong bg-panel shadow-2xl">
        <h3 id="review-title" className="border-b border-line px-4 py-3.5 text-[15px] font-semibold">
          Start Backup &amp; Restore?
        </h3>
        <div className="space-y-2 px-4 py-3.5 text-[13px]">
          <p>
            Copy {mode === "SELECTED" ? "the structure, and data of the selected tables," : "everything"} from{" "}
            <strong>Backup FROM: {fromLabel}</strong>{" "}
            <span className="text-faint">
              ({from.DB_HOST.trim()}:{from.DB_PORT})
            </span>
          </p>
          <p>
            into <strong>Restore TO: {toLabel}</strong>{" "}
            <span className="text-faint">
              ({to.DB_HOST.trim()}:{to.DB_PORT})
            </span>
          </p>
          {mode === "SELECTED" && <p className="text-violet-300">{selectionSummary}</p>}
          {overwrite ? (
            <p className="flex items-start gap-1.5 text-rose-400">
              <AlertIcon className="mt-0.5" />
              Everything currently in {toLabel} will be deleted and replaced. This cannot be undone once it finishes.
            </p>
          ) : (
            <p className="text-muted">{toLabel} must be empty. If it already contains anything, the run stops without changing it.</p>
          )}
          <p className="text-faint">{fromLabel} is only read and is not changed. The copy runs in the background on the server.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button ref={cancelRef} type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-accent" onClick={onConfirm}>
            {overwrite ? `Replace ${toLabel} and copy` : "Copy now"}
          </button>
        </div>
      </div>
    </div>
  );
}
