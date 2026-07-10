// src/App.jsx
// Root shell for the RJ Shop admin panel.
// Lightweight view-router toggle (no external router) that swaps pages inside a
// premium layout with a persistent Sidebar and a contextual Topbar.

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import UsersList from "./pages/UsersList";
import Orders from "./pages/Orders";
import { AuthAPI } from "./lib/api";

// View registry maps the sidebar keys to page components + header metadata.
const VIEWS = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Store performance at a glance",
    Component: Dashboard,
  },
  inventory: {
    title: "Inventory Management",
    subtitle: "Manage your dynamic catalog",
    Component: Inventory,
  },
  customers: {
    title: "Customer Insights",
    subtitle: "Your highest-value shoppers",
    Component: UsersList,
  },
  orders: {
    title: "Orders",
    subtitle: "Track fulfilment & payments",
    Component: Orders,
  },
};

export default function App() {
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    (async () => {
      if (!localStorage.getItem("rj_admin_token")) {
        try {
          const res = await AuthAPI.login("admin@rjshop.com", "admin123");
          if (res.data.success && res.data.token) {
            localStorage.setItem("rj_admin_token", res.data.token);
            console.log("✅ Admin auto-logged in as admin@rjshop.com");
            window.location.reload();
          }
        } catch (err) {
          console.warn("⚠️ Admin auto-login failed:", err.message);
        }
      }
    })();
  }, []);

  const { title, subtitle, Component } = VIEWS[view];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={view} onNavigate={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="text-sm font-medium text-slate-400">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search…"
                className="input w-64 pl-9"
                aria-label="Global search"
              />
            </div>

            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                RJ
              </span>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-tight text-slate-800">Store Owner</p>
                <p className="text-[11px] font-medium leading-tight text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto p-6">
          <div key={view} className="animate-fade-up">
            <Component />
          </div>
        </main>
      </div>
    </div>
  );
}
