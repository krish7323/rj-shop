// src/components/ui.jsx
// Small shared presentational helpers reused across pages.

import { Loader2, AlertTriangle, Inbox } from "lucide-react";

export function Loading({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorNote({ message, hint }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{message}</p>
        {hint && <p className="mt-0.5 text-xs text-amber-700/80">{hint}</p>}
      </div>
    </div>
  );
}

export function Empty({ label = "Nothing here yet." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
      <Inbox className="h-8 w-8" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    Pending: "bg-slate-100 text-slate-600",
    Confirmed: "bg-blue-50 text-blue-600",
    Processing: "bg-indigo-50 text-indigo-600",
    Shipped: "bg-violet-50 text-violet-600",
    Delivered: "bg-emerald-50 text-emerald-600",
    Cancelled: "bg-rose-50 text-rose-600",
    Returned: "bg-orange-50 text-orange-600",
    Paid: "bg-emerald-50 text-emerald-600",
    Failed: "bg-rose-50 text-rose-600",
    Refunded: "bg-orange-50 text-orange-600",
  };
  return (
    <span className={`badge ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>
  );
}
