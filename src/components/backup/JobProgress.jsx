import { useRef } from "react";

import { formatBytes, formatDuration, formatNumber } from "../../utils/format.js";
import { ActivityIcon, AlertIcon, ArrowRightIcon, CheckIcon, ClockIcon, DownloadIcon, LayersIcon, TableIcon, ZapIcon } from "../Icons.jsx";
import { ProgressBar, ProgressRing, StatusPill } from "../ui.jsx";

export const DATA_STEP = "Copying table data";

/**
 * Overall percentage. Copying table data is by far the longest step, so it is
 * weighted as heavily as every other step combined, and advances per table.
 */
export const jobPercent = (job) => {
  if (job.status === "COMPLETED") return 100;
  const { steps, progress } = job;
  const index = steps.indexOf(progress.current_step);
  if (index < 0) return job.status === "PENDING" ? 0 : 1;
  const weight = (step) => (step === DATA_STEP ? Math.max(1, steps.length - 1) : 1);
  const total = steps.reduce((sum, step) => sum + weight(step), 0);
  const before = steps.slice(0, index).reduce((sum, step) => sum + weight(step), 0);
  const inStep = progress.current_step === DATA_STEP && progress.tables_total > 0 ? progress.tables_done / progress.tables_total : 0;
  return Math.min(99, Math.round(((before + inStep * weight(progress.current_step)) / total) * 100));
};

/** Rolling transfer rate (bytes per second) from the last ~15 s of polls. */
function useTransferRate(bytes, active) {
  const samples = useRef([]);
  if (!active) {
    samples.current = [];
    return 0;
  }
  const now = Date.now();
  const list = samples.current;
  if (list.length === 0 || list[list.length - 1].bytes !== bytes) list.push({ t: now, bytes });
  while (list.length > 2 && now - list[0].t > 15000) list.shift();
  if (list.length < 2) return 0;
  const first = list[0];
  const last = list[list.length - 1];
  const seconds = (last.t - first.t) / 1000;
  return seconds > 0 ? (last.bytes - first.bytes) / seconds : 0;
}

function StatTile({ icon, label, children, sub }) {
  return (
    <div className="rounded-xl border border-line bg-field/50 p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
        {icon}
        {label}
      </p>
      <div className="mt-1 truncate text-[16px] font-bold tabular-nums text-ink">{children}</div>
      {sub && <div className="mt-0.5 truncate text-[11.5px] text-faint">{sub}</div>}
    </div>
  );
}

export function TopProgress({ percent }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div
        className="relative h-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-purple-400 shadow-[0_0_12px_rgb(217_70_239/0.8)] transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(2, percent)}%` }}
      >
        <span className="absolute -right-1 -top-[3px] h-[9px] w-[9px] animate-pulse rounded-full bg-fuchsia-300 shadow-[0_0_10px_#f0abfc]" />
      </div>
    </div>
  );
}

