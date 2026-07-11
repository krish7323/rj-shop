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
import logo from "../assets/logo.png";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Overview & analytics" },
  { key: "inventory", label: "Inventory Management", icon: Boxes, hint: "Catalog & stock" },
  { key: "customers", label: "Customer Insights", icon: Users, hint: "Top spenders" },
  { key: "orders", label: "Orders", icon: ShoppingBag, hint: "Fulfilment feed" },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col bg-ink-900 text-slate-300">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <img src={logo} alt="RJ Mobile Store Logo" className="h-11 w-11 rounded-xl border border-brand-500 object-cover" />
        <div>
          <p className="text-sm font-extrabold tracking-tight text-white">RJ Mobile Store</p>
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

      <div className="px-4 pb-5">
        <button
          onClick={() => {
            localStorage.removeItem("rj_admin_token");
            window.location.reload();
          }}
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-ink-700/70 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
