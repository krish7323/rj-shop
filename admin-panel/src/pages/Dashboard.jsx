// src/pages/Dashboard.jsx
// High-converting analytics overview: revenue, active customers, orders, and a
// live low-stock alert list. Pulls from the backend admin metrics routes and
// falls back to representative demo data if the API is unreachable.

import { useEffect, useState } from "react";
import {
  IndianRupee,
  Users,
  ShoppingBag,
  PackageX,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  CreditCard,
} from "lucide-react";
import { AdminAPI } from "../lib/api";
import { inr } from "../lib/format";
import { Loading, StatusPill } from "../components/ui";

// Representative fallback so the dashboard always renders beautifully.
const DEMO = {
  revenue: { totalRevenue: 184250, netProductRevenue: 162300 },
  spending: { activePayingCustomers: 128, totalOrders: 342, avgOrderValue: 538.7 },
  byMethod: [
    { method: "Razorpay", revenue: 121400, orders: 214 },
    { method: "COD", revenue: 62850, orders: 128 },
  ],
  lowStock: [
    { _id: "d1", name: "Wireless Earbuds Pro", sku: "RJ-EAR-01", stock: 3, status: "LOW" },
    { _id: "d2", name: "Cotton Kurta (M)", sku: "RJ-KUR-11", stock: 0, status: "OUT_OF_STOCK" },
    { _id: "d3", name: "Steel Water Bottle", sku: "RJ-BOT-07", stock: 4, status: "LOW" },
    { _id: "d4", name: "LED Desk Lamp", sku: "RJ-LMP-02", stock: 2, status: "LOW" },
  ],
};

function StatCard({ icon: Icon, tint, label, value, sub }) {
  return (
    <div className="card animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="badge bg-emerald-50 text-emerald-600">
          <ArrowUpRight className="h-3.5 w-3.5" /> live
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [data, setData] = useState(DEMO);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rev, spend, low] = await Promise.all([
          AdminAPI.revenueBreakdown(),
          AdminAPI.totalSpending(),
          AdminAPI.lowStock(5),
        ]);
        if (!mounted) return;
        setData({
          revenue: rev.data.breakdown.realized,
          spending: spend.data.metrics,
          byMethod: rev.data.breakdown.byPaymentMethod || [],
          lowStock: low.data.lowStock || [],
        });
        setLive(true);
      } catch {
        if (mounted) setLive(false); // keep DEMO
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loading label="Fetching store analytics…" />;

  const { revenue, spending, byMethod, lowStock } = data;
  const methodTotal = byMethod.reduce((s, m) => s + (m.revenue || 0), 0) || 1;

  return (
    <div className="space-y-6">
      {!live && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-500">
          Showing demo data — start the backend (<code>npm run dev</code> in /backend) to load live metrics.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          tint="bg-emerald-50 text-emerald-600"
          label="Total Revenue"
          value={inr(revenue.totalRevenue)}
          sub={`Net product ${inr(revenue.netProductRevenue || 0)}`}
        />
        <StatCard
          icon={Users}
          tint="bg-brand-50 text-brand-600"
          label="Active Customers"
          value={spending.activePayingCustomers ?? 0}
          sub="Paying, lifetime"
        />
        <StatCard
          icon={ShoppingBag}
          tint="bg-violet-50 text-violet-600"
          label="Orders Placed"
          value={spending.totalOrders ?? 0}
          sub={`Avg ${inr(spending.avgOrderValue || 0)}`}
        />
        <StatCard
          icon={PackageX}
          tint="bg-rose-50 text-rose-600"
          label="Low Stock Items"
          value={lowStock.length}
          sub="At or below threshold"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Payment split */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Revenue by Payment</h3>
          </div>
          <div className="space-y-5">
            {byMethod.map((m) => {
              const pct = Math.round(((m.revenue || 0) / methodTotal) * 100);
              const isRzp = m.method === "Razorpay";
              return (
                <div key={m.method}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      {isRzp ? (
                        <CreditCard className="h-4 w-4 text-brand-600" />
                      ) : (
                        <Wallet className="h-4 w-4 text-emerald-600" />
                      )}
                      {m.method}
                    </span>
                    <span className="font-bold text-slate-900">{inr(m.revenue)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${isRzp ? "bg-brand-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {pct}% of revenue · {m.orders} orders
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low stock list */}
        <div className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900">Low Stock Alerts</h3>
            </div>
            <span className="badge bg-rose-50 text-rose-600">{lowStock.length} items</span>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStock.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                All products are well stocked. 🎉
              </p>
            )}
            {lowStock.map((p) => (
              <div key={p._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs font-medium text-slate-400">SKU {p.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">{p.stock} left</span>
                  <StatusPill
                    status={p.status === "OUT_OF_STOCK" ? "Cancelled" : "Processing"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
