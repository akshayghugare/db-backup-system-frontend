import { useMemo, useState } from "react";

import { formatBytes, formatNumber, tableId } from "../../utils/format.js";
import { SpinnerIcon, TableIcon } from "../Icons.jsx";
import { StepBadge } from "../ui.jsx";

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

function ModeOption({ checked, onSelect, disabled, title, description }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-[13px] ${
        checked ? "border-amber-500/60 bg-amber-500/5" : "border-line hover:border-line-strong"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input type="radio" checked={checked} onChange={onSelect} disabled={disabled} className="mt-0.5 accent-amber-500" />
      <span>
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-xs text-faint">{description}</span>
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

  return (
    <section className="panel border-violet-500/40" aria-label="Choose what to copy">
      <div className="border-b border-line p-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <StepBadge>3</StepBadge>
          <TableIcon className="text-violet-400" />
          Tables — choose what to copy
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Copy every table, or pick only the tables whose data you need. Leaving out very large tables (logs, history) makes the
          copy much faster.
        </p>
      </div>
      <div className="space-y-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <ModeOption
            checked={mode === "FULL"}
            onSelect={() => onModeChange("FULL")}
            disabled={disabled}
            title="All tables (full copy)"
            description="Structure and every row of every table."
          />
          <ModeOption
            checked={mode === "SELECTED"}
            onSelect={() => onModeChange("SELECTED")}
            disabled={disabled}
            title="Only selected tables (selective restore)"
            description="Full structure is created; only the tables you pick get their rows. Tables they reference are added automatically."
          />
        </div>

        {mode === "SELECTED" && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-ghost h-[30px] px-2.5" onClick={onLoadTables} disabled={disabled || tablesState.loading || Boolean(sourceProblem)}>
                {tablesState.loading ? <SpinnerIcon /> : <TableIcon />}
                {tablesState.data ? "Reload tables" : "Load tables from Backup FROM"}
              </button>
              {sourceProblem && !tablesState.data && <span className="text-xs text-faint">Fill in Backup FROM first ({sourceProblem}).</span>}
              {tablesState.data && (
                <span className="text-xs text-faint">
                  {formatNumber(tablesState.data.total_tables)} tables in “{tablesState.data.database}” · about{" "}
                  {formatNumber(tablesState.data.estimated_rows)} rows · {formatBytes(tablesState.data.total_bytes)}
                </span>
              )}
            </div>
            {tablesState.error && <p className="text-[13px] text-rose-400">{tablesState.error}</p>}

            {tablesState.data && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tables…"
                    className="field h-8 max-w-xs"
                    disabled={disabled}
                  />
                  <button type="button" className="text-xs text-accent hover:underline disabled:opacity-50" onClick={() => setFiltered(true)} disabled={disabled}>
                    Select {query ? "shown" : "all"}
                  </button>
                  <button type="button" className="text-xs text-muted hover:underline disabled:opacity-50" onClick={() => setFiltered(false)} disabled={disabled}>
                    Clear {query ? "shown" : "all"}
                  </button>
                </div>

                <div className="max-h-80 overflow-auto rounded-md border border-line">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-raised text-left text-xs text-faint">
                      <tr>
                        <th className="w-8 p-2" />
                        <th className="p-2 font-medium">Table</th>
                        <th className="p-2 text-right font-medium">Rows (est.)</th>
                        <th className="p-2 text-right font-medium">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((table) => {
                        const id = tableId(table);
                        const isSelected = selected.has(id);
                        const neededBy = required.get(id);
                        return (
                          <tr key={id} className="border-t border-line hover:bg-raised/60">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={isSelected || Boolean(neededBy)}
                                disabled={disabled || (Boolean(neededBy) && !isSelected)}
                                onChange={() => toggle(id)}
                                className="accent-amber-500"
                                aria-label={`Copy data of ${table.schema}.${table.name}`}
                              />
                            </td>
                            <td className="p-2">
                              <span className="text-ink">
                                <span className="text-faint">{table.schema}.</span>
                                {table.name}
                              </span>
                              {neededBy && !isSelected && (
                                <span className="ml-2 rounded border border-violet-500/40 px-1.5 py-px text-[11px] text-violet-300">
                                  required by {neededBy}
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right tabular-nums text-muted">{formatNumber(table.estimated_rows)}</td>
                            <td className="p-2 text-right tabular-nums text-muted">{formatBytes(table.total_bytes)}</td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-faint">
                            No tables match “{query}”.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted">
                  {formatNumber(selected.size)} selected
                  {required.size > 0 && ` + ${formatNumber(required.size)} required by relationships`} · about{" "}
                  {formatNumber(totals.rows)} rows · {formatBytes(totals.bytes)} to copy. All other tables are created empty.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
