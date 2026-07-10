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
import { CatalogAPI } from "./lib/api";
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

  // Client-side filtering by category + search term.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = category === "All" || p.category === category;
      const termOk =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term);
      return catOk && termOk;
    });
  }, [products, category, search]);

  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div id="top" className="min-h-screen bg-slate-100">
      <Navbar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={setCategory}
        onCartClick={() => setCartOpen(true)}
      />

      {/* Hero banner */}
      <section className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-10 sm:py-14">
          <span className="chip bg-accent-500/20 text-accent-400">
            <Sparkles className="h-3.5 w-3.5" /> Premium picks, everyday prices
          </span>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Shop smarter at <span className="text-accent-400">RJ Shop</span> — quality you can trust.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Secure Razorpay & Cash-on-Delivery payments, fast Shiprocket shipping, and a
            dynamic catalog updated in real time.
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
            <span className="flex items-center gap-1 text-accent-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent-400" />
              ))}
            </span>
            Rated 4.6/5 by thousands of happy shoppers
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            {category === "All" ? "All Products" : category}
            <span className="ml-2 text-sm font-medium text-slate-400">
              {filtered.length} item{filtered.length === 1 ? "" : "s"}
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
            <p className="text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p) => (
              <ProductCard key={p._id} product={p} onOpen={setSelected} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} RJ Shop. All rights reserved.</p>
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
