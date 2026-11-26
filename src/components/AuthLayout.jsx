import { DownloadIcon, LayersIcon, LockIcon, ShieldIcon, UploadIcon, ZapIcon } from "./Icons.jsx";
import { Alert, BrandMark } from "./ui.jsx";
import DesktopDownloadButton from "./DesktopDownload.jsx";

const FEATURES = [
  { icon: <LayersIcon size={16} />, title: "Complete copies", text: "Schemas, tables, keys, indexes, sequences and every row." },
  { icon: <ZapIcon size={16} />, title: "Selective restore", text: "Copy only the tables you need — relationships stay valid." },
  { icon: <ShieldIcon size={16} />, title: "Local-only safety", text: "Restores only go to localhost, in a single transaction." },
];

function FlowIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-sm items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-400/30">
          <UploadIcon size={20} />
        </span>
        <span className="text-[11px] font-medium text-muted">Source</span>
      </div>
      <svg className="mx-2 h-6 flex-1" viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="auth-flow" x1="0" x2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
        <path d="M0 12 H120" stroke="#ffffff14" strokeWidth="2" />
        <path d="M0 12 H120" stroke="url(#auth-flow)" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" className="animate-flow" />
      </svg>
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-400/30">
          <DownloadIcon size={20} />
        </span>
        <span className="text-[11px] font-medium text-muted">Local copy</span>
      </div>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] animate-float rounded-full bg-fuchsia-600/20 blur-3xl [animation-delay:-3s]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="relative flex animate-fade-up items-center gap-3">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-[15px] font-bold">DB Backup &amp; Restore</p>
            <p className="text-[12px] text-faint">Local development tool</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="animate-fade-up [animation-delay:80ms]">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Copy any PostgreSQL database
              <br />
              <span className="gradient-text">to your machine, safely.</span>
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
              One click to mirror staging into your local database — with live progress for every step.
            </p>
          </div>
          <div className="animate-fade-up [animation-delay:160ms]">
            <FlowIllustration />
          </div>
          <ul className="stagger max-w-md space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-soft ring-1 ring-inset ring-accent/30">
                  {feature.icon}
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold">{feature.title}</span>
                  <span className="block text-[12.5px] text-faint">{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-1.5 text-[12px] text-faint">
          <LockIcon size={12} /> Credentials you type are used for one run and never stored.
        </p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <BrandMark size="lg" />
            <h1 className="mt-3 text-lg font-bold">DB Backup &amp; Restore</h1>
            <p className="text-[12px] text-faint">Local development tool</p>
          </div>
          <section className="panel animate-scale-in overflow-hidden">
            <div className="h-1 bg-linear-to-r from-violet-600 via-fuchsia-500 to-purple-500" />
            <div className="px-7 pb-2 pt-7">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
            </div>
            <div className="px-7 pb-7 pt-5">{children}</div>
          </section>
          {footer && <p className="mt-6 animate-fade-in text-center text-[13px] text-muted">{footer}</p>}
          <p className="mt-3 flex animate-fade-in items-center justify-center gap-1.5 text-[12.5px] text-faint">
            Restoring into a local database? <DesktopDownloadButton variant="link" label="Get the desktop app" />
          </p>
        </div>
      </main>
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <Alert key={message} tone="error" animation="animate-shake">
      {message}
    </Alert>
  );
}
