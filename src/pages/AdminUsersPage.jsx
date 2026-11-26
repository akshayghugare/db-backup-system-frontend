import { useCallback, useEffect, useState } from "react";

import { approveUser, listUsers, rejectUser } from "../api/admin.js";
import { CheckCircleIcon, ClockIcon, HourglassIcon, RefreshIcon, ShieldIcon, SpinnerIcon, UsersIcon, XCircleIcon } from "../components/Icons.jsx";
import AppLayout, { USERS_CHANGED_EVENT } from "../components/layout/AppLayout.jsx";
import { Alert, AnimatedNumber, Avatar, EmptyState, SkeletonRows, StatusPill } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_LABELS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };
const PILL_STATUS = { PENDING: "WAITING", APPROVED: "APPROVED", REJECTED: "REJECTED" };

const STAT_CARDS = [
  { value: "", label: "All users", icon: <UsersIcon size={18} />, tone: "from-violet-600 to-purple-600", ring: "ring-violet-500/50" },
  { value: "PENDING", label: "Pending review", icon: <HourglassIcon size={18} />, tone: "from-amber-500 to-orange-500", ring: "ring-amber-500/50" },
  { value: "APPROVED", label: "Approved", icon: <CheckCircleIcon size={18} />, tone: "from-emerald-500 to-teal-500", ring: "ring-emerald-500/50" },
  { value: "REJECTED", label: "Rejected", icon: <XCircleIcon size={18} />, tone: "from-rose-500 to-pink-500", ring: "ring-rose-500/50" },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [filter, setFilter] = useState("PENDING");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listUsers(filter);
      setData(next);
      window.dispatchEvent(new CustomEvent(USERS_CHANGED_EVENT, { detail: next.counts ?? {} }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (target, action) => {
    setBusy({ id: target.id, action });
    setNotice(null);
    setError(null);
    try {
      const updated = action === "approve" ? await approveUser(target.id) : await rejectUser(target.id);
      setNotice({ tone: action === "approve" ? "success" : "warning", text: `${updated.email} ${action === "approve" ? "approved" : "rejected"}.` });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const counts = data?.counts ?? {};
  const totalUsers = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const countFor = (value) => (value ? counts[value] ?? 0 : totalUsers);

  return (
    <AppLayout
      title="Users & access"
      subtitle="New accounts cannot use Backup & Restore until an admin approves them. Rejected users can sign in but cannot use it."
      actions={
        <button type="button" className="btn-ghost" onClick={() => void load()} disabled={loading}>
          {loading ? <SpinnerIcon /> : <RefreshIcon />} Refresh
        </button>
      }
    >
      <div className="stagger mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const active = filter === card.value;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setFilter(card.value)}
              aria-pressed={active}
              className={`panel group relative overflow-hidden p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong ${
                active ? `ring-2 ${card.ring}` : ""
              }`}
            >
              <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-linear-to-br ${card.tone} opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-medium text-muted">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">{data ? <AnimatedNumber value={countFor(card.value)} /> : <span className="skeleton inline-block h-8 w-12" />}</p>
                </div>
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg ${card.tone}`}>
                  {card.icon}
                </span>
              </div>
              <p className={`relative mt-3 text-[11px] font-medium ${active ? "text-accent-soft" : "text-faint"}`}>{active ? "Showing in table" : "Click to filter"}</p>
            </button>
          );
        })}
      </div>

      <section className="panel animate-fade-up overflow-hidden">
        <div className="panel-header items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent-soft ring-1 ring-inset ring-accent/30">
              <ShieldIcon size={16} />
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                {filter ? `${STATUS_LABELS[filter]} users` : "All users"}
                {loading && <SpinnerIcon className="text-accent-soft" />}
              </h2>
              <p className="text-[12px] text-muted">Approve or reject access to Backup &amp; Restore</p>
            </div>
          </div>
          <div className="segmented">
            {STAT_CARDS.map((card) => (
              <button key={card.label} type="button" aria-pressed={filter === card.value} onClick={() => setFilter(card.value)}>
                {card.value ? STATUS_LABELS[card.value] : "All"}
                {data && <span className="ml-1.5 opacity-70">{countFor(card.value)}</span>}
              </button>
            ))}
          </div>
        </div>

        {(notice || error) && (
          <div className="space-y-2 border-b border-line px-5 py-3">
            {notice && (
              <Alert key={notice.text} tone={notice.tone}>
                {notice.text}
              </Alert>
            )}
            {error && <Alert tone="error">{error}</Alert>}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[880px] text-[13px]">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last sign-in</th>
                <th>Reviewed</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data && loading && <SkeletonRows rows={4} cols={7} />}
              {data?.users.map((row, index) => {
                const isSelf = row.id === me?.id;
                const isAdminRow = row.role === "admin";
                const rowBusy = busy?.id === row.id;
                return (
                  <tr key={row.id} className="animate-fade-in hover:bg-raised/40" style={{ animationDelay: `${index * 35}ms` }}>
                    <td>
                      <span className="flex items-center gap-3">
                        <Avatar name={row.name} />
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">
                            {row.name}
                            {isSelf && <span className="ml-1.5 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-soft">you</span>}
                          </span>
                          <span className="block text-[11.5px] text-faint">{row.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium capitalize ${
                          isAdminRow ? "bg-accent/15 text-accent-soft" : "bg-raised text-muted"
                        }`}
                      >
                        {isAdminRow && <ShieldIcon size={11} />}
                        {row.role}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={PILL_STATUS[row.approval_status]} label={STATUS_LABELS[row.approval_status]} />
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDate(row.created_at)}</td>
                    <td className="whitespace-nowrap text-muted">
                      {row.last_login_at ? (
                        <span className="inline-flex items-center gap-1.5">
                          <ClockIcon size={11} className="text-faint" />
                          {formatDate(row.last_login_at)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-muted">
                      {row.reviewed_at ? formatDate(row.reviewed_at) : "—"}
                      {row.reviewed_by && <span className="block text-[11px] text-faint">by {row.reviewed_by.email}</span>}
                    </td>
                    <td className="text-right">
                      {isAdminRow ? (
                        <span className="text-xs text-faint">—</span>
                      ) : (
                        <span className="inline-flex gap-2">
                          <button
                            type="button"
                            className="btn-ghost btn-sm border-emerald-500/30 text-emerald-300 enabled:hover:border-emerald-400/60 enabled:hover:bg-emerald-500/15 enabled:hover:text-emerald-200"
                            onClick={() => decide(row, "approve")}
                            disabled={rowBusy || row.approval_status === "APPROVED"}
                          >
                            {rowBusy && busy.action === "approve" ? <SpinnerIcon /> : <CheckCircleIcon />} Approve
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm border-rose-500/30 text-rose-300 enabled:hover:border-rose-400/60 enabled:hover:bg-rose-500/15 enabled:hover:text-rose-200"
                            onClick={() => decide(row, "reject")}
                            disabled={rowBusy || row.approval_status === "REJECTED"}
                          >
                            {rowBusy && busy.action === "reject" ? <SpinnerIcon /> : <XCircleIcon />} Reject
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data && data.users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState icon={<UsersIcon size={20} />} title={`No ${filter ? STATUS_LABELS[filter].toLowerCase() : ""} users`}>
                      {filter === "PENDING" ? "Everyone has been reviewed. New sign-ups will appear here." : "Try another filter above."}
                    </EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}
