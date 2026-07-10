// src/components/Sidebar.jsx
// Premium navigation rail for the RJ Shop admin panel.

import {
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingBag,
  Store,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Overview & analytics" },
  { key: "inventory", label: "Inventory Management", icon: Boxes, hint: "Catalog & stock" },
  { key: "customers", label: "Customer Insights", icon: Users, hint: "Top spenders" },
  { key: "orders", label: "Orders", icon: ShoppingBag, hint: "Fulfilment feed" },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col bg-ink-900 text-slate-300">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft">
          <Store className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-tight text-white">RJ Shop</p>
          <p className="text-xs font-medium text-slate-400">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map(({ key, label, icon: Icon, hint }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={[
                "group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition",
                isActive
                  ? "bg-brand-600/95 text-white shadow-soft"
                  : "text-slate-300 hover:bg-ink-700/70 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-9 w-9 place-items-center rounded-lg transition",
                  isActive ? "bg-white/15" : "bg-ink-700 group-hover:bg-ink-800",
                ].join(" ")}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold leading-tight">{label}</span>
                <span
                  className={[
                    "block text-[11px] leading-tight",
                    isActive ? "text-brand-100" : "text-slate-500",
                  ].join(" ")}
                >
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Upgrade / footer card */}
      <div className="px-4 pb-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-bold">Premium Suite</span>
          </div>
          <p className="text-xs leading-relaxed text-brand-100">
            Razorpay, COD & Shiprocket hooks are live on your storefront.
          </p>
        </div>

        <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-ink-700/70 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
