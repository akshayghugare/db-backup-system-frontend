import { useMemo, useState } from "react";

import { formatBytes, formatNumber, tableId } from "../../utils/format.js";
import { CheckIcon, GridIcon, LayersIcon, RefreshIcon, SearchIcon, SpinnerIcon, TableIcon } from "../Icons.jsx";
import { SectionHeader } from "../ui.jsx";

export const requiredParents = (tables, selected) => {
  const byId = new Map(tables.map((table) => [tableId(table), table]));
  const required = new Map();
  const queue = [...selected];
  while (queue.length > 0) {
    const id = queue.pop();
    const table = byId.get(id);
    if (!table) continue;
    for (const reference of table.references) {
      const parentId = tableId(reference);
      if (selected.has(parentId) || required.has(parentId) || !byId.has(parentId)) continue;
      required.set(parentId, `${table.schema}.${table.name}`);
      queue.push(parentId);
    }
  }
  return required;
};

function ModeOption({ checked, onSelect, disabled, title, description, icon }) {
  return (
    <label
      className={`group relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
        checked
          ? "border-violet-500/60 bg-linear-to-br from-violet-600/15 to-fuchsia-600/5 shadow-[0_0_0_4px_rgb(139_92_246/0.08)]"
          : "border-line bg-field/40 hover:border-line-strong hover:bg-raised/40"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input type="radio" checked={checked} onChange={onSelect} disabled={disabled} className="sr-only" />
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
          checked ? "bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-950/50" : "bg-raised text-faint group-hover:text-accent-soft"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-faint">{description}</span>
      </span>
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
          checked ? "border-transparent bg-accent text-white" : "border-line-strong"
        }`}
      >
        {checked && <CheckIcon size={12} />}
      </span>
    </label>
  );
}

