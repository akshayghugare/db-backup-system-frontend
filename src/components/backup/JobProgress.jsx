import { formatBytes, formatDuration, formatNumber } from "../../utils/format.js";
import { CheckCircleIcon, SpinnerIcon } from "../Icons.jsx";
import { StatusPill } from "../ui.jsx";

const percentOf = (job) => {
  const steps = job.steps;
  const index = steps.indexOf(job.progress.current_step);
  if (index < 0) return job.status === "PENDING" ? 0 : 2;
  const { tables_done: done, tables_total: total } = job.progress;
  const inStep = job.progress.current_step === "Copying table data" && total > 0 ? done / total : 0;
  return Math.min(99, Math.round(((index + inStep) / steps.length) * 100));
};

export default function JobProgress({ job, now, connectionIssue }) {
  const { progress } = job;
  const startedAt = job.started_at ? Date.parse(job.started_at) : Date.parse(job.created_at);
  const currentIndex = job.steps.indexOf(progress.current_step);
  const percent = percentOf(job);

  return (
    <section className="panel space-y-3 p-3" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px]">
          <SpinnerIcon size={15} className="text-accent" />
          <span>
            Copying <strong>{job.source_database}</strong> into <strong>{job.destination_database}</strong>
            {job.mode === "SELECTED" && <span className="text-faint"> (selected tables)</span>} — elapsed{" "}
            {formatDuration(now - startedAt)}
          </span>
        </p>
        <StatusPill status={job.status} label={job.status_label} />
      </div>

      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-faint">
          <span>{progress.message}</span>
          <span className="tabular-nums">{percent}%</span>
        </div>
      </div>

      {progress.current_step === "Copying table data" && (
        <div className="grid gap-2 text-[13px] sm:grid-cols-3">
          <div className="rounded-md border border-line p-2">
            <p className="text-[11px] text-faint">Tables</p>
            <p className="font-semibold tabular-nums">
              {formatNumber(progress.tables_done)} / {formatNumber(progress.tables_total)}
            </p>
          </div>
          <div className="rounded-md border border-line p-2">
            <p className="text-[11px] text-faint">Transferred</p>
            <p className="font-semibold tabular-nums">{formatBytes(progress.bytes_copied)}</p>
          </div>
          <div className="rounded-md border border-line p-2">
            <p className="text-[11px] text-faint">Now copying</p>
            <p className="truncate font-semibold" title={progress.current_table || ""}>
              {progress.current_table || "—"}
              {progress.current_table && progress.current_table_estimated_rows > 0 && (
                <span className="font-normal text-faint"> (~{formatNumber(progress.current_table_estimated_rows)} rows)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {progress.auto_included?.length > 0 && (
        <p className="text-xs text-violet-300">
          Also copying {progress.auto_included.length} referenced tables so relationships stay valid:{" "}
          {progress.auto_included.slice(0, 8).join(", ")}
          {progress.auto_included.length > 8 && "…"}
        </p>
      )}

      {connectionIssue && (
        <p className="rounded-md border border-amber-500/40 px-2 py-1.5 text-xs text-amber-400">
          Lost contact with the API — retrying. The job keeps running on the server.
        </p>
      )}

      <ol className="grid gap-0.5 text-[13px] sm:grid-cols-2">
        {job.steps.map((step, index) => {
          const done = currentIndex > index;
          const current = currentIndex === index;
          return (
            <li key={step} className={`flex items-center gap-2 ${done ? "text-muted" : current ? "font-medium text-ink" : "text-faint"}`}>
              <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
                {done ? (
                  <CheckCircleIcon className="text-emerald-400" />
                ) : current ? (
                  <SpinnerIcon className="text-accent" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                )}
              </span>
              {step}
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-faint">
        The copy runs on the server as a background job. You can reload this page or close the tab — come back any time to see its
        status.
      </p>
    </section>
  );
}
