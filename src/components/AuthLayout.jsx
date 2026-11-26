import { DatabaseIcon } from "./Icons.jsx";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px] space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10">
            <DatabaseIcon size={20} className="text-accent" />
          </div>
          <h1 className="text-lg font-semibold">Database Backup &amp; Restore</h1>
          <p className="mt-1 text-[13px] text-muted">Local development tool</p>
        </div>
        <section className="panel border-t-2 border-t-amber-500/60">
          <div className="border-b border-line p-4">
            <h2 className="text-[15px] font-semibold">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <div className="p-4">{children}</div>
        </section>
        {footer && <p className="text-center text-[13px] text-muted">{footer}</p>}
      </div>
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-[13px] text-rose-400">
      {message}
    </p>
  );
}
