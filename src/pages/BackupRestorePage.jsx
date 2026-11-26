import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchConfig, getActiveJob, getJob, listTables, startJob } from "../api/backup.js";
import CredentialsPanel from "../components/backup/CredentialsPanel.jsx";
import JobProgress from "../components/backup/JobProgress.jsx";
import { JobCompleted, JobFailed } from "../components/backup/JobResult.jsx";
import HistoryPanel from "../components/backup/HistoryPanel.jsx";
import ReviewModal from "../components/backup/ReviewModal.jsx";
import TablePicker, { requiredParents } from "../components/backup/TablePicker.jsx";
import { AlertIcon, ArrowRightIcon, DatabaseIcon, DownloadIcon, SpinnerIcon, UploadIcon } from "../components/Icons.jsx";
import PendingApproval from "../components/PendingApproval.jsx";
import UserMenu from "../components/UserMenu.jsx";
import { Field, StepBadge } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { EMPTY_FORM, formatNumber, isRestoreHostAllowed, toPayload, validateCredentials } from "../utils/format.js";

const POLL_INTERVAL_MS = 1500;
const DEFAULT_NOT_LOCAL =
  "Restore to staging or remote databases is not allowed. You can only restore backups to the local development database (localhost).";
const isActive = (job) => job && (job.status === "PENDING" || job.status === "IN_PROGRESS");

export default function BackupRestorePage() {
  const { isApproved } = useAuth();
  return isApproved ? <BackupRestoreWorkspace /> : <PendingApproval />;
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
  const pollRef = useRef(null);

  const running = isActive(job);
  const locked = running || starting;

  const refreshJobs = useCallback(() => setHistoryKey((key) => key + 1), []);

  useEffect(() => {
    fetchConfig()
      .then((config) => setNotLocalMessage(config.restore_not_local_message))
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
  const formError = useMemo(() => {
    const sameHost = (a, b) => {
      const local = (value) => (["localhost", "127.0.0.1", "::1"].includes(value) ? "localhost" : value);
      return local(a.trim().toLowerCase()) === local(b.trim().toLowerCase());
    };
    return (
      validateCredentials(from, "Backup FROM") ||
      validateCredentials(to, "Restore TO") ||
      (isRestoreHostAllowed(to.DB_HOST) ? null : notLocalMessage) ||
      (sameHost(from.DB_HOST, to.DB_HOST) && Number(from.DB_PORT) === Number(to.DB_PORT) && from.DB_NAME.trim() === destinationName
        ? "Backup FROM and Restore TO are the same database — choose a different destination"
        : null) ||
      (mode === "SELECTED" && !tablesState.data ? "Load the table list and pick the tables to copy" : null) ||
      (mode === "SELECTED" && selected.size === 0 ? "Select at least one table, or choose All tables" : null)
    );
  }, [from, to, destinationName, notLocalMessage, mode, tablesState.data, selected]);

  const confirmed = destinationName !== "" && confirmName.trim() === destinationName;
  const canStart = !formError && confirmed && !locked && !busyBy;

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


  const fromLabel = from.DB_NAME.trim() || "Backup FROM";
  const toLabel = destinationName || "Restore TO";
  const warning = formError || (confirmName.trim() !== "" && !confirmed ? `The name does not match "${destinationName}"` : null);

  return (
    <div className="mx-auto max-w-[1200px] space-y-3 p-3 lg:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <DatabaseIcon size={18} className="text-accent" />
            Database Backup &amp; Restore
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Makes a complete copy of one PostgreSQL database inside another: structure, tables, relationships, indexes, constraints,
            sequences and every record. Data is read from <strong className="text-ink">Backup FROM</strong> and written into{" "}
            <strong className="text-ink">Restore TO</strong>. It only runs when you press the button — never on a schedule. The details
            you type are used for this one run and are not saved.
          </p>
        </div>
        <UserMenu disabled={starting} />
      </header>

      <div className="panel flex flex-wrap items-center justify-center gap-3 p-3 text-[13px]">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/40 px-2.5 py-1">
          <UploadIcon size={13} className="text-sky-400" />
          <span className="text-muted">Backup FROM</span>
          <strong>{fromLabel}</strong>
          <span className="text-faint">(read only)</span>
        </span>
        <ArrowRightIcon size={16} className="text-muted" />
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/50 px-2.5 py-1">
          <DownloadIcon size={13} className="text-accent" />
          <span className="text-muted">Restore TO</span>
          <strong>{toLabel}</strong>
          <span className="text-faint">(gets replaced)</span>
        </span>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-2">
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

      <section className="panel border-rose-500/50" aria-label="Confirm and run">
        <div className="border-b border-line p-3">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <StepBadge>4</StepBadge>
            <AlertIcon className="text-rose-400" />
            Confirm and run
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            The copy runs in one transaction: if anything fails, Restore TO is left exactly as it was. If Restore TO is the database an app
            on this computer is using, that app may pause until the copy finishes.
          </p>
        </div>
        <div className="space-y-3 p-3">
          <label className="flex cursor-pointer items-start gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={locked}
              className="mt-0.5 accent-amber-500"
            />
            <span>
              <span>
                Overwrite the destination — delete everything already in <strong>{toLabel}</strong> and replace it with the copy
              </span>
              <span className="block text-xs text-faint">
                Leave unticked when Restore TO is a new, empty database. If it is not empty, the run stops and nothing is changed.
              </span>
            </span>
          </label>
          <Field
            label={`Type the Restore TO database name${destinationName ? ` (${destinationName})` : ""} to confirm`}
            tech="confirm_destination_name"
          >
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={destinationName || "Enter the Restore TO database name first"}
              autoComplete="off"
              spellCheck={false}
              className="field max-w-sm"
              disabled={locked || !destinationName}
            />
          </Field>
          {warning && (
            <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
              <AlertIcon size={12} /> {warning}
            </p>
          )}
          {busyBy && !running && (
            <p className="flex items-center gap-1.5 text-[13px] text-amber-400">
              <AlertIcon size={12} /> A backup &amp; restore started by {busyBy} is running. Wait for it to finish.
            </p>
          )}
          {startError && <p className="text-[13px] text-rose-400">{startError}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={() => setReviewing(true)} disabled={!canStart} className="btn-accent">
              {locked ? <SpinnerIcon /> : <DatabaseIcon />}
              {starting ? "Starting…" : running ? "Backup & Restore running…" : "Backup & Restore"}
            </button>
          </div>
        </div>
      </section>

      {job && running && <JobProgress job={job} now={now} connectionIssue={connectionIssue} />}
      {job && job.status === "FAILED" && <JobFailed job={job} />}
      {job && job.status === "COMPLETED" && job.result?.steps && <JobCompleted job={job} />}

      <HistoryPanel refreshKey={historyKey} />

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
    </div>
  );
}
