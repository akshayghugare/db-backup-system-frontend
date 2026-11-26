import { useState } from "react";

import { testConnection } from "../../api/backup.js";
import { isRestoreHostAllowed, parseConnectionUrl, toPayload, validateCredentials } from "../../utils/format.js";
import { AlertIcon, CheckCircleIcon, DownloadIcon, PlugIcon, SpinnerIcon, UploadIcon, XCircleIcon } from "../Icons.jsx";
import { Field, PasswordInput, StepBadge, Toggle } from "../ui.jsx";

const SIDE_TEXT = {
  from: {
    step: "1",
    label: "Backup FROM",
    title: "Backup FROM — source database",
    subtitle: "The database you want to copy. It is only READ — nothing in it is changed or deleted.",
    hostExample: "e.g. staging-db.example.com",
    nameExample: "e.g. rlkdbmain",
    tone: "border-sky-500/45",
    icon: <UploadIcon className="text-sky-400" />,
  },
  to: {
    step: "2",
    label: "Restore TO",
    title: "Restore TO — destination database",
    subtitle:
      "The database that receives the copy. Everything already in it is REPLACED. It must already exist and can be completely empty. Only the local development database (localhost) is allowed.",
    hostExample: "e.g. localhost",
    nameExample: "e.g. rlkdb",
    tone: "border-amber-500/50",
    icon: <DownloadIcon className="text-accent" />,
  },
};

export default function CredentialsPanel({ side, form, onChange, disabled, hostWarning, restoreNotLocalMessage }) {
  const text = SIDE_TEXT[side];
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(null);
  const [status, setStatus] = useState(null);

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
    if (side === "to" && !isRestoreHostAllowed(form.DB_HOST)) {
      setStatus({ kind: "fail", text: restoreNotLocalMessage });
      return;
    }
    setStatus({ kind: "busy", text: "Connecting…" });
    try {
      const data = await testConnection(side, toPayload(form));
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

  const statusTone =
    status?.kind === "ok" ? "text-emerald-400" : status?.kind === "fail" ? "text-rose-400" : status?.kind === "busy" ? "text-accent" : "text-faint";

  return (
    <section className={`panel ${text.tone}`} aria-label={text.title}>
      <div className="border-b border-line p-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <StepBadge>{text.step}</StepBadge>
          {text.icon}
          {text.title}
        </h2>
        <p className="mt-1 text-[13px] text-muted">{text.subtitle}</p>
      </div>
      <div className="space-y-3 p-3">
        <div className="space-y-1">
          <span className="block text-xs text-faint">
            Optional: paste a connection URL to fill the fields below. It is read in your browser only.
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="postgresql://user:password@host:5432/database?sslmode=require"
              aria-label={`${text.label} connection URL`}
              autoComplete="off"
              spellCheck={false}
              className="field"
              disabled={disabled}
            />
            <button type="button" onClick={fillFromUrl} disabled={disabled || !url.trim()} className="btn-ghost">
              Fill fields
            </button>
          </div>
          {urlError && <span className="block text-xs text-rose-400">{urlError}</span>}
        </div>

        <div className="grid grid-cols-3 gap-2">
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
          <p role="alert" className="flex items-start gap-1.5 rounded-md border border-rose-500/40 p-2 text-[13px] text-rose-400">
            <AlertIcon className="mt-0.5" /> {hostWarning}
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

        <div className="grid grid-cols-2 gap-2">
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
            <PasswordInput value={form.DB_PASSWORD} onChange={set("DB_PASSWORD")} placeholder="Leave empty if none" disabled={disabled} />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-[13px]">
              Use SSL <code className="tech ml-1">DB_SSL</code>
            </span>
            <span className="block text-xs text-faint">On for managed / cloud databases (sslmode=require). Off for a local database.</span>
          </span>
          <Toggle checked={form.DB_SSL} onChange={(next) => update({ DB_SSL: next })} disabled={disabled} label={`${text.label}: use SSL`} />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-line pt-2.5">
          <button type="button" onClick={runTest} disabled={disabled || status?.kind === "busy"} className="btn-ghost h-[30px] px-2.5">
            <PlugIcon /> Test connection
          </button>
          <span className={`inline-flex items-center gap-1.5 text-xs ${statusTone}`}>
            {status?.kind === "ok" && <CheckCircleIcon />}
            {status?.kind === "fail" && <XCircleIcon />}
            {status?.kind === "busy" && <SpinnerIcon />}
            {status ? status.text : "Not checked yet"}
          </span>
        </div>
      </div>
    </section>
  );
}
