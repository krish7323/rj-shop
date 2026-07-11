// src/App.jsx
// Root shell for the RJ Shop admin panel.
// Lightweight view-router toggle (no external router) that swaps pages inside a
// premium layout with a persistent Sidebar and a contextual Topbar.

import { useState, useEffect } from "react";
import { Bell, Search, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import UsersList from "./pages/UsersList";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import { AuthAPI, OrderAPI } from "./lib/api";

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
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("rj_admin_token"));

  // Polling hook to look for new orders
  useEffect(() => {
    const token = localStorage.getItem("rj_admin_token");
    if (!token) return;

    const checkNewOrders = async () => {
      try {
        const res = await OrderAPI.all({ limit: 1 });
        const latest = res.data.orders?.[0];
        if (latest) {
          if (lastOrderId && latest._id !== lastOrderId) {
            setNewOrderAlert(latest);
            // Play notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
              audio.play();
            } catch (e) {
              console.warn("Audio play blocked by browser policy");
            }
          }
          setLastOrderId(latest._id);
        }
      } catch (e) {
        console.error("Failed to poll new orders:", e.message);
      }
    };

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 10000);
    return () => clearInterval(interval);
  }, [lastOrderId]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { title, subtitle, Component } = VIEWS[view];

  if (!loggedIn) {
    return <Login onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      <Sidebar active={view} onNavigate={setView} isOpen={sidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 active:scale-[.97]"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="text-sm font-medium text-slate-400">{subtitle}</p>
            </div>
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

            <button
              onClick={() => {
                if (newOrderAlert) {
                  setView("orders");
                  setNewOrderAlert(null);
                }
              }}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              <Bell className="h-5 w-5" />
              {newOrderAlert && (
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
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

      {/* Toast Alert */}
      {newOrderAlert && (
        <div className="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2 rounded-2xl border-l-4 border-emerald-500 bg-white p-4 shadow-soft animate-fade-up">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔔</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800">New Order Received!</h4>
              <p className="mt-0.5 text-xs text-slate-600">
                Customer: <span className="font-semibold">{newOrderAlert.shippingAddress?.fullName}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Total: <span className="font-extrabold text-emerald-600">₹{newOrderAlert.totalPrice}</span> · ID: #{String(newOrderAlert._id).slice(-6).toUpperCase()}
              </p>
            </div>
            <button onClick={() => setNewOrderAlert(null)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>
          <button
            onClick={() => {
              setView("orders");
              setNewOrderAlert(null);
            }}
            className="mt-2 text-center text-xs font-bold text-brand-600 hover:underline"
          >
            View all orders
          </button>
        </div>
      )}
    </div>
  );
}
