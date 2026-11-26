import { useCallback, useEffect, useState } from "react";

import { approveUser, listUsers, rejectUser } from "../api/admin.js";
import { CheckCircleIcon, SpinnerIcon, UsersIcon, XCircleIcon } from "../components/Icons.jsx";
import UserMenu from "../components/UserMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_STYLES = {
  PENDING: "border-amber-500/50 text-amber-400",
  APPROVED: "border-emerald-500/40 text-emerald-400",
  REJECTED: "border-rose-500/50 text-rose-400",
};
const STATUS_LABELS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };
const FILTERS = [
  ["", "All"],
  ["PENDING", "Pending"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Rejected"],
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "—");

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [filter, setFilter] = useState("PENDING");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listUsers(filter));
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
    setBusyId(target.id);
    setNotice(null);
    setError(null);
    try {
      const updated = action === "approve" ? await approveUser(target.id) : await rejectUser(target.id);
      setNotice(`${updated.email} ${action === "approve" ? "approved" : "rejected"}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const counts = data?.counts ?? {};

  return (
    <div className="mx-auto max-w-[1200px] space-y-3 p-3 lg:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <UsersIcon size={18} className="text-accent" />
            Users — approve access
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">
            New accounts cannot use Backup &amp; Restore until an admin approves them. Rejected users can sign in but cannot use it.
          </p>
        </div>
        <UserMenu />
      </header>

      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
          <div className="inline-flex overflow-hidden rounded-md border border-line-strong text-xs">
            {FILTERS.map(([value, label]) => (
              <button
                key={value || "all"}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 ${filter === value ? "bg-raised text-ink" : "text-muted hover:text-ink"}`}
              >
                {label}
                {value && counts[value] !== undefined && <span className="ml-1 text-faint">({counts[value]})</span>}
              </button>
            ))}
          </div>
          {loading && <SpinnerIcon className="text-accent" />}
        </div>

        {notice && <p className="border-b border-line px-3 py-2 text-[13px] text-emerald-400">{notice}</p>}
        {error && <p className="border-b border-line px-3 py-2 text-[13px] text-rose-400">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead className="bg-raised text-left text-xs text-faint">
              <tr>
                <th className="p-2 font-medium">User</th>
                <th className="p-2 font-medium">Role</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Registered</th>
                <th className="p-2 font-medium">Last sign-in</th>
                <th className="p-2 font-medium">Reviewed</th>
                <th className="p-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((row) => {
                const isSelf = row.id === me?.id;
                const isAdminRow = row.role === "admin";
                const busy = busyId === row.id;
                return (
                  <tr key={row.id} className="border-t border-line">
                    <td className="p-2">
                      {row.name}
                      {isSelf && <span className="ml-1 text-xs text-faint">(you)</span>}
                      <span className="block text-[11px] text-faint">{row.email}</span>
                    </td>
                    <td className="p-2 capitalize text-muted">{row.role}</td>
                    <td className="p-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[row.approval_status]}`}>
                        {STATUS_LABELS[row.approval_status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-2 text-muted">{formatDate(row.created_at)}</td>
                    <td className="whitespace-nowrap p-2 text-muted">{formatDate(row.last_login_at)}</td>
                    <td className="p-2 text-muted">
                      {row.reviewed_at ? formatDate(row.reviewed_at) : "—"}
                      {row.reviewed_by && <span className="block text-[11px] text-faint">by {row.reviewed_by.email}</span>}
                    </td>
                    <td className="p-2 text-right">
                      {isAdminRow ? (
                        <span className="text-xs text-faint">Admin</span>
                      ) : (
                        <span className="inline-flex gap-2">
                          <button
                            type="button"
                            className="btn-ghost h-7 px-2 text-emerald-400"
                            onClick={() => decide(row, "approve")}
                            disabled={busy || row.approval_status === "APPROVED"}
                          >
                            {busy ? <SpinnerIcon /> : <CheckCircleIcon />} Approve
                          </button>
                          <button
                            type="button"
                            className="btn-ghost h-7 px-2 text-rose-400"
                            onClick={() => decide(row, "reject")}
                            disabled={busy || row.approval_status === "REJECTED"}
                          >
                            {busy ? <SpinnerIcon /> : <XCircleIcon />} Reject
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data && data.users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-faint">
                    No {filter ? STATUS_LABELS[filter].toLowerCase() : ""} users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
