// src/App.jsx
// Root shell for the RJ Shop admin panel.
// Lightweight view-router toggle (no external router) that swaps pages inside a
// premium layout with a persistent Sidebar and a contextual Topbar.

import { useState, useEffect } from "react";
import { Bell, Search, Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import logo from "./assets/logo.png";
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
  const [recentOrders, setRecentOrders] = useState([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Polling hook to look for new orders
  useEffect(() => {
    const token = localStorage.getItem("rj_admin_token");
    if (!token) return;

    const checkNewOrders = async () => {
      try {
        const res = await OrderAPI.all({ limit: 5 });
        const latest = res.data.orders?.[0];
        setRecentOrders(res.data.orders || []);
        setTotalOrdersCount(res.data.total || 0);
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

            {/* Show Logo when sidebar is closed */}
            {!sidebarOpen && (
              <img
                src={logo}
                alt="RJ Mobile Store Logo"
                className="h-10 w-10 rounded-xl border border-brand-500 object-cover"
              />
            )}

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

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setNewOrderAlert(null); // Clear unread dot on open
                }}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 active:scale-[.97]"
              >
                <Bell className="h-5 w-5" />
                {newOrderAlert && (
                  <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-fade-up">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      Total: {totalOrdersCount} Orders
                    </span>
                  </div>

                  <div className="mt-3 max-h-64 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
                    {recentOrders.length === 0 ? (
                      <p className="py-4 text-center text-xs font-medium text-slate-400">No orders found.</p>
                    ) : (
                      recentOrders.map((ord) => (
                        <div
                          key={ord._id}
                          onClick={() => {
                            setView("orders");
                            setShowNotifications(false);
                          }}
                          className="group cursor-pointer pt-2.5 first:pt-0 hover:opacity-80 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition">
                                New Order #{ord._id.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">
                                By {ord.user?.name || "Guest Customer"}
                              </p>
                            </div>
                            <span className="text-xs font-extrabold text-slate-800">
                              ₹{ord.totalPrice}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                            <span>{ord.paymentMethod} · {ord.status}</span>
                            <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2.5 text-center">
                    <button
                      onClick={() => {
                        setView("orders");
                        setShowNotifications(false);
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-500 transition"
                    >
                      View all orders
                    </button>
                  </div>
                </div>
              )}
            </div>

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
