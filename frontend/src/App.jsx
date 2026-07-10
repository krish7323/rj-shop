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
import { CatalogAPI, AuthAPI } from "./lib/api";
import { DEMO_CATALOG } from "./lib/format";

function Storefront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null); // product for modal
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Fetch catalog once (falls back to demo data if backend is down).
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Silent auto-login for development if no token is found
      if (!localStorage.getItem("rj_token")) {
        try {
          const loginRes = await AuthAPI.login("customer@rjshop.com", "customer123");
          if (loginRes.data.success && loginRes.data.token) {
            localStorage.setItem("rj_token", loginRes.data.token);
            console.log("✅ Storefront auto-logged in as customer@rjshop.com");
          }
        } catch (err) {
          console.warn("⚠️ Storefront auto-login failed:", err.message);
        }
      }

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
    setCheckoutOpen(true);
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
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} RJ Mobile Store. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Powered by MERN · Razorpay · Shiprocket
          </p>
        </div>
      </footer>

      {/* Overlays */}
      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={openCheckout} />

      {checkoutOpen && <Checkout onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Storefront />
    </CartProvider>
  );
}
