// src/App.jsx
// Master shell for the RJ Shop storefront. Wraps the tree in CartProvider and
// orchestrates: catalog fetch + filtering, the responsive product grid, the
// product-detail modal overlay, the slide-over cart, and the checkout flow.

import { useEffect, useMemo, useState } from "react";
import { Loader2, PackageSearch, Sparkles, Star } from "lucide-react";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import Checkout from "./components/Checkout";
import AuthModal from "./components/AuthModal";
import OrdersModal from "./components/OrdersModal";
import { CatalogAPI, AuthAPI } from "./lib/api";
import { DEMO_CATALOG } from "./lib/format";
import logo from "./assets/logo.png";

function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplash(false);
    }, 2450);
    return () => clearTimeout(timer);
  }, []);

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

  const repairKits = useMemo(() => filtered.filter((p) => p.category === "Repair Kits"), [filtered]);
  const oldPhones = useMemo(() => filtered.filter((p) => p.category === "Old Phones"), [filtered]);
  const coolGadgets = useMemo(() => filtered.filter((p) => p.category === "Cool Gadgets"), [filtered]);

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
      />

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
            {/* Section 1: Mobile Repair Kits */}
            {repairKits.length > 0 && (
              <section id="repair-kits" className="scroll-mt-24 bg-white p-5 rounded-3xl shadow-soft">
                <h3 className="mb-5 text-lg font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3">
                  <span className="text-xl">🛠️</span> Mobile Repair Kits & Tools
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {repairKits.map((p) => (
                    <ProductCard key={p._id} product={p} onOpen={setSelected} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: Old Phones */}
            {oldPhones.length > 0 && (
              <section id="old-phones" className="scroll-mt-24 bg-white p-5 rounded-3xl shadow-soft">
                <h3 className="mb-5 text-lg font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3">
                  <span className="text-xl">📱</span> Pre-Owned & Old Phones
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {oldPhones.map((p) => (
                    <ProductCard key={p._id} product={p} onOpen={setSelected} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: Cool Gadgets */}
            {coolGadgets.length > 0 && (
              <section id="cool-gadgets" className="scroll-mt-24 bg-white p-5 rounded-3xl shadow-soft">
                <h3 className="mb-5 text-lg font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3">
                  <span className="text-xl">⚡</span> Cool Gadgets & Accessories
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {coolGadgets.map((p) => (
                    <ProductCard key={p._id} product={p} onOpen={setSelected} />
                  ))}
                </div>
              </section>
            )}
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
