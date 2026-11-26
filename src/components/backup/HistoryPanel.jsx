import { Fragment, useCallback, useEffect, useState } from "react";

import { listHistory } from "../../api/backup.js";
import { formatBytes, formatDuration, formatNumber } from "../../utils/format.js";
import { ChevronDownIcon, ChevronRightIcon, HistoryIcon, SearchIcon, SpinnerIcon } from "../Icons.jsx";
import { Avatar, EmptyState, SkeletonRows, StatusPill } from "../ui.jsx";

const PAGE_SIZE = 10;

const endpoint = (side) => `${side.host}:${side.port}`;

function Detail({ label, children }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-faint">{label}</p>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

function EntryDetails({ entry }) {
  const summary = entry.summary;
  return (
    <div className="grid animate-fade-in gap-3 bg-field/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Detail label="Backup FROM">
        <span className="font-semibold text-sky-200">{entry.backup_from.database}</span>
        <span className="block text-xs text-faint">
          {endpoint(entry.backup_from)} · SSL {entry.backup_from.ssl ? "on" : "off"}
          {entry.backup_from.server_version && ` · PostgreSQL ${entry.backup_from.server_version}`}
        </span>
      </Detail>
      <Detail label="Restore TO">
        <span className="font-semibold text-fuchsia-200">{entry.restore_to.database}</span>
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
        <div className="space-y-3 sm:col-span-2 lg:col-span-4">
          <Detail label={`Selected tables (${entry.selected_tables.length})`}>
            <p className="break-words text-xs text-muted">{entry.selected_tables.join(", ")}</p>
          </Detail>
          {entry.auto_included_tables.length > 0 && (
            <Detail label={`Added automatically for relationships (${entry.auto_included_tables.length})`}>
              <p className="break-words text-xs text-fuchsia-300">{entry.auto_included_tables.join(", ")}</p>
            </Detail>
          )}
        </div>
      )}

      {summary && (
        <div className="sm:col-span-2 lg:col-span-4">
          <Detail label="Copied">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["tables", summary.tables],
                ["rows", summary.rows],
                ["schemas", summary.schemas],
                ["sequences", summary.sequences],
                ["constraints", summary.constraints],
                ["foreign keys", summary.foreign_keys],
                ["indexes", summary.indexes],
                ["views", summary.views + summary.materialized_views],
                ["functions", summary.functions],
                ["triggers", summary.triggers],
              ].map(([label, value]) => (
                <span key={label} className="rounded-md bg-raised px-2 py-1 text-[11.5px] text-muted">
                  <strong className="tabular-nums text-ink">{formatNumber(value)}</strong> {label}
                </span>
              ))}
            </div>
          </Detail>
        </div>
      )}

      {entry.error_message && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-faint">Error</p>
          <p className="whitespace-pre-line break-words rounded-xl border border-rose-500/25 bg-rose-500/[0.05] p-3 font-mono text-xs text-rose-200">
            {entry.error_message}
          </p>
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
    <section className="panel animate-fade-up overflow-hidden" aria-label="Backup & restore history">
      <div className="panel-header items-center">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent-soft ring-1 ring-inset ring-accent/30">
            <HistoryIcon size={16} />
          </span>
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              History
              {loading && <SpinnerIcon className="text-accent-soft" />}
            </h2>
            <p className="text-[12px] text-muted">What was backed up, and where it was restored</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="segmented">
            {[
              ["all", "Everyone"],
              ["mine", "Only mine"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                onClick={() => {
                  setScope(value);
                  setOffset(0);
                }}
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
            className="field h-9 w-auto pr-8 text-xs"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Processing</option>
          </select>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search database, host, user…"
              className="field h-9 w-60 pl-9 text-xs"
            />
          </span>
        </div>
      </div>

      {error && <p className="animate-fade-in border-b border-line px-5 py-3 text-[13px] text-rose-400">{error}</p>}

      <div className="overflow-x-auto">
        <table className="data-table w-full min-w-[900px] text-[13px]">
          <thead>
            <tr>
              <th className="w-8" />
              <th>When</th>
              <th>Status</th>
              <th>Backup FROM → Restore TO</th>
              <th>Mode</th>
              <th className="text-right">Data copied</th>
              <th className="text-right">Duration</th>
              <th>Run by</th>
            </tr>
          </thead>
          <tbody>
            {!data && loading && <SkeletonRows rows={5} cols={8} />}
            {data?.items.map((entry, index) => {
              const open = expanded === entry.id;
              return (
                <Fragment key={entry.id}>
                  <tr
                    className={`group cursor-pointer animate-fade-in ${open ? "bg-violet-500/[0.07]" : "hover:bg-raised/50"}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => setExpanded((current) => (current === entry.id ? null : entry.id))}
                  >
                    <td className="pr-0 text-faint">
                      {open ? <ChevronDownIcon className="text-accent-soft" /> : <ChevronRightIcon className="group-hover:text-accent-soft" />}
                    </td>
                    <td className="whitespace-nowrap text-muted">{new Date(entry.created_at).toLocaleString()}</td>
                    <td>
                      <StatusPill status={entry.status} label={entry.status_label} />
                    </td>
                    <td>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>
                          <span className="font-semibold text-sky-200">{entry.backup_from.database}</span>
                          <span className="block font-mono text-[10.5px] text-faint">{endpoint(entry.backup_from)}</span>
                        </span>
                        <span className="text-accent-soft">→</span>
                        <span>
                          <span className="font-semibold text-fuchsia-200">{entry.restore_to.database}</span>
                          <span className="block font-mono text-[10.5px] text-faint">{endpoint(entry.restore_to)}</span>
                        </span>
                      </span>
                    </td>
                    <td className="text-muted">
                      <span className="inline-flex rounded-md bg-raised px-1.5 py-0.5 text-[11.5px]">
                        {entry.mode === "SELECTED" ? `Selected (${entry.selected_tables.length})` : "Full"}
                      </span>
                      {entry.overwrite && <span className="block pt-0.5 text-[10.5px] text-rose-300/80">overwrite</span>}
                    </td>
                    <td className="text-right tabular-nums text-muted">
                      {entry.rows_copied === null ? "—" : `${formatNumber(entry.rows_copied)} rows`}
                      {entry.bytes_copied ? <span className="block text-[11px] text-faint">{formatBytes(entry.bytes_copied)}</span> : null}
                    </td>
                    <td className="text-right tabular-nums text-muted">{entry.duration_ms === null ? "—" : formatDuration(entry.duration_ms)}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <Avatar name={entry.run_by.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-ink/90">{entry.run_by.name}</span>
                          <span className="block truncate text-[11px] text-faint">{entry.run_by.email}</span>
                        </span>
                      </span>
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-t border-line">
                      <td colSpan={8} className="p-0">
                        <EntryDetails entry={entry} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="p-0">
                  <EmptyState icon={<HistoryIcon size={20} />} title={status || query || scope === "mine" ? "No runs match these filters" : "No runs yet"}>
                    {status || query || scope === "mine"
                      ? "Try a different status, search or scope."
                      : "Your first backup & restore will show up here with full details."}
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
          <span>
            <strong className="text-ink">{formatNumber(total)}</strong> runs · page {page} of {pages}
          </span>
          <span className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <button type="button" className="btn-ghost btn-sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </span>
        </div>
      )}
    </section>
  );
}
