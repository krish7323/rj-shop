// src/pages/Orders.jsx
// Fulfilment feed: global order overview (GET /api/orders/all) with payment
// method, status pills and Shiprocket tracking id — the admin tracking summary.

import { useEffect, useState } from "react";
import { ShoppingBag, RefreshCw, CreditCard, Wallet, Truck } from "lucide-react";
import { OrderAPI } from "../lib/api";
import { inr, dateShort } from "../lib/format";
import { Loading, Empty, StatusPill } from "../components/ui";

const DEMO_ORDERS = [
  { _id: "o1", user: { name: "Ananya Sharma" }, totalPrice: 2499, paymentMethod: "Razorpay", paymentStatus: "Paid", status: "Shipped", shiprocketTrackingId: "SR123456789", createdAt: "2026-07-05" },
  { _id: "o2", user: { name: "Rohit Verma" }, totalPrice: 899, paymentMethod: "COD", paymentStatus: "Pending", status: "Confirmed", shiprocketTrackingId: "", createdAt: "2026-07-06" },
  { _id: "o3", user: { name: "Priya Nair" }, totalPrice: 1748, paymentMethod: "Razorpay", paymentStatus: "Paid", status: "Delivered", shiprocketTrackingId: "SR987654321", createdAt: "2026-07-01" },
  { _id: "o4", user: { name: "Karan Mehta" }, totalPrice: 449, paymentMethod: "COD", paymentStatus: "Pending", status: "Pending", shiprocketTrackingId: "", createdAt: "2026-07-08" },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ totalValue: 0, avgOrderValue: 0 });
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await OrderAPI.all({ limit: 50 });
      setOrders(res.data.orders || []);
      setSummary(res.data.summary || { totalValue: 0, avgOrderValue: 0 });
      setLive(true);
    } catch {
      setOrders(DEMO_ORDERS);
      setSummary({
        totalValue: DEMO_ORDERS.reduce((s, o) => s + o.totalPrice, 0),
        avgOrderValue: 1373.75,
      });
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-medium text-slate-500">Orders</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{orders.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-slate-500">Total Value</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{inr(summary.totalValue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-medium text-slate-500">Avg Order Value</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{inr(summary.avgOrderValue)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Order Fulfilment</h3>
          </div>
          <button onClick={load} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <Loading label="Loading orders…" />
        ) : orders.length === 0 ? (
          <Empty label="No orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Tracking</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      #{String(o._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {o.user?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        {o.paymentMethod === "Razorpay" ? (
                          <CreditCard className="h-4 w-4 text-brand-600" />
                        ) : (
                          <Wallet className="h-4 w-4 text-emerald-600" />
                        )}
                        {o.paymentMethod}
                        <StatusPill status={o.paymentStatus} />
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {o.shiprocketTrackingId ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                          <Truck className="h-3.5 w-3.5 text-violet-500" />
                          {o.shiprocketTrackingId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not shipped</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{dateShort(o.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                      {inr(o.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!live && !loading && (
          <div className="border-t border-slate-100 px-5 py-2.5 text-xs font-medium text-slate-400">
            Demo orders — connect the backend to load the live fulfilment feed.
          </div>
        )}
      </div>
    </div>
  );
}
