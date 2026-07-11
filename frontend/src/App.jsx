// src/App.jsx
// Master shell for the RJ Shop storefront. Wraps the tree in CartProvider and
// orchestrates: catalog fetch + filtering, the responsive product grid, the
// product-detail modal overlay, the slide-over cart, and the checkout flow.

import { useEffect, useMemo, useState } from "react";
import { Loader2, PackageSearch, Sparkles, Star, X, MapPin, MessageCircle } from "lucide-react";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import Checkout from "./components/Checkout";
import AuthModal from "./components/AuthModal";
import OrdersModal from "./components/OrdersModal";
import { CatalogAPI, AuthAPI, CategoryAPI } from "./lib/api";
import { DEMO_CATALOG } from "./lib/format";
import logo from "./assets/logo.png";

function Storefront() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplash(false);
    }, 2450);
    return () => clearTimeout(timer);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await CategoryAPI.list();
      setCategories(res.data.categories || []);
    } catch {
      setCategories([
        { _id: "1", name: "Repair Kits", icon: "🛠️" },
        { _id: "2", name: "Old Phones", icon: "📱" },
        { _id: "3", name: "Cool Gadgets", icon: "⚡" },
      ]);
    }
  };

  // UI state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null); // product for modal
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Auth states
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load user profile on startup if token exists
  const fetchProfile = async () => {
    const token = localStorage.getItem("rj_token");
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await AuthAPI.me();
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("rj_token");
      setUser(null);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, []);

  // Fetch catalog once (falls back to demo data if backend is down).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await CatalogAPI.list({ limit: 60 });
        if (!mounted) return;
        const list = res.data.products || [];
        setProducts(list.length ? list : DEMO_CATALOG);
        setLive(list.length > 0);
      } catch {
        if (mounted) {
          setProducts(DEMO_CATALOG);
          setLive(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Client-side filtering by search term (categories are displayed as layout sections).
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const termOk =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term);
      return termOk;
    });
  }, [products, search]);

  const categorizedProducts = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      products: filtered.filter((p) => p.category === cat.name),
    }));
  }, [categories, filtered]);

  const openCheckout = () => {
    setCartOpen(false);
    if (!localStorage.getItem("rj_token")) {
      setAuthOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  };

  const handleScrollToSection = (cat) => {
    if (cat === "All") {
      document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    } else {
      const elementId = cat.toLowerCase().replace(/\s+/g, "-");
      document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (splash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] netflix-bg">
        <style>{`
          @keyframes netflixZoom {
            0% {
              transform: scale(0.4);
              filter: blur(8px) brightness(0.5);
              opacity: 0;
            }
            25% {
              opacity: 1;
              filter: blur(0px) brightness(1.2);
            }
            75% {
              transform: scale(1.05);
              filter: drop-shadow(0 0 25px rgba(0, 136, 255, 0.3));
            }
            100% {
              transform: scale(1.12);
              filter: drop-shadow(0 0 40px rgba(0, 136, 255, 0.5));
              opacity: 0;
            }
          }
          @keyframes netflixBg {
            0% { background-color: #030712; }
            85% { background-color: #030712; opacity: 1; }
            100% { background-color: #030712; opacity: 0; }
          }
          .netflix-bg {
            animation: netflixBg 2.5s forwards cubic-bezier(0.77, 0, 0.175, 1);
          }
          .netflix-logo {
            animation: netflixZoom 2.5s forwards cubic-bezier(0.77, 0, 0.175, 1);
          }
        `}</style>
        <img
          src={logo}
          alt="RJ Mobile Store Logo"
          className="w-72 h-72 md:w-96 md:h-96 object-contain netflix-logo"
        />
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-slate-100 scroll-smooth">
      <Navbar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={handleScrollToSection}
        onCartClick={() => setCartOpen(true)}
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onOrdersClick={() => setOrdersOpen(true)}
        onLogout={() => {
          localStorage.removeItem("rj_token");
          setUser(null);
        }}
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* Sliding Sidebar Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer content box */}
          <div className="relative flex w-80 max-w-xs flex-col bg-navy-900 text-slate-105 shadow-hover animate-slide-right h-full border-r border-navy-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-navy-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="h-7 w-7 rounded border border-accent-400/20 object-cover" />
                <span className="text-sm font-extrabold tracking-wide uppercase text-white">RJ Store Menu</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-navy-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* User Account / Profile Section */}
              <div className="bg-navy-800 rounded-2xl p-4 border border-navy-700">
                {user ? (
                  <div className="space-y-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged In As</span>
                      <p className="text-sm font-extrabold text-white mt-0.5">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    {user.phone && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Mobile</span>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">💬 +91 {user.phone}</p>
                      </div>
                    )}

                    {user.currentDevice && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Phone</span>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">📱 {user.currentDevice}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-navy-700 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          setOrdersOpen(true);
                        }}
                        className="btn-accent py-2 text-xs font-bold w-full rounded-xl text-center"
                      >
                        📦 View My Orders
                      </button>
                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          localStorage.removeItem("rj_token");
                          setUser(null);
                        }}
                        className="w-full py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition text-center"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-xs text-slate-400">Sign in to place orders, verify OTP, and track your purchase history.</p>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        setAuthOpen(true);
                      }}
                      className="btn-accent py-2 text-xs font-extrabold w-full rounded-xl text-center"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">Shop Catalog</span>
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      handleScrollToSection("All");
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition text-left w-full"
                  >
                    🔝 Top / Home
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id || cat.name}
                      onClick={() => {
                        setDrawerOpen(false);
                        handleScrollToSection(cat.name);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition text-left w-full"
                    >
                      <span>{cat.icon || "📁"}</span> {cat.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Store contact info */}
              {/* Store contact info */}
              <div className="space-y-2 pt-4 border-t border-navy-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">Connect With Us</span>
                <a
                  href="https://maps.google.com/?q=MG+Road+Mobile+Store"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition w-full"
                >
                  <MapPin className="h-4 w-4 text-accent-400 shrink-0" />
                  <span>Visit Physical Store</span>
                </a>
                <a
                  href="https://instagram.com/rjmobilerepairing"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition w-full"
                >
                  <svg className="h-4 w-4 text-pink-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span>Instagram Profile</span>
                </a>
                <a
                  href="https://facebook.com/rjmobilerepairing"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition w-full"
                >
                  <svg className="h-4 w-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span>Facebook Page</span>
                </a>
                <a
                  href="https://youtube.com/@rjmobile-repairing"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-300 hover:bg-navy-800 hover:text-white transition w-full"
                >
                  <svg className="h-4 w-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
                  </svg>
                  <span>YouTube Channel</span>
                </a>
              </div>
            </div>

            {/* Footer brand stamp */}
            <div className="border-t border-navy-800 p-4 text-center">
              <p className="text-[10px] text-slate-500 font-medium">© 2026 RJ Mobile Store.</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero banner */}
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-10 sm:py-14 sm:flex-row sm:items-center sm:gap-6">
          <img src={logo} alt="RJ Mobile Store Logo" className="h-20 w-20 rounded-2xl border-2 border-accent-400 shadow-lg shrink-0" />
          <div className="flex flex-col gap-2">
            <span className="chip bg-accent-500/20 text-accent-400 self-start">
              <Sparkles className="h-3.5 w-3.5" /> Smart choice, Better life
            </span>
            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
              Welcome to <span className="text-accent-400">RJ Mobile Store</span>
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Your local destination for precision mobile repair kits, high-quality pre-owned devices, and cool smart gadgets.
            </p>
            <a
              href="https://g.page/r/CfQowZnHRUxZECI"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-xs font-bold text-navy-900 shadow-soft transition hover:bg-accent-400 active:scale-[.97]"
            >
              📍 Visit Physical Store / Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="mx-auto max-w-7xl px-4 mt-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-soft hover:shadow-card transition duration-300">
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">100% Tested Devices</h4>
              <p className="text-[10px] text-slate-400">40+ checkpoints checklist</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-soft hover:shadow-card transition duration-300">
            <span className="text-2xl">🛠️</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Premium Repair Kits</h4>
              <p className="text-[10px] text-slate-400">Original S2 alloy steel tools</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-soft hover:shadow-card transition duration-300">
            <span className="text-2xl">💬</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">WhatsApp Live Chat</h4>
              <p className="text-[10px] text-slate-400">Direct query & orders response</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-soft hover:shadow-card transition duration-300">
            <span className="text-2xl">🚗</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Store Pickup / COD</h4>
              <p className="text-[10px] text-slate-400">Locally hosted MG Road store</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">
            Store Catalog
            <span className="ml-2 text-sm font-medium text-slate-400">
              {filtered.length} item{filtered.length === 1 ? "" : "s"} total
            </span>
          </h2>
          {!live && !loading && (
            <span className="chip bg-white text-slate-400 shadow-card">Demo catalog</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-medium">Loading products…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <PackageSearch className="h-12 w-12" />
            <p className="font-semibold">No products found</p>
            <p className="text-sm">Try a different search query.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categorizedProducts.map((group) => {
              if (group.products.length === 0) return null;
              const elementId = group.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <section key={group._id || group.name} id={elementId} className="scroll-mt-24 bg-white p-5 rounded-3xl shadow-soft">
                  <h3 className="mb-5 text-lg font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3">
                    <span className="text-xl">{group.icon || "📁"}</span> {group.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {group.products.map((p) => (
                      <ProductCard key={p._id} product={p} onOpen={setSelected} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Social Proof & Trust Factors */}
        <TestimonialsSection />
        <FAQSection />
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row">
          <div>
            <p>© {new Date().getFullYear()} RJ Mobile Store. All rights reserved.</p>
            <a href="https://g.page/r/CfQowZnHRUxZECI" target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-accent-600 hover:underline">
              📍 Find us on Google Maps (Directions)
            </a>
          </div>
        </div>
      </footer>

      {/* Overlays */}
      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={openCheckout} />

      {checkoutOpen && <Checkout onClose={() => setCheckoutOpen(false)} />}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={fetchProfile} />}

      {ordersOpen && <OrdersModal onClose={() => setOrdersOpen(false)} />}
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Do you offer warranty on Old/Refurbished phones?",
      a: "Yes! Every pre-owned phone sold by RJ Mobile Store comes with a 6-month warranty on manufacturing defects, plus a 7-day easy replacement policy."
    },
    {
      q: "Can I buy online and collect in-store today?",
      a: "Absolutely! Just place the order or message us on WhatsApp, and we will keep the items ready at our local store for immediate pickup."
    },
    {
      q: "Are the repair kits beginner-friendly?",
      a: "Yes! Our kits (like the 24-in-1 Precision Screwdriver Set) are curated for both absolute beginners and professional technicians. We also offer free guidance via WhatsApp if you get stuck."
    },
    {
      q: "What is your refund policy for online orders?",
      a: "We offer a 100% money-back guarantee if the item is damaged in transit or doesn't match the description. Contact us on WhatsApp for instant assistance."
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="bg-white p-6 rounded-3xl shadow-soft mt-10">
      <h3 className="mb-6 text-xl font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3">
        <span>❓</span> Frequently Asked Questions
      </h3>
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border-b border-slate-100 pb-3">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex justify-between items-center text-left font-bold text-slate-700 hover:text-accent-500 transition py-2"
              >
                <span>{faq.q}</span>
                <span className="text-xl text-slate-400">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="mt-2 text-sm text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-2xl animate-fade-up">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const reviews = [
    {
      name: "Rohan Sharma",
      role: "Local Customer",
      avatar: "https://picsum.photos/seed/rohan/100/100",
      rating: 5,
      text: "Bought a refurbished OnePlus 9 from here. The screen is perfect, battery health is 89%, and they gave me a free charging cable! Highly recommended."
    },
    {
      name: "Pooja Hegde",
      role: "Verified Buyer",
      avatar: "https://picsum.photos/seed/pooja/100/100",
      rating: 5,
      text: "The B-7000 adhesive and screwdriver kit saved my cracked iPhone screen. Ordering via WhatsApp was super easy, got delivery in 2 days."
    },
    {
      name: "Amit Patel",
      role: "DIY Hobbyist",
      avatar: "https://picsum.photos/seed/amit/100/100",
      rating: 5,
      text: "Excellent service. Visited their local shop for picking up the 3-in-1 charger stand. The staff was polite and let me test the product before paying."
    }
  ];

  return (
    <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-soft mt-10">
      <h3 className="mb-6 text-xl font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3">
        <span>⭐</span> What Our Customers Say
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-card hover:shadow-hover transition duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[...Array(r.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-slate-600 text-sm italic">"{r.text}"</p>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
              <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">{r.name}</h4>
                <p className="text-[10px] text-slate-400">{r.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Storefront />
    </CartProvider>
  );
}
