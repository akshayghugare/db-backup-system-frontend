import { useEffect, useState } from "react";

import { testConnection } from "../../api/backup.js";
import { isRestoreHostAllowed, parseConnectionUrl, toPayload, validateCredentials } from "../../utils/format.js";
import { AlertIcon, CheckCircleIcon, CheckIcon, DownloadIcon, LinkIcon, PlugIcon, ServerIcon, SpinnerIcon, UploadIcon, XCircleIcon } from "../Icons.jsx";
import DesktopDownloadButton from "../DesktopDownload.jsx";
import { Field, PasswordInput, SectionHeader, Toggle } from "../ui.jsx";

const SIDE_TEXT = {
  from: {
    step: "1",
    label: "Backup FROM",
    title: "Backup FROM",
    kicker: "Source database",
    subtitle: "The database you want to copy. It is only READ — nothing in it is changed or deleted.",
    hostExample: "e.g. staging-db.example.com",
    nameExample: "e.g. rlkdbmain",
    bar: "from-sky-500 via-cyan-400 to-sky-500",
    chip: "bg-sky-500/10 text-sky-300 ring-sky-400/30",
    icon: <UploadIcon size={12} />,
  },
  to: {
    step: "2",
    label: "Restore TO",
    title: "Restore TO",
    kicker: "Destination · local database",
    subtitle:
      "The database that receives the copy. Everything already in it is REPLACED. It must already exist and can be completely empty.",
    hostExample: "e.g. localhost",
    nameExample: "e.g. rlkdb",
    bar: "from-fuchsia-500 via-violet-500 to-fuchsia-500",
    chip: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-400/30",
    icon: <DownloadIcon size={12} />,
  },
  // Restore TO a deployed server (staging, production…).
  toRemote: {
    step: "2",
    label: "Restore TO",
    title: "Restore TO",
    kicker: "Destination · deployed database",
    subtitle:
      "A database on a server (staging, production…). Everything already in it is REPLACED — apps using it see the new data immediately. It must already exist.",
    hostExample: "e.g. staging-db.example.com",
    nameExample: "e.g. rlkdb_staging",
    bar: "from-rose-500 via-orange-400 to-rose-500",
    chip: "bg-rose-500/10 text-rose-300 ring-rose-400/30",
    icon: <DownloadIcon size={12} />,
  },
};

const TARGETS = [
  { value: "local", title: "Local database", text: "A database on this computer (localhost). Safe for development.", icon: <DownloadIcon size={16} /> },
  { value: "remote", title: "Deployed database", text: "Staging, production or any other server. Replaces its data.", icon: <ServerIcon size={16} /> },
];

/** "Local database" / "Deployed database" choice for Restore TO. */
function TargetSelector({ target, onChange, disabled, localUnavailableMessage }) {
  return (
    <div className="@container space-y-2">
      <p className="text-[12.5px] font-medium text-muted">Restore into</p>
      <div className="grid gap-2 @lg:grid-cols-2" role="radiogroup" aria-label="Restore into">
        {TARGETS.map((option) => {
          const active = target === option.value;
          const remote = option.value === "remote";
          const box = active
            ? remote
              ? "border-rose-500/55 bg-rose-500/[0.08] shadow-[0_0_0_4px_rgb(244_63_94/0.08)]"
              : "border-violet-500/55 bg-violet-500/[0.10] shadow-[0_0_0_4px_rgb(139_92_246/0.08)]"
            : "border-line bg-field/40 hover:border-line-strong";
          const tile = active
            ? remote
              ? "bg-rose-500/20 text-rose-200"
              : "bg-linear-to-br from-violet-600 to-fuchsia-600 text-white"
            : "bg-raised text-faint";
          const dot = active ? (remote ? "border-transparent bg-rose-500 text-white" : "border-transparent bg-accent text-white") : "border-line-strong";
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={"group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 " + box}
            >
              <span className={"inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " + tile}>{option.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">{option.title}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-faint">{option.text}</span>
              </span>
              <span className={"mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border " + dot}>
                {active && <CheckIcon size={10} />}
              </span>
            </button>
          );
        })}
      </div>
      {target === "local" && localUnavailableMessage && (
        <div className="animate-fade-in rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-amber-200">
          {localUnavailableMessage}
          <div className="mt-2">
            <DesktopDownloadButton variant="link" label="Get the desktop app" />
          </div>
        </div>
      )}
      {target === "remote" && (
        <p className="flex animate-fade-in items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-rose-200">
          <AlertIcon className="mt-0.5 shrink-0 text-rose-400" />
          Restoring into a deployed database replaces its data for everyone using it. Double-check the host and database name — you
          will be asked to confirm before it runs.
        </p>
      )}
    </div>
  );
}