export default function JobProgress({ job, now, connectionIssue }) {
  const { progress } = job;
  const startedAt = job.started_at ? Date.parse(job.started_at) : Date.parse(job.created_at);
  const currentIndex = job.steps.indexOf(progress.current_step);
  const percent = jobPercent(job);
  const copyingData = progress.current_step === DATA_STEP;
  const rate = useTransferRate(progress.bytes_copied, copyingData);
  const tableFraction = progress.tables_total > 0 ? (progress.tables_done / progress.tables_total) * 100 : 0;
  const stepNumber = currentIndex >= 0 ? currentIndex + 1 : 0;

  return (
    <section className="panel relative animate-scale-in overflow-hidden ring-1 ring-violet-500/25" aria-live="polite" aria-label="Backup & restore progress">
      <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-fuchsia-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />

      {/* Header: ring + what is being copied */}
      <div className="relative flex flex-col gap-5 border-b border-line p-5 sm:flex-row sm:items-center">
        <ProgressRing percent={percent} size={112} stroke={9}>
          <span className="text-[26px] font-bold leading-none tabular-nums">{percent}%</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-faint">complete</span>
        </ProgressRing>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow flex items-center gap-1.5">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400" />
                <span className="relative h-2 w-2 rounded-full bg-fuchsia-400" />
              </span>
              Backup &amp; restore running
            </p>
            <StatusPill status={job.status} label={job.status_label} />
          </div>

          <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2 py-0.5 text-sky-200 ring-1 ring-inset ring-sky-400/25">
              {job.source_database}
            </span>
            <span className="relative inline-flex w-12 items-center overflow-hidden">
              <svg viewBox="0 0 48 12" className="h-3 w-12" aria-hidden>
                <path d="M0 6 H48" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" className="animate-flow" />
              </svg>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-400/25">
              {job.destination_database}
            </span>
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <LayersIcon size={12} className="text-accent-soft" />
              Step <strong className="text-ink">{stepNumber || "–"}</strong> of {job.steps.length}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon size={12} className="text-accent-soft" />
              Elapsed <strong className="tabular-nums text-ink">{formatDuration(now - startedAt)}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <TableIcon size={12} className="text-accent-soft" />
              {job.mode === "SELECTED" ? "Selected tables" : "Full copy"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative space-y-5 p-5">
        {/* Live "now doing" line + current step bar */}
        <div className="rounded-2xl border border-violet-500/25 bg-linear-to-br from-violet-600/10 to-fuchsia-600/[0.04] p-4">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <ActivityIcon size={14} className="text-fuchsia-300" />
              {progress.current_step || (job.status === "PENDING" ? "Queued — waiting to start" : "Starting")}
            </p>
            {copyingData && progress.tables_total > 0 && (
              <span className="text-[12px] tabular-nums text-violet-200">
                {formatNumber(progress.tables_done)} / {formatNumber(progress.tables_total)} tables
              </span>
            )}
          </div>
          <ProgressBar percent={tableFraction} size="lg" indeterminate={!copyingData || progress.tables_total === 0} />
          <p key={progress.message} className="mt-2.5 flex animate-fade-in items-start gap-2 font-mono text-[12px] text-muted">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
            <span className="break-all">{progress.message}</span>
          </p>
        </div>

        {(copyingData || progress.bytes_copied > 0) && (
          <div className="stagger grid gap-3 sm:grid-cols-3">
            <StatTile icon={<TableIcon size={11} />} label="Tables copied" sub={`${Math.round(tableFraction)}% of tables`}>
              {formatNumber(progress.tables_done)}
              <span className="text-[13px] font-medium text-faint"> / {formatNumber(progress.tables_total)}</span>
            </StatTile>
            <StatTile icon={<DownloadIcon size={11} />} label="Transferred" sub={rate > 0 ? <span className="inline-flex items-center gap-1"><ZapIcon size={10} className="text-fuchsia-300" />{formatBytes(rate)}/s</span> : "measuring speed…"}>
              {formatBytes(progress.bytes_copied)}
            </StatTile>
            <StatTile
              icon={<ActivityIcon size={11} />}
              label="Now copying"
              sub={progress.current_table && progress.current_table_estimated_rows > 0 ? `~${formatNumber(progress.current_table_estimated_rows)} rows` : null}
            >
              <span className="text-[14px]" title={progress.current_table || ""}>
                {progress.current_table || "—"}
              </span>
            </StatTile>
          </div>
        )}

        {progress.auto_included?.length > 0 && (
          <p className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/[0.05] px-3.5 py-2.5 text-[12px] text-fuchsia-200">
            Also copying {progress.auto_included.length} referenced tables so relationships stay valid:{" "}
            <span className="text-fuchsia-200/70">
              {progress.auto_included.slice(0, 8).join(", ")}
              {progress.auto_included.length > 8 && "…"}
            </span>
          </p>
        )}

        {connectionIssue && (
          <p className="flex animate-fade-in items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-3.5 py-2.5 text-[12px] text-amber-200">
            <AlertIcon className="text-amber-400" /> Lost contact with the API — retrying. The job keeps running on the server.
          </p>
        )}

        {/* Step timeline */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">All steps</p>
          <ol className="gap-x-6 sm:columns-2">
            {job.steps.map((step, index) => {
              const done = currentIndex > index;
              const current = currentIndex === index;
              return (
                <li
                  key={step}
                  className={`relative mb-1 flex break-inside-avoid items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-300 ${
                    current ? "bg-violet-500/[0.12] ring-1 ring-inset ring-violet-500/30" : ""
                  }`}
                >
                  <span
                    className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold transition-all duration-300 ${
                      done
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40"
                        : current
                          ? "bg-linear-to-br from-violet-500 to-fuchsia-500 text-white"
                          : "bg-raised text-faint ring-1 ring-line-strong"
                    }`}
                  >
                    {current && <span className="absolute inset-0 animate-ping-slow rounded-full bg-violet-500/50" />}
                    {done ? <CheckIcon size={12} /> : <span className="relative">{index + 1}</span>}
                  </span>
                  <span className={`flex-1 ${done ? "text-muted" : current ? "font-semibold text-ink" : "text-faint"}`}>{step}</span>
                  {current && <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fuchsia-300">now</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <p className="flex items-center gap-2 border-t border-line pt-4 text-[12px] text-faint">
          <ArrowRightIcon size={12} />
          The copy runs on the server as a background job. You can reload this page or close the tab — come back any time to see its status.
        </p>
      </div>
    </section>
  );
}
