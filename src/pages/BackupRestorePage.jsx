import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchConfig, getActiveJob, getJob, listTables, startJob } from "../api/backup.js";
import CredentialsPanel from "../components/backup/CredentialsPanel.jsx";
import JobProgress, { TopProgress, jobPercent } from "../components/backup/JobProgress.jsx";
import { JobCompleted, JobFailed } from "../components/backup/JobResult.jsx";
import HistoryPanel from "../components/backup/HistoryPanel.jsx";
import ReviewModal from "../components/backup/ReviewModal.jsx";
import TablePicker, { requiredParents } from "../components/backup/TablePicker.jsx";
import { AlertIcon, CheckIcon, DatabaseIcon, DownloadIcon, LockIcon, SpinnerIcon, UploadIcon } from "../components/Icons.jsx";
import AppLayout from "../components/layout/AppLayout.jsx";
import DesktopDownloadButton from "../components/DesktopDownload.jsx";
import PendingApproval from "../components/PendingApproval.jsx";
import { Alert, Field, StepBadge } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { EMPTY_FORM, formatNumber, isRestoreHostAllowed, toPayload, validateCredentials } from "../utils/format.js";

const POLL_INTERVAL_MS = 1500;
const DEFAULT_NOT_LOCAL =
  "Restore to staging or remote databases is not allowed. You can only restore backups to the local development database (localhost).";
const isActive = (job) => job && (job.status === "PENDING" || job.status === "IN_PROGRESS");
const BASE_TITLE = "Database Backup & Restore";

export default function BackupRestorePage() {
  const { isApproved } = useAuth();
  return isApproved ? <BackupRestoreWorkspace /> : <PendingApproval />;
}

function FlowEndpoint({ tone, label, name, host, note }) {
  const from = tone === "from";
  return (
    <div
      className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        from ? "border-sky-500/25 bg-sky-500/[0.05]" : "border-fuchsia-500/25 bg-fuchsia-500/[0.05]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
            from ? "bg-sky-500/15 text-sky-300 ring-sky-400/30" : "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30"
          }`}
        >
          {from ? <UploadIcon size={18} /> : <DownloadIcon size={18} />}
        </span>
        <div className="min-w-0">
          <p className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${from ? "text-sky-300" : "text-fuchsia-300"}`}>{label}</p>
          <p className={`truncate text-[15px] font-bold ${name ? "text-ink" : "text-faint"}`}>{name || "Not set yet"}</p>
          <p className="truncate font-mono text-[11px] text-faint">{host || note}</p>
        </div>
      </div>
    </div>
  );
}

