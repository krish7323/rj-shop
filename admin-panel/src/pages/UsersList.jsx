// src/pages/UsersList.jsx
// Customer Insights: the shop owner's directory of top customers ranked by
// realized lifetime spend (GET /api/admin/metrics/top-customers), with profile,
// email, order count and total expenditure.

import { useEffect, useMemo, useState } from "react";
import { Users, Crown, Mail, Search, RefreshCw, Trophy, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminAPI } from "../lib/api";
import { inr, dateShort } from "../lib/format";
import { Loading, Empty } from "../components/ui";

const DEMO_CUSTOMERS = [
  { userId: "u1", name: "Ananya Sharma", email: "ananya@example.com", totalSpent: 18420, orderCount: 12, lastOrderAt: "2026-06-28", isVerified: true, pendingCount: 2, phone: "9876543210", currentDevice: "iPhone 13 Pro" },
  { userId: "u2", name: "Rohit Verma", email: "rohit.v@example.com", totalSpent: 14260, orderCount: 9, lastOrderAt: "2026-07-02", isVerified: true, pendingCount: 1, phone: "9812345678", currentDevice: "OnePlus 9 5G" },
  { userId: "u3", name: "Priya Nair", email: "priya.nair@example.com", totalSpent: 11890, orderCount: 8, lastOrderAt: "2026-06-19", isVerified: false, pendingCount: 4, phone: "9765432109", currentDevice: "Nokia 3310" },
  { userId: "u4", name: "Karan Mehta", email: "karan.m@example.com", totalSpent: 9650, orderCount: 6, lastOrderAt: "2026-07-05", isVerified: true, pendingCount: 0, phone: "9988776655", currentDevice: "Samsung S22 Ultra" },
  { userId: "u5", name: "Sneha Iyer", email: "sneha.iyer@example.com", totalSpent: 7240, orderCount: 5, lastOrderAt: "2026-06-30", isVerified: false, pendingCount: 1, phone: "9654321098", currentDevice: "iPhone 11" },
];

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const RANK_TINT = [
  "bg-amber-100 text-amber-700",
  "bg-slate-200 text-slate-600",
  "bg-orange-100 text-orange-700",
];

export default function UsersList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await AdminAPI.topCustomers(25);
      setRows(res.data.topCustomers || []);
      setLive(true);
    } catch {
      setRows(DEMO_CUSTOMERS);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) => r.name?.toLowerCase().includes(term) || r.email?.toLowerCase().includes(term)
    );
  }, [q, rows]);

  const totalRevenue = rows.reduce((s, r) => s + (r.totalSpent || 0), 0);
  const totalOrders = rows.reduce((s, r) => s + (r.orderCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header stat strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Top Customers</p>
            <p className="text-xl font-extrabold text-slate-900">{rows.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tracked Revenue</p>
            <p className="text-xl font-extrabold text-slate-900">{inr(totalRevenue)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Orders</p>
            <p className="text-xl font-extrabold text-slate-900">{totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Directory table */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Customer Directory</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name / email…"
                className="input w-56 pl-9"
              />
            </div>
            <button onClick={load} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <Loading label="Loading customer insights…" />
        ) : filtered.length === 0 ? (
          <Empty label="No customers match your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Last Order</th>
                  <th className="px-5 py-3 text-right font-semibold">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c, i) => (
                  <tr key={c.userId || c.email} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${
                          RANK_TINT[i] || "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                          {initials(c.name)}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{c.name || "Unknown"}</span>
                            {c.isVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 uppercase tracking-wide" title="Verified Account">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 uppercase tracking-wide" title="Pending Verification">
                                <AlertCircle className="h-2.5 w-2.5" /> Pending
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                            <span className="text-[11px] font-medium text-slate-400">
                              Orders: <strong className="text-slate-650">{c.orderCount || 0}</strong> | Pending: <strong className="text-brand-600">{c.pendingCount || 0}</strong>
                            </span>
                            {c.currentDevice && (
                              <span className="inline-flex items-center text-[9px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-1 rounded uppercase tracking-wide">
                                📱 {c.currentDevice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <span className="text-emerald-500 text-[10px]">💬</span> +91 {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-brand-50 text-brand-600">{c.orderCount} orders</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{dateShort(c.lastOrderAt)}</td>
                    <td className="px-5 py-3.5 text-right text-base font-extrabold text-slate-900">
                      {inr(c.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!live && !loading && (
          <div className="border-t border-slate-100 px-5 py-2.5 text-xs font-medium text-slate-400">
            Demo insights — connect the backend to load real customer metrics.
          </div>
        )}
      </div>
    </div>
  );
}
