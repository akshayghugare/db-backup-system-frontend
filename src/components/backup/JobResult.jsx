import { useState } from "react";

import { formatDuration } from "../../utils/format.js";
import { CheckIcon, ChevronDownIcon, ClockIcon, XCircleIcon } from "../Icons.jsx";
import { AnimatedNumber, ProgressBar, StatusPill } from "../ui.jsx";

export function JobFailed({ job }) {
  return (
    <section className="panel relative animate-shake overflow-hidden ring-1 ring-rose-500/30" role="alert">
      <div className="h-1 bg-linear-to-r from-rose-600 via-pink-500 to-rose-600" />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/35">
          <XCircleIcon size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold text-rose-200">
              Backup &amp; restore failed
              {job.duration_ms > 0 && <span className="ml-2 text-[12px] font-normal text-faint">after {formatDuration(job.duration_ms)}</span>}
            </h3>
            <StatusPill status={job.status} label={job.status_label} />
          </div>
          <p className="mt-2 whitespace-pre-line break-words rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-3 font-mono text-[12px] leading-relaxed text-rose-100/90">
            {job.error_message}
          </p>
        </div>
      </div>
    </section>
  );
}

export function JobCompleted({ job }) {
  const [showTables, setShowTables] = useState(false);
  const result = job.result;
  const copied = result.copied;
  const tiles = [
    ["Tables", copied.tables, true],
    ["Rows", copied.rows, true],
    ["Schemas", copied.schemas],
    ["Enums & types", copied.enums + copied.domains + copied.composite_types],
    ["Sequences", copied.sequences],
    ["Constraints", copied.constraints],
    ["Relationships", copied.foreign_keys],
    ["Indexes", copied.indexes],
    ["Views", copied.views + copied.materialized_views],
    ["Functions", copied.functions],
    ["Triggers", copied.triggers],
    ["Extensions", copied.extensions],
  ];
  const longest = Math.max(1, ...result.steps.map((step) => step.duration_ms));

  return (
    <section className="panel relative animate-scale-in overflow-hidden ring-1 ring-emerald-500/25" aria-live="polite">
      <div className="h-1 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-500" />
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-start">
        <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50">
          <span className="absolute inset-0 animate-ping-slow rounded-2xl bg-emerald-400/40 [animation-iteration-count:2]" />
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="relative">
            <path d="M5 12l5 5L20 7" strokeDasharray="24" className="animate-check" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold text-emerald-200">Backup &amp; restore completed</h3>
            <StatusPill status={job.status} label={job.status_label} />
          </div>
          <p className="mt-1 text-[13px] text-ink/90">{result.message}</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-faint">
            Backup FROM <span className="text-sky-300">{result.source.database}</span> (PostgreSQL {result.source.server_version}) → Restore TO{" "}
            <span className="text-fuchsia-300">{result.destination.database}</span> (PostgreSQL {result.destination.server_version}).{" "}
            {result.destination.was_empty
              ? "The destination was empty."
              : `${result.destination.replaced_tables} existing tables in the destination were replaced.`}
            {result.mode === "SELECTED" &&
              ` Data copied for ${result.data_tables} tables${
                result.auto_included_tables.length > 0 ? ` (${result.auto_included_tables.length} added for relationships)` : ""
              }; the others were created empty.`}
          </p>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-2.5 p-5 sm:grid-cols-4 lg:grid-cols-6">
        {tiles.map(([label, value, highlight]) => (
          <div
            key={label}
            className={`rounded-xl border p-3 ${highlight ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-line bg-field/40"}`}
          >
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-faint">{label}</p>
            <p className={`mt-0.5 text-[18px] font-bold ${highlight ? "text-emerald-200" : "text-ink"}`}>
              <AnimatedNumber value={value} />
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 border-t border-line p-5 lg:grid-cols-2">
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            <ClockIcon size={11} /> Step timings
          </p>
          <ul className="space-y-1.5 text-[12.5px]">
            {result.steps.map((step) => (
              <li key={step.step} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                <span className="flex min-w-0 items-center gap-1.5 text-muted">
                  <CheckIcon size={12} className="text-emerald-400" />
                  <span className="truncate">{step.step}</span>
                </span>
                <span className="tabular-nums text-faint">{formatDuration(step.duration_ms)}</span>
                <span className="col-span-2 pl-[18px]">
                  <ProgressBar percent={Math.max(2, (step.duration_ms / longest) * 100)} size="sm" tone="success" animated={false} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowTables((v) => !v)}
            className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-soft hover:text-violet-200"
          >
            <ChevronDownIcon size={12} className={`transition-transform duration-200 ${showTables ? "rotate-180" : ""}`} />
            {showTables ? "Hide" : "Show"} rows copied per table ({result.tables.length})
          </button>
          {showTables && (
            <ul className="max-h-72 animate-fade-in space-y-0.5 overflow-auto rounded-xl border border-line p-2 text-[12.5px]">
              {result.tables.map((table) => (
                <li key={table.table} className="flex justify-between gap-2 rounded-md px-2 py-1 hover:bg-raised/60">
                  <span className="truncate text-muted">{table.table}</span>
                  <span className="tabular-nums text-faint">{table.skipped ? "structure only" : Number(table.rows).toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
