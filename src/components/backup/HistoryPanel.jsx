import { Fragment, useCallback, useEffect, useState } from "react";

import { listHistory } from "../../api/backup.js";
import { formatBytes, formatDuration, formatNumber } from "../../utils/format.js";
import { ArrowRightIcon, HistoryIcon, SpinnerIcon } from "../Icons.jsx";
import { StatusPill } from "../ui.jsx";

const PAGE_SIZE = 10;

const endpoint = (side) => `${side.host}:${side.port}`;

function Detail({ label, children }) {
  return (
    <div>
      <p className="text-[11px] text-faint">{label}</p>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

function EntryDetails({ entry }) {
  const summary = entry.summary;
  return (
    <div className="grid gap-3 bg-field/60 p-3 sm:grid-cols-2 lg:grid-cols-4">
      <Detail label="Backup FROM">
        <span className="font-medium">{entry.backup_from.database}</span>
        <span className="block text-xs text-faint">
          {endpoint(entry.backup_from)} · SSL {entry.backup_from.ssl ? "on" : "off"}
          {entry.backup_from.server_version && ` · PostgreSQL ${entry.backup_from.server_version}`}
        </span>
      </Detail>
      <Detail label="Restore TO">
        <span className="font-medium">{entry.restore_to.database}</span>
        <span className="block text-xs text-faint">
          {endpoint(entry.restore_to)}
          {entry.restore_to.server_version && ` · PostgreSQL ${entry.restore_to.server_version}`}
        </span>
        {entry.restore_to.was_empty !== null && (
          <span className="block text-xs text-faint">
            {entry.restore_to.was_empty ? "Destination was empty" : `${entry.restore_to.replaced_tables} existing tables replaced`}
          </span>
        )}
      </Detail>
      <Detail label="Run by">
        {entry.run_by.name}
        <span className="block text-xs text-faint">{entry.run_by.email}</span>
      </Detail>
      <Detail label="Timing">
        <span className="block text-xs text-muted">Queued {new Date(entry.created_at).toLocaleString()}</span>
        {entry.started_at && <span className="block text-xs text-muted">Started {new Date(entry.started_at).toLocaleString()}</span>}
        {entry.finished_at && <span className="block text-xs text-muted">Finished {new Date(entry.finished_at).toLocaleString()}</span>}
      </Detail>

      {entry.mode === "SELECTED" && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Detail label={`Selected tables (${entry.selected_tables.length})`}>
            <p className="break-words text-xs text-muted">{entry.selected_tables.join(", ")}</p>
          </Detail>
          {entry.auto_included_tables.length > 0 && (
            <div className="mt-2">
              <Detail label={`Added automatically for relationships (${entry.auto_included_tables.length})`}>
                <p className="break-words text-xs text-violet-300">{entry.auto_included_tables.join(", ")}</p>
              </Detail>
            </div>
          )}
        </div>
      )}

      {summary && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="mb-1 text-[11px] text-faint">Copied</p>
          <p className="text-xs text-muted">
            {formatNumber(summary.tables)} tables · {formatNumber(summary.rows)} rows · {formatNumber(summary.schemas)} schemas ·{" "}
            {formatNumber(summary.sequences)} sequences · {formatNumber(summary.constraints)} constraints ·{" "}
            {formatNumber(summary.foreign_keys)} foreign keys · {formatNumber(summary.indexes)} indexes ·{" "}
            {formatNumber(summary.views + summary.materialized_views)} views · {formatNumber(summary.functions)} functions ·{" "}
            {formatNumber(summary.triggers)} triggers
          </p>
        </div>
      )}

      {entry.error_message && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="mb-1 text-[11px] text-faint">Error</p>
          <p className="whitespace-pre-line break-words text-xs text-rose-400">{entry.error_message}</p>
        </div>
      )}
    </div>
  );
}

export default function HistoryPanel({ refreshKey }) {
  const [scope, setScope] = useState("all");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listHistory({ scope, status, search: query, limit: PAGE_SIZE, offset }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scope, status, query, offset]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOffset(0);
      setQuery(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="panel" aria-label="Backup & restore history">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <HistoryIcon className="text-muted" /> History — what was backed up and where it was restored
          {loading && <SpinnerIcon className="text-accent" />}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-line-strong text-xs">
            {[
              ["all", "Everyone"],
              ["mine", "Only mine"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setScope(value);
                  setOffset(0);
                }}
                className={`px-2.5 py-1.5 ${scope === value ? "bg-raised text-ink" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            className="field h-8 w-auto text-xs"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Processing</option>
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search database, host, user…"
            className="field h-8 w-56 text-xs"
          />
        </div>
      </div>

      {error && <p className="p-3 text-[13px] text-rose-400">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead className="bg-raised text-left text-xs text-faint">
            <tr>
              <th className="p-2 font-medium">When</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Backup FROM → Restore TO</th>
              <th className="p-2 font-medium">Mode</th>
              <th className="p-2 text-right font-medium">Data copied</th>
              <th className="p-2 text-right font-medium">Duration</th>
              <th className="p-2 font-medium">Run by</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((entry) => (
              <Fragment key={entry.id}>
                <tr
                  className={`cursor-pointer border-t border-line hover:bg-raised/60 ${expanded === entry.id ? "bg-raised/60" : ""}`}
                  onClick={() => setExpanded((current) => (current === entry.id ? null : entry.id))}
                >
                  <td className="whitespace-nowrap p-2 text-muted">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <StatusPill status={entry.status} label={entry.status_label} />
                  </td>
                  <td className="p-2">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      <span>
                        <span className="font-medium">{entry.backup_from.database}</span>
                        <span className="block text-[11px] text-faint">{endpoint(entry.backup_from)}</span>
                      </span>
                      <ArrowRightIcon size={13} className="text-faint" />
                      <span>
                        <span className="font-medium">{entry.restore_to.database}</span>
                        <span className="block text-[11px] text-faint">{endpoint(entry.restore_to)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="p-2 text-muted">
                    {entry.mode === "SELECTED" ? `Selected (${entry.selected_tables.length})` : "Full"}
                    {entry.overwrite && <span className="block text-[11px] text-faint">overwrite</span>}
                  </td>
                  <td className="p-2 text-right tabular-nums text-muted">
                    {entry.rows_copied === null ? "—" : `${formatNumber(entry.rows_copied)} rows`}
                    {entry.bytes_copied ? <span className="block text-[11px] text-faint">{formatBytes(entry.bytes_copied)}</span> : null}
                  </td>
                  <td className="p-2 text-right tabular-nums text-muted">{entry.duration_ms === null ? "—" : formatDuration(entry.duration_ms)}</td>
                  <td className="p-2 text-muted">
                    {entry.run_by.name}
                    <span className="block text-[11px] text-faint">{entry.run_by.email}</span>
                  </td>
                </tr>
                {expanded === entry.id && (
                  <tr className="border-t border-line">
                    <td colSpan={7} className="p-0">
                      <EntryDetails entry={entry} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-faint">
                  No backup &amp; restore runs {status || query || scope === "mine" ? "match these filters" : "yet"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-2 border-t border-line p-2 text-xs text-muted">
          <span>
            {formatNumber(total)} runs · page {page} of {pages}
          </span>
          <span className="flex gap-2">
            <button type="button" className="btn-ghost h-7 px-2" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <button type="button" className="btn-ghost h-7 px-2" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </span>
        </div>
      )}
    </section>
  );
}