export default function TablePicker({
  mode,
  onModeChange,
  tablesState,
  onLoadTables,
  selected,
  onSelectedChange,
  disabled,
  sourceProblem,
}) {
  const [query, setQuery] = useState("");
  const tables = tablesState.data?.tables ?? [];

  const required = useMemo(() => requiredParents(tables, selected), [tables, selected]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tables;
    return tables.filter((table) => `${table.schema}.${table.name}`.toLowerCase().includes(needle));
  }, [tables, query]);
  const largest = useMemo(() => Math.max(1, ...tables.map((table) => Number(table.total_bytes) || 0)), [tables]);

  const totals = useMemo(() => {
    let rows = 0;
    let bytes = 0;
    for (const table of tables) {
      const id = tableId(table);
      if (selected.has(id) || required.has(id)) {
        rows += table.estimated_rows;
        bytes += table.total_bytes;
      }
    }
    return { rows, bytes };
  }, [tables, selected, required]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  };

  const setFiltered = (checked) => {
    const next = new Set(selected);
    for (const table of filtered) {
      const id = tableId(table);
      if (checked) next.add(id);
      else next.delete(id);
    }
    onSelectedChange(next);
  };

  const done = mode === "FULL" || selected.size > 0;

  return (
    <section className="panel animate-fade-up overflow-hidden" aria-label="Choose what to copy">
      <div className="h-1 bg-linear-to-r from-purple-500 via-violet-400 to-purple-500" />
      <SectionHeader
        step="3"
        done={done}
        title="Tables — choose what to copy"
        subtitle="Copy every table, or pick only the tables whose data you need. Leaving out very large tables (logs, history) makes the copy much faster."
      />
      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeOption
            checked={mode === "FULL"}
            onSelect={() => onModeChange("FULL")}
            disabled={disabled}
            icon={<LayersIcon size={18} />}
            title="All tables (full copy)"
            description="Structure and every row of every table."
          />
          <ModeOption
            checked={mode === "SELECTED"}
            onSelect={() => onModeChange("SELECTED")}
            disabled={disabled}
            icon={<GridIcon size={18} />}
            title="Only selected tables"
            description="Full structure is created; only the tables you pick get their rows. Referenced tables are added automatically."
          />
        </div>

        {mode === "SELECTED" && (
          <div className="animate-fade-up space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={onLoadTables}
                disabled={disabled || tablesState.loading || Boolean(sourceProblem)}
              >
                {tablesState.loading ? <SpinnerIcon /> : tablesState.data ? <RefreshIcon /> : <TableIcon />}
                {tablesState.loading ? "Loading tables…" : tablesState.data ? "Reload tables" : "Load tables from Backup FROM"}
              </button>
              {sourceProblem && !tablesState.data && <span className="text-xs text-faint">Fill in Backup FROM first ({sourceProblem}).</span>}
              {tablesState.data && (
                <span className="flex flex-wrap gap-1.5 text-[11.5px]">
                  <span className="rounded-md bg-raised px-2 py-1 text-muted">
                    <strong className="text-ink">{formatNumber(tablesState.data.total_tables)}</strong> tables in “{tablesState.data.database}”
                  </span>
                  <span className="rounded-md bg-raised px-2 py-1 text-muted">~{formatNumber(tablesState.data.estimated_rows)} rows</span>
                  <span className="rounded-md bg-raised px-2 py-1 text-muted">{formatBytes(tablesState.data.total_bytes)}</span>
                </span>
              )}
            </div>
            {tablesState.error && <p className="animate-fade-in text-[13px] text-rose-400">{tablesState.error}</p>}

            {tablesState.loading && !tablesState.data && (
              <div className="space-y-2 rounded-xl border border-line p-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-4 w-4" />
                    <div className="skeleton h-3.5 flex-1" style={{ maxWidth: `${40 + i * 9}%` }} />
                    <div className="skeleton h-3.5 w-16" />
                  </div>
                ))}
              </div>
            )}

            {tablesState.data && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="relative block w-full max-w-xs">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search tables…"
                      className="field h-9 pl-9"
                      disabled={disabled}
                    />
                  </span>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setFiltered(true)} disabled={disabled}>
                    Select {query ? "shown" : "all"}
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setFiltered(false)} disabled={disabled}>
                    Clear {query ? "shown" : "all"}
                  </button>
                </div>

                <div className="max-h-96 overflow-auto rounded-xl border border-line">
                  <table className="data-table w-full text-[13px]">
                    <thead className="sticky top-0 z-10 backdrop-blur">
                      <tr>
                        <th className="w-10" />
                        <th>Table</th>
                        <th className="text-right">Rows (est.)</th>
                        <th className="w-44 text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((table) => {
                        const id = tableId(table);
                        const isSelected = selected.has(id);
                        const neededBy = required.get(id);
                        const active = isSelected || Boolean(neededBy);
                        return (
                          <tr
                            key={id}
                            className={`cursor-pointer ${active ? "bg-violet-500/[0.07]" : "hover:bg-raised/50"}`}
                            onClick={() => !disabled && !(neededBy && !isSelected) && toggle(id)}
                          >
                            <td className="py-2.5">
                              <input
                                type="checkbox"
                                checked={active}
                                disabled={disabled || (Boolean(neededBy) && !isSelected)}
                                onChange={() => toggle(id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4"
                                aria-label={`Copy data of ${table.schema}.${table.name}`}
                              />
                            </td>
                            <td className="py-2.5">
                              <span className={active ? "text-ink" : "text-muted"}>
                                <span className="text-faint">{table.schema}.</span>
                                <span className="font-medium">{table.name}</span>
                              </span>
                              {neededBy && !isSelected && (
                                <span className="ml-2 inline-flex rounded-md bg-fuchsia-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-fuchsia-300 ring-1 ring-inset ring-fuchsia-400/30">
                                  required by {neededBy}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-muted">{formatNumber(table.estimated_rows)}</td>
                            <td className="py-2.5">
                              <div className="flex items-center justify-end gap-2.5">
                                <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-raised sm:block">
                                  <span
                                    className="block h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
                                    style={{ width: `${Math.max(3, ((Number(table.total_bytes) || 0) / largest) * 100)}%` }}
                                  />
                                </span>
                                <span className="w-16 text-right tabular-nums text-muted">{formatBytes(table.total_bytes)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-faint">
                            No tables match “{query}”.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] px-4 py-2.5 text-[12.5px] text-violet-100">
                  <span>
                    <strong>{formatNumber(selected.size)}</strong> selected
                    {required.size > 0 && (
                      <>
                        {" "}
                        + <strong>{formatNumber(required.size)}</strong> required by relationships
                      </>
                    )}
                  </span>
                  <span className="text-violet-200/70">
                    ~{formatNumber(totals.rows)} rows · {formatBytes(totals.bytes)} to copy
                  </span>
                  <span className="text-violet-200/50">All other tables are created empty.</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
