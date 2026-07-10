// src/components/ProductModal.jsx
// Product detail overlay: large image, full pricing, stock, rating, description,
// a quantity selector and an Add-to-Cart action.

import { useState } from "react";
import { X, Star, ShoppingCart, Check, Plus, Minus, ImageOff, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { inr, discountPct } from "../lib/format";

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (!product) return null;

  const pct = discountPct(product.price, product.mrp);
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const cap = product.stock !== undefined ? product.stock : 99;
  const img = product.images && product.images.length ? product.images[0] : "";

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-900/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl bg-white shadow-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end p-3">
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 pb-8 md:grid-cols-2 md:px-8">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50">
            {img && !imgFailed ? (
              <img src={img} alt={product.name} onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-slate-300">
                <ImageOff className="h-12 w-12" />
              </div>
            )}
            {pct > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-sm font-extrabold text-white shadow">
                -{pct}% OFF
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-600">
              {product.brand || product.category}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">{product.name}</h2>

            {product.rating > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  {product.rating.toFixed(1)} <Star className="h-3 w-3 fill-white" />
                </span>
                <span className="text-sm text-slate-400">{product.numReviews || 0} ratings</span>
              </div>
            )}

            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-slate-900">{inr(product.price)}</span>
              {pct > 0 && <span className="mb-1 text-lg text-slate-400 line-through">{inr(product.mrp)}</span>}
              {pct > 0 && <span className="mb-1 text-sm font-bold text-emerald-600">Save {pct}%</span>}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>

            {/* Stock */}
            <p className={`mt-3 text-sm font-semibold ${outOfStock ? "text-rose-600" : "text-emerald-600"}`}>
              {outOfStock ? "Currently out of stock" : "In stock — ready to ship"}
            </p>

            {/* Qty + add */}
            {!outOfStock && (
              <div className="mt-5 flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-full border border-slate-200">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(cap, q + 1))} disabled={qty >= cap} className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button onClick={handleAdd} className={`btn-accent flex-1 ${added ? "!bg-emerald-500 !text-white" : ""}`}>
                  {added ? (
                    <>
                      <Check className="h-4 w-4" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-accent-600" /> Secure Razorpay & COD
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <Truck className="h-4 w-4 text-accent-600" /> Shiprocket delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