export default function CredentialsPanel({
  side,
  form,
  onChange,
  disabled,
  hostWarning,
  restoreNotLocalMessage,
  target = "local",
  onTargetChange,
  localUnavailableMessage,
}) {
  const remote = side === "to" && target === "remote";
  const text = remote ? SIDE_TEXT.toRemote : SIDE_TEXT[side];
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(null);
  const [status, setStatus] = useState(null);

  // A previous test result does not apply to the other kind of target.
  useEffect(() => setStatus(null), [target]);

  const update = (patch) => {
    setStatus(null);
    onChange({ ...form, ...patch });
  };
  const set = (key) => (event) => update({ [key]: event.target.value });

  const fillFromUrl = () => {
    const parsed = parseConnectionUrl(url);
    if (!parsed) {
      setUrlError("Not a valid postgres:// or postgresql:// connection URL");
      return;
    }
    setUrlError(null);
    setUrl("");
    update(parsed);
  };

  const runTest = async () => {
    const problem = validateCredentials(form, text.label);
    if (problem) {
      setStatus({ kind: "fail", text: problem });
      return;
    }
    if (side === "to" && target === "local" && !isRestoreHostAllowed(form.DB_HOST)) {
      setStatus({ kind: "fail", text: restoreNotLocalMessage });
      return;
    }
    if (remote && isRestoreHostAllowed(form.DB_HOST)) {
      setStatus({ kind: "fail", text: "This host is this computer. Choose \"Local database\" for it." });
      return;
    }
    setStatus({ kind: "busy", text: "Connecting…" });
    try {
      const data = await testConnection(side, toPayload(form), target);
      const contents =
        side === "to"
          ? data.empty
            ? "the database is empty"
            : `contains ${data.tables} tables (${data.objects} objects) — tick Overwrite to replace them`
          : `${data.tables} tables`;
      setStatus({ kind: "ok", text: `Connected to "${data.database}" (PostgreSQL ${data.server_version}) — ${contents}` });
    } catch (error) {
      setStatus({ kind: "fail", text: error.message });
    }
  };

  const complete =
    !validateCredentials(form, text.label) && (side === "from" || (remote ? !isRestoreHostAllowed(form.DB_HOST) : isRestoreHostAllowed(form.DB_HOST)));

  const statusStyle =
    status?.kind === "ok"
      ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200"
      : status?.kind === "fail"
        ? "border-rose-500/30 bg-rose-500/[0.07] text-rose-200"
        : status?.kind === "busy"
          ? "border-violet-500/30 bg-violet-500/[0.08] text-violet-200"
          : "border-line bg-field/50 text-faint";

  return (
    <section className="panel flex h-full animate-fade-up flex-col overflow-hidden" aria-label={`${text.title} — ${text.kicker}`}>
      <div className={`h-1 bg-linear-to-r ${text.bar}`} />
      <SectionHeader
        step={text.step}
        done={complete}
        title={
          <>
            {text.title}
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${text.chip}`}>
              {text.icon}
              {side === "from" ? "read only" : "gets replaced"}
            </span>
          </>
        }
        subtitle={
          <>
            <span className="font-medium text-ink/80">{text.kicker}.</span> {text.subtitle}
          </>
        }
      />
      <div className="flex-1 space-y-4 p-5">
        {side === "to" && onTargetChange && (
          <TargetSelector target={target} onChange={onTargetChange} disabled={disabled} localUnavailableMessage={localUnavailableMessage} />
        )}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <span className="relative block flex-1">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && url.trim() && fillFromUrl()}
                placeholder="Paste postgresql://user:pass@host:5432/db"
                aria-label={`${text.label} connection URL`}
                autoComplete="off"
                spellCheck={false}
                className="field pl-9"
                disabled={disabled}
              />
            </span>
            <button type="button" onClick={fillFromUrl} disabled={disabled || !url.trim()} className="btn-ghost">
              Fill
            </button>
          </div>
          {urlError ? (
            <span className="block animate-fade-in text-xs text-rose-400">{urlError}</span>
          ) : (
            <span className="block text-[11.5px] text-faint">Optional — the URL is parsed in your browser only.</span>
          )}
        </div>

        <div className="relative flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">
          <span className="h-px flex-1 bg-line" /> or enter details <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Host" tech="DB_HOST">
              <input
                type="text"
                value={form.DB_HOST}
                onChange={set("DB_HOST")}
                placeholder={text.hostExample}
                autoComplete="off"
                spellCheck={false}
                className="field"
                disabled={disabled}
              />
            </Field>
          </div>
          <Field label="Port" tech="DB_PORT">
            <input
              type="number"
              min={1}
              max={65535}
              value={form.DB_PORT}
              onChange={set("DB_PORT")}
              placeholder="5432"
              className="field"
              disabled={disabled}
            />
          </Field>
        </div>

        {hostWarning && (
          <p role="alert" className="flex animate-shake items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-500/[0.07] p-3 text-[12.5px] text-rose-200">
            <AlertIcon className="mt-0.5 text-rose-400" /> {hostWarning}
          </p>
        )}

        <Field label="Database name" tech="DB_NAME">
          <input
            type="text"
            value={form.DB_NAME}
            onChange={set("DB_NAME")}
            placeholder={text.nameExample}
            autoComplete="off"
            spellCheck={false}
            className="field"
            disabled={disabled}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="User name" tech="DB_USER">
            <input
              type="text"
              value={form.DB_USER}
              onChange={set("DB_USER")}
              placeholder="e.g. postgres"
              autoComplete="off"
              spellCheck={false}
              className="field"
              disabled={disabled}
            />
          </Field>
          <Field label="Password" tech="DB_PASSWORD">
            <PasswordInput value={form.DB_PASSWORD} onChange={set("DB_PASSWORD")} placeholder="Empty if none" disabled={disabled} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-field/50 px-3.5 py-3">
          <span>
            <span className="block text-[13px] font-medium">
              Use SSL <code className="tech ml-1">DB_SSL</code>
            </span>
            <span className="block text-[11.5px] text-faint">On for managed / cloud databases (sslmode=require). Off for local.</span>
          </span>
          <Toggle checked={form.DB_SSL} onChange={(next) => update({ DB_SSL: next })} disabled={disabled} label={`${text.label}: use SSL`} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line bg-raised/30 px-5 py-3.5">
        <button type="button" onClick={runTest} disabled={disabled || status?.kind === "busy"} className="btn-ghost btn-sm">
          {status?.kind === "busy" ? <SpinnerIcon /> : <PlugIcon />} Test connection
        </button>
        <span
          key={status ? `${status.kind}:${status.text}` : "idle"}
          className={`inline-flex min-w-0 flex-1 animate-fade-in items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${statusStyle}`}
        >
          <span className="mt-px">
            {status?.kind === "ok" && <CheckCircleIcon className="text-emerald-400" />}
            {status?.kind === "fail" && <XCircleIcon className="text-rose-400" />}
            {status?.kind === "busy" && <SpinnerIcon className="text-violet-300" />}
            {!status && <span className="inline-block h-2 w-2 rounded-full bg-faint/60" />}
          </span>
          <span className="break-words">{status ? status.text : "Not checked yet"}</span>
        </span>
      </div>
    </section>
  );
}