function FlowHero({ from, to, mode, selectedCount, running, percent }) {
  const host = (form) => (form.DB_HOST.trim() ? `${form.DB_HOST.trim()}:${form.DB_PORT}` : "");
  return (
    <section className="panel relative mb-6 animate-fade-up overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_160px_at_50%_0%,rgb(139_92_246/0.12),transparent)]" />
      <div className="relative flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <FlowEndpoint tone="from" label="Backup FROM · read only" name={from.DB_NAME.trim()} host={host(from)} note="Source database" />

        <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 px-2 md:w-52">
          <svg viewBox="0 0 200 16" className="hidden h-4 w-full md:block" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="hero-flow" x1="0" x2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#e879f9" />
              </linearGradient>
            </defs>
            <path d="M0 8 H200" stroke="#ffffff12" strokeWidth="3" />
            <path
              d="M0 8 H200"
              stroke="url(#hero-flow)"
              strokeWidth="3"
              strokeDasharray="8 6"
              strokeLinecap="round"
              className={running ? "animate-flow" : ""}
              opacity={running ? 1 : 0.45}
            />
          </svg>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${
              running ? "bg-violet-500/20 text-violet-100 ring-violet-400/40" : "bg-raised text-muted ring-line-strong"
            }`}
          >
            {running ? (
              <>
                <SpinnerIcon size={11} /> Copying · {percent}%
              </>
            ) : mode === "SELECTED" ? (
              `${formatNumber(selectedCount)} selected table${selectedCount === 1 ? "" : "s"}`
            ) : (
              "Full copy"
            )}
          </span>
        </div>

        <FlowEndpoint tone="to" label="Restore TO · gets replaced" name={to.DB_NAME.trim()} host={host(to)} note="Local destination" />
      </div>
    </section>
  );
}

function Checklist({ items }) {
  const doneCount = items.filter((item) => item.ok).length;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
        <span>Ready to run</span>
        <span className="tabular-nums text-accent-soft">
          {doneCount}/{items.length}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500 ease-out"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className={`flex items-center gap-2.5 text-[12.5px] transition-colors ${item.ok ? "text-ink/90" : "text-faint"}`}>
            <span
              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                item.ok ? "scale-100 bg-emerald-500/20 text-emerald-300" : "scale-90 bg-raised ring-1 ring-line-strong"
              }`}
            >
              {item.ok && <CheckIcon size={11} />}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BackupRestoreWorkspace() {
  const [from, setFrom] = useState({ ...EMPTY_FORM, DB_SSL: true });
  const [to, setTo] = useState({ ...EMPTY_FORM });
  const [overwrite, setOverwrite] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [mode, setMode] = useState("FULL");
  const [tablesState, setTablesState] = useState({ loading: false, data: null, error: null });
  const [selected, setSelected] = useState(() => new Set());
  const [reviewing, setReviewing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const [job, setJob] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [busyBy, setBusyBy] = useState(null);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [notLocalMessage, setNotLocalMessage] = useState(DEFAULT_NOT_LOCAL);
  const [restoreUnavailable, setRestoreUnavailable] = useState(null);
  const pollRef = useRef(null);
  const statusRef = useRef(null);

  const running = isActive(job);
  const locked = running || starting;
  const percent = job ? jobPercent(job) : 0;

  const refreshJobs = useCallback(() => setHistoryKey((key) => key + 1), []);

  useEffect(() => {
    fetchConfig()
      .then((config) => {
        setNotLocalMessage(config.restore_not_local_message);
        setRestoreUnavailable(config.restore_available === false ? config.restore_unavailable_message : null);
      })
      .catch(() => undefined);
    getActiveJob()
      .then((data) => {
        if (data.job) setJob(data.job);
        setBusyBy(data.busy && !data.job ? data.busy_by : null);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  // Show progress in the browser tab title while a copy runs.
  useEffect(() => {
    if (running) document.title = `${percent}% · Copying… — ${BASE_TITLE}`;
    else if (job?.status === "COMPLETED") document.title = `✓ Completed — ${BASE_TITLE}`;
    else if (job?.status === "FAILED") document.title = `✕ Failed — ${BASE_TITLE}`;
    else document.title = BASE_TITLE;
  }, [running, percent, job?.status]);
  useEffect(() => () => void (document.title = BASE_TITLE), []);

  // Bring the live progress card into view when a run starts.
  useEffect(() => {
    if (job?.id && running) statusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [job?.id]); // only when a new job appears, not on every poll

  useEffect(() => {
    if (!running || !job?.id) return undefined;
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await getJob(job.id);
        if (cancelled) return;
        setConnectionIssue(false);
        setJob(next);
        if (!isActive(next)) {
          refreshJobs();
          if (next.status === "COMPLETED") {
            setFrom((prev) => ({ ...prev, DB_PASSWORD: "" }));
            setTo((prev) => ({ ...prev, DB_PASSWORD: "" }));
            setConfirmName("");
            setOverwrite(false);
          }
          return;
        }
      } catch (error) {
        if (cancelled) return;
        if (error.status === 401) return;
        setConnectionIssue(true);
      }
      pollRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
    };
    pollRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(pollRef.current);
    };
  }, [running, job?.id, refreshJobs]);

  const changeFrom = (next) => {
    const sourceChanged = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_SSL"].some((key) => next[key] !== from[key]);
    setFrom(next);
    if (sourceChanged && tablesState.data) {
      setTablesState({ loading: false, data: null, error: null });
      setSelected(new Set());
    }
  };

  const sourceProblem = validateCredentials(from, "Backup FROM");

  const loadTables = async () => {
    if (sourceProblem) return;
    setTablesState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await listTables(toPayload(from));
      setTablesState({ loading: false, data, error: null });
      const available = new Set(data.tables.map((table) => JSON.stringify([table.schema, table.name])));
      setSelected((current) => new Set([...current].filter((id) => available.has(id))));
    } catch (error) {
      setTablesState((current) => ({ ...current, loading: false, error: error.message }));
    }
  };

  const changeMode = (next) => {
    setMode(next);
    if (next === "SELECTED" && !tablesState.data && !tablesState.loading && !sourceProblem) void loadTables();
  };

  const required = useMemo(() => requiredParents(tablesState.data?.tables ?? [], selected), [tablesState.data, selected]);

  const destinationName = to.DB_NAME.trim();
  const hostWarning = to.DB_HOST.trim() !== "" && !isRestoreHostAllowed(to.DB_HOST) ? notLocalMessage : null;

  const problems = useMemo(() => {
    const sameHost = (a, b) => {
      const local = (value) => (["localhost", "127.0.0.1", "::1"].includes(value) ? "localhost" : value);
      return local(a.trim().toLowerCase()) === local(b.trim().toLowerCase());
    };
    const fromProblem = validateCredentials(from, "Backup FROM");
    const toProblem = validateCredentials(to, "Restore TO") || (isRestoreHostAllowed(to.DB_HOST) ? null : notLocalMessage);
    const sameProblem =
      sameHost(from.DB_HOST, to.DB_HOST) && Number(from.DB_PORT) === Number(to.DB_PORT) && from.DB_NAME.trim() === destinationName
        ? "Backup FROM and Restore TO are the same database — choose a different destination"
        : null;
    const tablesProblem =
      (mode === "SELECTED" && !tablesState.data ? "Load the table list and pick the tables to copy" : null) ||
      (mode === "SELECTED" && selected.size === 0 ? "Select at least one table, or choose All tables" : null);
    return { fromProblem, toProblem, sameProblem, tablesProblem };
  }, [from, to, destinationName, notLocalMessage, mode, tablesState.data, selected]);

  const formError = problems.fromProblem || problems.toProblem || problems.sameProblem || problems.tablesProblem;
  const confirmed = destinationName !== "" && confirmName.trim() === destinationName;
  const canStart = !formError && confirmed && !locked && !busyBy;

  const checklist = [
    { label: "Source database details", ok: !problems.fromProblem },
    { label: "Local destination details", ok: !problems.toProblem },
    { label: "Source and destination differ", ok: !problems.fromProblem && !problems.toProblem && !problems.sameProblem },
    { label: mode === "FULL" ? "Copy all tables" : "Tables selected", ok: !problems.tablesProblem },
    { label: "Destination name confirmed", ok: confirmed },
  ];

  const selectionSummary = `Data for ${formatNumber(selected.size)} selected table${selected.size === 1 ? "" : "s"}${
    required.size > 0 ? ` + ${formatNumber(required.size)} required by relationships` : ""
  }. Every other table is created empty.`;

  const start = async () => {
    setReviewing(false);
    setStartError(null);
    setStarting(true);
    try {
      const created = await startJob({
        from: toPayload(from),
        to: toPayload(to),
        overwrite_destination: overwrite,
        confirm_destination_name: confirmName.trim(),
        mode,
        selected_tables:
          mode === "SELECTED"
            ? [...selected].map((id) => {
                const [schema, name] = JSON.parse(id);
                return { schema, name };
              })
            : undefined,
      });
      setNow(Date.now());
      setJob(created);
      refreshJobs();
    } catch (error) {
      setStartError(error.message);
      if (error.status === 409) {
        getActiveJob()
          .then((data) => {
            if (data.job) setJob(data.job);
            setBusyBy(data.busy && !data.job ? data.busy_by : null);
          })
          .catch(() => undefined);
      }
    } finally {
      setStarting(false);
    }
  };

  const showStatus = Boolean(job) && (running || job.status === "FAILED" || (job.status === "COMPLETED" && Boolean(job.result?.steps)));
  const toLabel = destinationName || "Restore TO";
  const warning = formError || (confirmName.trim() !== "" && !confirmed ? `The name does not match "${destinationName}"` : null);

  return (
    <AppLayout
      title="Backup & Restore"
      subtitle={
        <>
          Make a complete copy of one PostgreSQL database inside another — structure, tables, relationships, indexes, constraints,
          sequences and every record. It only runs when you press the button. The details you type are used for this one run and are
          not saved.
        </>
      }
      busy={starting}
    >
      {running && <TopProgress percent={percent} />}

      {restoreUnavailable && (
        <Alert tone="warning" className="mb-6">
          <p className="font-semibold text-amber-100">Restore TO your local database is not possible from this server</p>
          <p className="mt-1 text-amber-200/90">{restoreUnavailable}</p>
          <p className="mt-2 text-amber-200/90">
            Use the <strong>desktop app</strong> instead — the same app with the same account and history, running on your computer.
          </p>
          <DesktopDownloadButton variant="primary" label="Download desktop app" className="mt-3" />
        </Alert>
      )}

      <FlowHero from={from} to={to} mode={mode} selectedCount={selected.size} running={running} percent={percent} />

      {showStatus && (
        <div ref={statusRef} className="mb-6 scroll-mt-24">
          {running && <JobProgress job={job} now={now} connectionIssue={connectionIssue} />}
          {job.status === "FAILED" && <JobFailed job={job} />}
          {job.status === "COMPLETED" && <JobCompleted job={job} />}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="@container min-w-0 space-y-6">
          <div className="grid items-stretch gap-6 @3xl:grid-cols-2">
            <CredentialsPanel side="from" form={from} onChange={changeFrom} disabled={locked} restoreNotLocalMessage={notLocalMessage} />
            <CredentialsPanel
              side="to"
              form={to}
              onChange={setTo}
              disabled={locked}
              hostWarning={hostWarning}
              restoreNotLocalMessage={notLocalMessage}
            />
          </div>

          <TablePicker
            mode={mode}
            onModeChange={changeMode}
            tablesState={tablesState}
            onLoadTables={loadTables}
            selected={selected}
            onSelectedChange={setSelected}
            disabled={locked}
            sourceProblem={sourceProblem}
          />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <section className="panel animate-fade-up overflow-hidden ring-1 ring-rose-500/15" aria-label="Confirm and run">
            <div className="h-1 bg-linear-to-r from-rose-500 via-fuchsia-500 to-violet-500" />
            <div className="border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-3 text-[15px] font-semibold">
                <StepBadge done={canStart}>4</StepBadge>
                Confirm and run
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                The copy runs in one transaction: if anything fails, Restore TO is left exactly as it was. An app using Restore TO may pause
                until the copy finishes.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <Checklist items={checklist} />

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-[12.5px] transition-all ${
                  overwrite ? "border-rose-500/40 bg-rose-500/[0.07]" : "border-line bg-field/40 hover:border-line-strong"
                } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  disabled={locked}
                  className="mt-0.5 h-4 w-4 accent-rose-500"
                />
                <span>
                  <span className={`block font-medium ${overwrite ? "text-rose-200" : "text-ink"}`}>
                    Overwrite the destination
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-faint">
                    Delete everything already in <strong className="text-muted">{toLabel}</strong> and replace it. Leave unticked for a new,
                    empty database — if it is not empty, the run stops and nothing is changed.
                  </span>
                </span>
              </label>

              <Field label={`Type ${destinationName ? `"${destinationName}"` : "the Restore TO name"} to confirm`} tech="confirm_destination_name">
                <span className="relative block">
                  <LockIcon className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${confirmed ? "text-emerald-400" : "text-faint"}`} />
                  <input
                    type="text"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={destinationName || "Enter the Restore TO database name first"}
                    autoComplete="off"
                    spellCheck={false}
                    className={`field pl-9 ${confirmed ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/15" : ""}`}
                    disabled={locked || !destinationName}
                  />
                </span>
              </Field>

              {warning && !running && (
                <p key={warning} className="flex animate-fade-in items-start gap-2 text-[12px] text-amber-300">
                  <AlertIcon size={13} className="mt-px shrink-0" /> {warning}
                </p>
              )}
              {busyBy && !running && (
                <Alert tone="warning">A backup &amp; restore started by {busyBy} is running. Wait for it to finish.</Alert>
              )}
              {startError && <Alert tone="error">{startError}</Alert>}

              <button type="button" onClick={() => setReviewing(true)} disabled={!canStart} className="btn-accent h-12 w-full text-[14px]">
                {locked ? <SpinnerIcon size={16} /> : <DatabaseIcon size={16} />}
                {starting ? "Starting…" : running ? `Running… ${percent}%` : "Backup & Restore"}
              </button>
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-6">
        <HistoryPanel refreshKey={historyKey} />
      </div>

      {reviewing && (
        <ReviewModal
          from={from}
          to={to}
          overwrite={overwrite}
          mode={mode}
          selectionSummary={selectionSummary}
          onCancel={() => setReviewing(false)}
          onConfirm={() => void start()}
        />
      )}
    </AppLayout>
  );
}
