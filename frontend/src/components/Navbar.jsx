// src/components/Navbar.jsx
// Premium storefront header: brand, live search, category shortcuts, and a
// dynamic floating cart counter that animates as items are added.

import { useEffect, useState } from "react";
import { Search, ShoppingCart, User, LogOut, ShoppingBag, Menu } from "lucide-react";
import { useCart } from "../context/CartContext";
import logo from "../assets/logo.png";

const CATEGORIES = ["All", "Repair Kits", "Old Phones", "Cool Gadgets"];

export default function Navbar({ search, onSearch, category, onCategory, onCartClick, user, onAuthClick, onOrdersClick, onLogout, onMenuClick }) {
  const { count } = useCart();
  const [bump, setBump] = useState(false);

  // Bump the cart badge whenever the count changes.
  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <header className="sticky top-0 z-30 shadow-soft">
      {/* Top bar */}
      <div className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          {/* Brand */}
          <a href="#top" className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="RJ Mobile Store Logo" className="h-9 w-9 rounded-lg border border-accent-400 object-cover" />
            <span className="text-lg font-extrabold tracking-tight">
              RJ<span className="text-accent-400"> Mobile Store</span>
            </span>
          </a>

          {/* Search */}
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search RJ Mobile Store for kits, phones and gadgets…"
              className="w-full rounded-full border border-transparent bg-white px-5 py-2.5 pr-12 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-accent-400/40"
              aria-label="Search products"
            />
            <span className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-accent-500">
              <Search className="h-4 w-4 text-navy-900" />
            </span>
          </div>

          {/* Cart */}
          <button
            onClick={onCartClick}
            className="relative flex shrink-0 items-center gap-2 rounded-full px-3 py-2 transition hover:bg-navy-700"
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {count > 0 && (
                <span
                  className={`absolute -right-2 -top-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-extrabold text-navy-900 ${
                    bump ? "animate-pop" : ""
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
            <span className="hidden text-sm font-semibold sm:block">Cart</span>
          </button>

          {/* User Profile / Login Actions */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOrdersClick}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition hover:bg-navy-700 text-slate-200"
                title="My Orders"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden text-sm font-semibold sm:block">My Orders</span>
              </button>
              
              <div className="flex items-center gap-1 border-l border-navy-700 pl-2.5">
                <span className="hidden text-xs font-semibold text-slate-300 md:block max-w-[100px] truncate">
                  Hi, {user.name.split(" ")[0]}
                </span>
                <button
                  onClick={onLogout}
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-navy-700 hover:text-white transition"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="btn-accent shrink-0 rounded-full px-4.5 py-2 text-xs font-extrabold"
            >
              Sign In
            </button>
          )}

          {/* Hamburger Menu Trigger */}
          <button
            onClick={onMenuClick}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-300 hover:bg-navy-700 hover:text-white transition ml-1"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Category shortcuts */}
      <div className="bg-navy-800 text-slate-200">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
          <span className="mr-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <img src={logo} alt="" className="h-[18px] w-[18px] rounded-md object-cover border border-accent-400/30" />
            <span>Shop Sections</span>
          </span>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => onCategory(c)}
                className={`chip whitespace-nowrap text-slate-300 hover:bg-navy-700 hover:text-white`}
              >
                {c === "All" ? "🔝 Top" : c}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
