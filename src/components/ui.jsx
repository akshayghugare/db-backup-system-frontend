import { useState } from "react";

import { EyeIcon, EyeOffIcon } from "./Icons.jsx";

export function Field({ label, tech, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-ink">{label}</span>
        {tech && <code className="tech">{tech}</code>}
      </span>
      {children}
      {hint && <span className="block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function PasswordInput({ value, onChange, placeholder, disabled, autoComplete = "new-password", id }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="field pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-raised text-muted hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  );
}

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-[13px] text-muted disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={`relative h-[18px] w-[34px] rounded-full transition-colors ${checked ? "bg-accent" : "bg-[#3a3f4b]"}`}>
        <span
          className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-[#f1f2f5] transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
      <span className="min-w-[30px] text-left">{String(checked)}</span>
    </button>
  );
}

export function StepBadge({ children }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-[11px] font-semibold">
      {children}
    </span>
  );
}

const STATUS_STYLES = {
  PENDING: "border-sky-500/40 text-sky-400",
  IN_PROGRESS: "border-amber-500/50 text-amber-400",
  COMPLETED: "border-emerald-500/40 text-emerald-400",
  FAILED: "border-rose-500/50 text-rose-400",
};

export function StatusPill({ status, label }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status] ?? "border-line text-muted"}`}>
      {label}
    </span>
  );
}
