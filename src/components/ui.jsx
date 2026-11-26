import { useEffect, useRef, useState } from "react";

import { AlertIcon, CheckCircleIcon, DatabaseIcon, EyeIcon, EyeOffIcon, XCircleIcon } from "./Icons.jsx";

export function Field({ label, tech, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-medium text-muted">{label}</span>
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
        className="field pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-faint transition-colors hover:bg-accent/15 hover:text-accent-soft"
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
      className="inline-flex items-center gap-2 text-[12px] font-medium text-muted disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`relative h-[22px] w-[40px] rounded-full transition-all duration-300 ${
          checked ? "bg-linear-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_14px_-2px_rgb(168_85_247/0.7)]" : "bg-[#2e2647]"
        }`}
      >
        <span
          className={`absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            checked ? "translate-x-[18px]" : ""
          }`}
        />
      </span>
      <span className="min-w-[24px] text-left">{checked ? "On" : "Off"}</span>
    </button>
  );
}

export function StepBadge({ children, done = false }) {
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold transition-all duration-300 ${
        done
          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40"
          : "bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-950/60"
      }`}
    >
      {done ? <CheckSmall /> : children}
    </span>
  );
}

function CheckSmall() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5L20 7" strokeDasharray="24" className="animate-check" />
    </svg>
  );
}

const STATUS_STYLES = {
  PENDING: { box: "bg-sky-500/10 text-sky-300 ring-sky-400/30", dot: "bg-sky-400", live: true },
  IN_PROGRESS: { box: "bg-violet-500/15 text-violet-200 ring-violet-400/40", dot: "bg-violet-400", live: true },
  COMPLETED: { box: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30", dot: "bg-emerald-400" },
  FAILED: { box: "bg-rose-500/10 text-rose-300 ring-rose-400/30", dot: "bg-rose-400" },
  APPROVED: { box: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30", dot: "bg-emerald-400" },
  REJECTED: { box: "bg-rose-500/10 text-rose-300 ring-rose-400/30", dot: "bg-rose-400" },
  WAITING: { box: "bg-amber-500/10 text-amber-300 ring-amber-400/30", dot: "bg-amber-400", live: true },
};

export function StatusPill({ status, label }) {
  const style = STATUS_STYLES[status] ?? { box: "bg-raised text-muted ring-line", dot: "bg-faint" };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style.box}`}>
      <span className="relative inline-flex h-1.5 w-1.5">
        {style.live && <span className={`absolute inset-0 rounded-full ${style.dot} animate-ping-slow`} />}
        <span className={`relative h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {label}
    </span>
  );
}

export function BrandMark({ size = "md" }) {
  const box = size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";
  const icon = size === "lg" ? 26 : size === "sm" ? 16 : 19;
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center bg-linear-to-br from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/50 ring-1 ring-inset ring-white/20 ${box}`}
    >
      <DatabaseIcon size={icon} />
    </span>
  );
}

/** Full-screen branded loader used while the session is checked. */
export function BrandLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5" role="status" aria-live="polite">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-violet-500/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-400 border-r-fuchsia-400" />
        <span className="absolute inset-3 animate-spin-slow rounded-full border-2 border-transparent border-b-purple-400/70 [animation-direction:reverse]" />
        <span className="animate-glow-pulse rounded-2xl">
          <BrandMark />
        </span>
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        <LoadingDots className="mt-2" />
      </div>
    </div>
  );
}

export function LoadingDots({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-soft" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}

/** Animated linear progress bar with moving stripes and a shimmer sweep. */
export function ProgressBar({ percent, size = "md", tone = "accent", animated = true, indeterminate = false }) {
  if (indeterminate) {
    const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3.5" : "h-2.5";
    return (
      <div className={`relative w-full overflow-hidden rounded-full bg-[#221b3b] ring-1 ring-inset ring-white/5 ${h}`} role="progressbar" aria-busy="true">
        <div className="absolute inset-y-0 left-0 w-1/3 animate-indeterminate rounded-full bg-linear-to-r from-violet-600 via-fuchsia-500 to-violet-600 shadow-[0_0_14px_rgb(168_85_247/0.6)]" />
      </div>
    );
  }
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3.5" : "h-2.5";
  const fill =
    tone === "success"
      ? "from-emerald-500 to-teal-400"
      : tone === "danger"
        ? "from-rose-600 to-pink-500"
        : "from-violet-600 via-purple-500 to-fuchsia-500";
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-[#221b3b] ring-1 ring-inset ring-white/5 ${height}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div
        className={`relative h-full overflow-hidden rounded-full bg-linear-to-r ${fill} shadow-[0_0_16px_rgb(168_85_247/0.55)] transition-[width] duration-700 ease-out`}
        style={{ width: `${value}%` }}
      >
        {animated && (
          <>
            <span
              className="absolute inset-0 animate-stripes opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, rgba(255,255,255,.55) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.55) 50%, rgba(255,255,255,.55) 75%, transparent 75%, transparent)",
                backgroundSize: "28px 28px",
              }}
            />
            <span className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/40 to-transparent" />
          </>
        )}
      </div>
    </div>
  );
}

