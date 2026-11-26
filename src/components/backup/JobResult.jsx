import { useState } from "react";

import { formatDuration, formatNumber } from "../../utils/format.js";
import { CheckCircleIcon, XCircleIcon } from "../Icons.jsx";
import { StatusPill } from "../ui.jsx";

export function JobFailed({ job }) {
  return (
    <section className="panel border-l-2 border-l-rose-500 p-3" role="alert">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-rose-400">
          <XCircleIcon /> Backup &amp; restore failed
          {job.duration_ms > 0 && <span className="font-normal text-faint">after {formatDuration(job.duration_ms)}</span>}
        </p>
        <StatusPill status={job.status} label={job.status_label} />
      </div>
      <p className="mt-1 whitespace-pre-line break-words text-[13px]">{job.error_message}</p>
    </section>
  );
}

export function JobCompleted({ job }) {
  const [showTables, setShowTables] = useState(false);
  const result = job.result;
  const copied = result.copied;
  const tiles = [
    ["Tables", copied.tables],
    ["Rows", copied.rows],
    ["Schemas", copied.schemas],
    ["Enums & types", copied.enums + copied.domains + copied.composite_types],
    ["Sequences", copied.sequences],
    ["Constraints", copied.constraints],
    ["Relationships (FKs)", copied.foreign_keys],
    ["Indexes", copied.indexes],
    ["Views", copied.views + copied.materialized_views],
    ["Functions", copied.functions],
    ["Triggers", copied.triggers],
    ["Extensions", copied.extensions],
  ];

  return (
    <section className="panel border-l-2 border-l-emerald-500" aria-live="polite">
      <div className="border-b border-line p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-400">
            <CheckCircleIcon /> Backup &amp; restore completed
          </p>
          <StatusPill status={job.status} label={job.status_label} />
        </div>
        <p className="mt-1 text-[13px]">{result.message}</p>
        <p className="mt-1 text-xs text-faint">
          Backup FROM {result.source.database} (PostgreSQL {result.source.server_version}) → Restore TO {result.destination.database}{" "}
          (PostgreSQL {result.destination.server_version}).{" "}
          {result.destination.was_empty
            ? "The destination was empty."
            : `${result.destination.replaced_tables} existing tables in the destination were replaced.`}
          {result.mode === "SELECTED" &&
            ` Data copied for ${result.data_tables} tables${
              result.auto_included_tables.length > 0 ? ` (${result.auto_included_tables.length} added for relationships)` : ""
            }; the others were created empty.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-6">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-md border border-line p-2">
            <p className="text-[11px] text-faint">{label}</p>
            <p className="text-[14px] font-semibold">{formatNumber(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 border-t border-line p-3 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-[13px] font-semibold">Steps</p>
          <ul className="space-y-0.5 text-[13px]">
            {result.steps.map((step) => (
              <li key={step.step} className="flex justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <CheckCircleIcon size={12} className="text-emerald-400" />
                  {step.step}
                </span>
                <span className="tabular-nums text-faint">{formatDuration(step.duration_ms)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <button type="button" onClick={() => setShowTables((v) => !v)} className="mb-1 text-[13px] font-semibold hover:underline">
            {showTables ? "Hide" : "Show"} rows copied per table ({result.tables.length})
          </button>
          {showTables && (
            <ul className="max-h-72 space-y-0.5 overflow-auto pr-1 text-[13px]">
              {result.tables.map((table) => (
                <li key={table.table} className="flex justify-between gap-2">
                  <span className="truncate text-muted">{table.table}</span>
                  <span className="tabular-nums text-faint">{table.skipped ? "structure only" : formatNumber(table.rows)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