/** Circular progress ring with the percentage in the middle. */
export function ProgressRing({ percent, size = 96, stroke = 8, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#241d3f" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset 0.7s ease-out", filter: "drop-shadow(0 0 6px rgb(168 85 247 / 0.6))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Counts up from the previous value to the new one. */
export function AnimatedNumber({ value, duration = 900, format = (n) => Math.round(n).toLocaleString("en-US") }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const from = fromRef.current;
    if (from === target) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      fromRef.current = target;
    };
  }, [value, duration]);
  return <span className="tabular-nums">{format(display)}</span>;
}

const ALERT_TONES = {
  error: { box: "border-rose-500/35 bg-rose-500/[0.07] text-rose-200", icon: <XCircleIcon size={16} className="text-rose-400" /> },
  warning: { box: "border-amber-500/35 bg-amber-500/[0.07] text-amber-200", icon: <AlertIcon size={16} className="text-amber-400" /> },
  success: { box: "border-emerald-500/35 bg-emerald-500/[0.07] text-emerald-200", icon: <CheckCircleIcon size={16} className="text-emerald-400" /> },
  info: { box: "border-violet-500/35 bg-violet-500/[0.08] text-violet-100", icon: <AlertIcon size={16} className="text-violet-300" /> },
};

export function Alert({ tone = "info", children, className = "", role, animation = "animate-fade-up" }) {
  const style = ALERT_TONES[tone];
  return (
    <div role={role ?? (tone === "error" ? "alert" : undefined)} className={`flex ${animation} items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] ${style.box} ${className}`}>
      <span className="mt-px">{style.icon}</span>
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-purple-500 to-indigo-500",
  "from-fuchsia-500 to-pink-500",
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-violet-500",
];

export function Avatar({ name = "", size = "md" }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const box = size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-bold text-white ring-2 ring-white/10 ${AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]} ${box}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function EmptyState({ icon, title, children }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-soft ring-1 ring-inset ring-accent/25">
        {icon}
      </span>
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-[13px] text-faint">{children}</p>}
    </div>
  );
}

export function SkeletonRows({ rows = 4, cols = 5 }) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row} className="border-t border-line">
      {Array.from({ length: cols }, (_, col) => (
        <td key={col} className="px-4 py-3.5">
          <div className="skeleton h-3.5" style={{ width: `${55 + ((row * 7 + col * 13) % 40)}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export function SectionHeader({ step, done, icon, title, subtitle, right }) {
  return (
    <div className="panel-header">
      <div className="flex min-w-0 items-start gap-3">
        {step ? <StepBadge done={done}>{step}</StepBadge> : icon}
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
